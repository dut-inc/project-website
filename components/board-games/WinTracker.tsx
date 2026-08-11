"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getDatabaseErrorMessage } from "@/lib/boardGamesDatabase";

type WinTrackerProps = {
  gameId: string;
  gameName: string;
  isEditable: boolean;
};

type Player = {
  id: string;
  name: string;
};

type Session = {
  id: string;
  playedAt: string;
  winnerNames: string[];
  participantNames: string[];
};

type DatabaseRecord = Record<string, unknown>;

function asRecord(value: unknown): DatabaseRecord | null {
  return typeof value === "object" && value !== null ? (value as DatabaseRecord) : null;
}

function asId(value: unknown): string | null {
  if (typeof value === "number" && Number.isSafeInteger(value)) return String(value);
  if (typeof value === "string" && value.length > 0) return value;
  return null;
}

function asName(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function isPermissionError(error: unknown) {
  const candidate = error as { code?: string; message?: string } | null;
  const message = error instanceof Error ? error.message : candidate?.message ?? JSON.stringify(error);
  const normalized = message.toLowerCase();
  return (
    candidate?.code === "42501" ||
    normalized.includes("permission denied") ||
    normalized.includes("row-level security") ||
    normalized.includes("relation") && normalized.includes("does not exist")
  );
}

function parsePlayer(row: unknown): Player | null {
  const record = asRecord(row);
  const id = asId(record?.id);
  const name = asName(record?.name);
  return id && name ? { id, name } : null;
}

function parseSession(row: unknown): Session | null {
  const record = asRecord(row);
  const id = asId(record?.id);
  const playedAt = typeof record?.played_at === "string" ? record.played_at : null;

  if (!id || !playedAt) return null;

  const participants = Array.isArray(record?.session_participants)
    ? record.session_participants
        .map((participant) => {
          const participantRecord = asRecord(participant);
          const player = asRecord(participantRecord?.players);
          const name = asName(player?.name);
          const isWinner = participantRecord?.is_winner === true;
          return name ? { name, isWinner } : null;
        })
        .filter((participant): participant is { name: string; isWinner: boolean } => participant !== null)
    : [];

  return {
    id,
    playedAt,
    winnerNames: participants.filter((participant) => participant.isWinner).map((participant) => participant.name),
    participantNames: participants.map((participant) => participant.name),
  };
}

export default function WinTracker({ gameId, gameName, isEditable }: WinTrackerProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedWinnerId, setSelectedWinnerId] = useState("");
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const effectiveWinnerId = selectedWinnerId || players[0]?.id || "";

  const loadTracker = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const [playersResult, sessionsResult] = await Promise.all([
        supabase.from("players").select("id, name").order("name", { ascending: true }),
        supabase
          .from("game_sessions")
          .select("id, played_at, session_participants(player_id, is_winner, players(id, name))")
          .eq("board_game_id", Number(gameId))
          .order("played_at", { ascending: false }),
      ]);

      if (playersResult.error) throw playersResult.error;
      if (sessionsResult.error) throw sessionsResult.error;

      setPlayers(
        (playersResult.data ?? [])
          .map(parsePlayer)
          .filter((player): player is Player => player !== null),
      );
      setSessions(
        (sessionsResult.data ?? [])
          .map(parseSession)
          .filter((session): session is Session => session !== null),
      );
    } catch (caughtError) {
      setError(
        isPermissionError(caughtError)
          ? "The scorebook tables are not enabled for the browser yet. Run the latest supabase/schema.sql in Supabase, then refresh."
          : getDatabaseErrorMessage(caughtError),
      );
    } finally {
      setIsLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    // The initial fetch synchronizes this game's scorebook with Supabase.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTracker();
  }, [loadTracker]);

  const leaderboard = useMemo(() => {
    const wins = new Map<string, number>();
    for (const session of sessions) {
      for (const winner of session.winnerNames) {
        wins.set(winner, (wins.get(winner) ?? 0) + 1);
      }
    }

    return [...wins.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
  }, [sessions]);

  function toggleParticipant(playerId: string) {
    setSelectedParticipantIds((current) =>
      current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId],
    );
  }

  async function addPlayer() {
    const name = newPlayerName.trim();
    if (!name || !isEditable) return;

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = createClient();
      const { data, error: queryError } = await supabase
        .from("players")
        .insert({ name })
        .select("id, name")
        .single();
      if (queryError) throw queryError;

      const player = parsePlayer(data);
      if (!player) throw new Error("The new player could not be read back from Supabase.");
      setPlayers((current) => [...current, player].sort((left, right) => left.name.localeCompare(right.name)));
      setSelectedWinnerId(player.id);
      setSelectedParticipantIds((current) => (current.includes(player.id) ? current : [...current, player.id]));
      setNewPlayerName("");
      setNotice(`${player.name} is ready to play.`);
    } catch (caughtError) {
      setError(
        isPermissionError(caughtError)
          ? "Supabase rejected this player write. Run the latest supabase/schema.sql to grant browser access to the scorebook tables."
          : getDatabaseErrorMessage(caughtError),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function saveSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isEditable) return;

    if (!effectiveWinnerId) {
      setError("Choose a winner before logging the session.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = createClient();
      const { data: session, error: sessionError } = await supabase
        .from("game_sessions")
        .insert({
          board_game_id: Number(gameId),
        })
        .select("id")
        .single();
      if (sessionError) throw sessionError;

      const participantIds = [...new Set([...selectedParticipantIds, effectiveWinnerId])];
      const { error: participantError } = await supabase.from("session_participants").insert(
        participantIds.map((playerId) => ({
          session_id: session.id,
          player_id: Number(playerId),
          is_winner: playerId === effectiveWinnerId,
        })),
      );

      if (participantError) {
        await supabase.from("game_sessions").delete().eq("id", session.id);
        throw participantError;
      }

      const winnerName = players.find((player) => player.id === effectiveWinnerId)?.name ?? "Winner";
      setNotice(`${winnerName} won ${gameName}.`);
      setSelectedParticipantIds([]);
      await loadTracker();
    } catch (caughtError) {
      setError(
        isPermissionError(caughtError)
          ? "Supabase rejected this result. Run the latest supabase/schema.sql to grant browser access to the scorebook tables."
          : getDatabaseErrorMessage(caughtError),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSession(session: Session) {
    if (!isEditable || !window.confirm(`Remove the ${gameName} result from ${formatDate(session.playedAt)}?`)) return;

    setError(null);
    setNotice(null);
    try {
      const supabase = createClient();
      const { error: queryError } = await supabase.from("game_sessions").delete().eq("id", session.id);
      if (queryError) throw queryError;
      setSessions((current) => current.filter((entry) => entry.id !== session.id));
      setNotice("Session removed.");
    } catch (caughtError) {
      setError(
        isPermissionError(caughtError)
          ? "Supabase rejected this deletion. Run the latest supabase/schema.sql to grant browser access to the scorebook tables."
          : getDatabaseErrorMessage(caughtError),
      );
    }
  }

  return (
    <section className="mt-8 border-t border-shelf-paperDark/55 pt-6" aria-labelledby={`win-tracker-heading-${gameId}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-shelf-ink/70">match record</p>
          <h3 id={`win-tracker-heading-${gameId}`} className="mt-1 font-display text-2xl italic text-shelf-ink">
            {gameName} wins
          </h3>
        </div>
        <span className="rounded-full border border-shelf-paperDark/70 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-shelf-ink/65">
          {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
        </span>
      </div>

      {(error || notice) && (
        <div
          role={error ? "alert" : "status"}
          className={`mt-4 rounded-xl border px-3 py-2.5 text-sm ${
            error
              ? "border-shelf-burgundy/70 bg-shelf-burgundy/10 text-shelf-burgundy"
              : "border-shelf-forest/70 bg-shelf-forest/10 text-shelf-forest"
          }`}
        >
          {error ?? notice}
        </div>
      )}

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-shelf-ink/65">leaderboard</p>
          {isLoading ? (
            <p className="mt-3 rounded-lg bg-shelf-paperDark/20 px-3 py-4 text-center text-sm text-shelf-ink/65">Reading the scorebook…</p>
          ) : leaderboard.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-shelf-paperDark/60 px-3 py-4 text-sm text-shelf-ink/65">No wins logged for this game yet.</p>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {leaderboard.map((entry, index) => (
                <article key={entry.name} className="relative rounded-lg border border-shelf-paperDark/55 bg-shelf-paperDark/15 p-3">
                  <span className="absolute right-2 top-1 font-display text-2xl italic text-shelf-paperDark/75">{index + 1}</span>
                  <p className="truncate pr-6 font-display text-lg italic text-shelf-ink">{entry.name}</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-shelf-ink/65">
                    {entry.count} {entry.count === 1 ? "win" : "wins"}
                  </p>
                </article>
              ))}
            </div>
          )}

          <div className="mt-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-shelf-ink/65">recent sessions</p>
            <div className="mt-3 space-y-2">
              {sessions.length === 0 && !isLoading ? (
                <p className="rounded-lg bg-shelf-paperDark/15 px-3 py-3 text-sm text-shelf-ink/65">No sessions recorded yet.</p>
              ) : (
                sessions.slice(0, 5).map((session) => (
                  <article key={session.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-shelf-paperDark/15 px-3 py-2.5">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-shelf-ink/60">{formatDate(session.playedAt)}</p>
                      <p className="mt-1 text-xs text-shelf-ink/70">
                        {session.participantNames.length || 1} {session.participantNames.length === 1 ? "player" : "players"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-right text-sm font-medium text-shelf-ink">{session.winnerNames.join(", ") || "Winner not recorded"}</p>
                      {isEditable && (
                        <button type="button" onClick={() => void deleteSession(session)} className="rounded-full px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-shelf-burgundy/75 transition-colors hover:bg-shelf-burgundy/10 hover:text-shelf-burgundy">
                          Remove
                        </button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>

        <aside className="rounded-lg border border-shelf-paperDark/60 bg-shelf-paperDark/15 p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-shelf-ink/70">new result</p>
          <form className="mt-3 space-y-3" onSubmit={(event) => void saveSession(event)}>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-shelf-ink/75" htmlFor={`win-tracker-winner-${gameId}`}>
              Winner
              <select id={`win-tracker-winner-${gameId}`} value={effectiveWinnerId} onChange={(event) => setSelectedWinnerId(event.target.value)} disabled={!isEditable || players.length === 0} className="mt-1.5 w-full rounded-lg border border-shelf-paperDark/60 bg-white/45 px-2.5 py-2 font-body text-sm tracking-normal text-shelf-ink disabled:cursor-not-allowed disabled:opacity-55">
                {players.length === 0 ? <option value="">Add a player first</option> : players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
              </select>
            </label>
            <fieldset disabled={!isEditable || players.length === 0}>
              <legend className="font-mono text-[10px] uppercase tracking-wider text-shelf-ink/75">Players <span className="normal-case tracking-normal text-shelf-ink/55">(optional)</span></legend>
              <div className="mt-1.5 max-h-28 space-y-1 overflow-y-auto rounded-lg border border-shelf-paperDark/45 bg-white/20 p-1.5">
                {players.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-shelf-ink/65">Add a player below.</p>
                ) : (
                  players.map((player) => (
                    <label key={player.id} className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-xs transition-colors hover:bg-shelf-paperDark/25">
                      <input type="checkbox" checked={selectedParticipantIds.includes(player.id)} onChange={() => toggleParticipant(player.id)} className="accent-[#7B302E]" />
                      <span>{player.name}</span>
                    </label>
                  ))
                )}
              </div>
            </fieldset>
            <div className="flex gap-1.5">
              <input value={newPlayerName} onChange={(event) => setNewPlayerName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void addPlayer(); } }} disabled={!isEditable || isSaving} className="min-w-0 flex-1 rounded-lg border border-shelf-paperDark/60 bg-white/45 px-2.5 py-2 font-body text-xs text-shelf-ink placeholder:text-shelf-ink/55 disabled:opacity-55" placeholder="New player" aria-label="New player name" />
              <button type="button" onClick={() => void addPlayer()} disabled={!isEditable || isSaving || !newPlayerName.trim()} className="shrink-0 rounded-lg border border-shelf-paperDark/70 px-2.5 font-mono text-[9px] uppercase tracking-wider text-shelf-ink transition-colors hover:border-shelf-brass disabled:cursor-not-allowed disabled:opacity-50">
                Add
              </button>
            </div>
            <button type="submit" disabled={!isEditable || isSaving || players.length === 0} className="min-h-10 w-full rounded-full bg-shelf-walnut px-3 font-mono text-[9px] uppercase tracking-widest text-shelf-paper transition-colors hover:bg-shelf-wood disabled:cursor-not-allowed disabled:opacity-50">
              {isSaving ? "Saving…" : isEditable ? "Log result" : "Unlock to log results"}
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}
