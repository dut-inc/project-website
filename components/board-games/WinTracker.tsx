"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";
import { getDatabaseErrorMessage } from "@/lib/boardGamesDatabase";

type WinTrackerProps = {
  gameId: string;
  gameName: string;
  isEditable: boolean;
};

type LeaderboardEntry = {
  id: string;
  name: string;
  wins: number;
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

function asWins(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function isPermissionError(error: unknown) {
  const candidate = error as { code?: string; message?: string } | null;
  const message = error instanceof Error ? error.message : candidate?.message ?? JSON.stringify(error);
  const normalized = message.toLowerCase();
  return (
    candidate?.code === "42501" ||
    normalized.includes("permission denied") ||
    normalized.includes("row-level security") ||
    (normalized.includes("relation") && normalized.includes("does not exist"))
  );
}

function parseEntry(row: unknown): LeaderboardEntry | null {
  const record = asRecord(row);
  const id = asId(record?.player_id ?? record?.id);
  const name = asName(record?.name);
  if (!id || !name) return null;
  return { id, name, wins: asWins(record?.wins) };
}

export default function WinTracker({ gameId, gameName, isEditable }: WinTrackerProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: queryError } = await supabase
        .from("game_leaderboard_view")
        .select("player_id, name, wins")
        .eq("board_game_id", Number(gameId))
        .order("wins", { ascending: false })
        .order("name", { ascending: true });

      if (queryError) throw queryError;
      setEntries(
        (data ?? [])
          .map(parseEntry)
          .filter((entry): entry is LeaderboardEntry => entry !== null),
      );
    } catch (caughtError) {
      setError(
        isPermissionError(caughtError)
          ? "The session scorebook is not enabled for the browser yet. Run the latest supabase/schema.sql in Supabase, then refresh."
          : getDatabaseErrorMessage(caughtError),
      );
    } finally {
      setIsLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    // The initial fetch synchronizes this game's session-derived leaderboard.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLeaderboard();
  }, [loadLeaderboard]);

  async function addPlayer(event?: FormEvent) {
    event?.preventDefault();
    const name = newPlayerName.trim();
    if (!name || !isEditable || isAdding) return;

    setIsAdding(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = createClient();
      const { data, error: queryError } = await supabase
        .rpc("add_player", { p_name: name })
        .maybeSingle();
      if (queryError) throw queryError;

      const player = parseEntry(data);
      if (!player) throw new Error("The new player could not be added to the scorebook.");
      setEntries((current) => {
        const alreadyOnThisLeaderboard = current.some((entry) => entry.id === player.id);
        return alreadyOnThisLeaderboard
          ? current.map((entry) => (entry.id === player.id ? { ...entry, name: player.name } : entry)).sort(sortEntries)
          : [...current, player].sort(sortEntries);
      });
      setNewPlayerName("");
      setNotice(`${player.name} is available on every game leaderboard.`);
    } catch (caughtError) {
      setError(
        isPermissionError(caughtError)
          ? "Supabase rejected this player. Run the latest supabase/schema.sql to enable scorebook access."
          : getDatabaseErrorMessage(caughtError),
      );
    } finally {
      setIsAdding(false);
    }
  }

  async function adjustWins(entry: LeaderboardEntry, delta: 1 | -1) {
    if (!isEditable || savingId) return;
    if (delta === -1 && entry.wins === 0) return;

    const nextWins = Math.max(0, entry.wins + delta);
    setSavingId(entry.id);
    setError(null);
    setNotice(null);
    setEntries((current) => current.map((currentEntry) => (currentEntry.id === entry.id ? { ...currentEntry, wins: nextWins } : currentEntry)).sort(sortEntries));

    try {
      const supabase = createClient();
      const { error: queryError } = delta === 1
        ? await supabase.rpc("record_player_win", {
            p_board_game_id: Number(gameId),
            p_player_id: Number(entry.id),
          })
        : await supabase.rpc("remove_player_win", {
            p_board_game_id: Number(gameId),
            p_player_id: Number(entry.id),
          });
      if (queryError) throw queryError;
    } catch (caughtError) {
      setEntries((current) => current.map((currentEntry) => (currentEntry.id === entry.id ? entry : currentEntry)).sort(sortEntries));
      setError(
        isPermissionError(caughtError)
          ? "Supabase rejected this score change. Run the latest supabase/schema.sql to grant session access."
          : getDatabaseErrorMessage(caughtError),
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="relative z-10 mt-8 border-t border-[#8d765a]/45 pt-6" aria-labelledby={`win-tracker-heading-${gameId}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5f5142]">scoreboard</p>
          <h3 id={`win-tracker-heading-${gameId}`} className="mt-1 font-display text-2xl italic text-[#29201c]">
            {gameName} leaderboard
          </h3>
        </div>
        <span className="rounded-full border border-[#8d765a]/65 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-[#5f5142]">
          {entries.length} {entries.length === 1 ? "player" : "players"}
        </span>
      </div>

      {(error || notice) && (
        <div
          role={error ? "alert" : "status"}
          className={`mt-4 rounded-xl border px-3 py-2.5 text-sm ${
            error
              ? "border-[#9f302f]/60 bg-[#9f302f]/10 text-[#7d1f1f]"
              : "border-[#4d674d]/60 bg-[#4d674d]/10 text-[#3d543d]"
          }`}
        >
          {error ?? notice}
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-[#8d765a]/60 bg-white/25 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.38)]">
        <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_5.5rem] items-center border-b border-[#8d765a]/45 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#5f5142]/75 sm:grid-cols-[3rem_minmax(0,1fr)_7rem]">
          <span>#</span>
          <span>Player</span>
          <span className="text-right">Wins</span>
        </div>

        {isLoading ? (
          <p className="px-3 py-7 text-center text-sm text-[#5f5142]/75">Reading the scorebook…</p>
        ) : entries.length === 0 ? (
          <p className="px-3 py-7 text-center text-sm text-[#5f5142]/75">No players on this leaderboard yet.</p>
        ) : (
          <div>
            {entries.map((entry, index) => (
              <div key={entry.id} className="group flex min-h-14 items-center border-b border-[#8d765a]/35 px-3 py-2.5 last:border-b-0 hover:bg-[#d9c7a8]/20">
                <span className="w-10 shrink-0 font-display text-xl italic text-[#8d765a] sm:w-12">{index + 1}</span>
                <p className="min-w-0 flex-1 truncate pr-2 font-display text-lg italic text-[#29201c]">{entry.name}</p>
                <div className="-translate-x-1 flex w-[5.5rem] items-center justify-end gap-1 sm:w-28">
                  {isEditable && (
                    <span className="flex h-7 w-7 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => void adjustWins(entry, -1)}
                        disabled={savingId === entry.id || entry.wins === 0}
                        aria-label={`Subtract a win from ${entry.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-[#8d765a]/60 font-mono text-sm leading-none text-[#29201c] transition-colors hover:border-[#9f302f] hover:bg-[#9f302f]/10 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        −
                      </button>
                    </span>
                  )}
                  <span className="min-w-8 text-center font-display text-2xl italic tabular-nums text-[#29201c]">{entry.wins}</span>
                  {isEditable && (
                    <button
                      type="button"
                      onClick={() => void adjustWins(entry, 1)}
                      disabled={savingId === entry.id}
                      aria-label={`Add a win to ${entry.name}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-[#8d765a]/60 font-mono text-sm leading-none text-[#29201c] opacity-100 transition-colors hover:border-[#4d674d] hover:bg-[#4d674d]/10 disabled:cursor-wait disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isEditable && (
        <form onSubmit={(event) => void addPlayer(event)} className="mt-4 flex gap-2">
          <label className="sr-only" htmlFor={`win-tracker-player-${gameId}`}>Player name</label>
          <input
            id={`win-tracker-player-${gameId}`}
            value={newPlayerName}
            onChange={(event) => setNewPlayerName(event.target.value)}
            disabled={isAdding}
            className="min-w-0 flex-1 rounded-lg border border-[#8d765a]/60 bg-white/45 px-3 py-2.5 text-sm text-[#29201c] placeholder:text-[#5f5142]/65 outline-none transition-shadow focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25"
            placeholder="Add a player to every leaderboard"
          />
          <button
            type="submit"
            disabled={isAdding || !newPlayerName.trim()}
            className="shrink-0 rounded-full bg-[#29201c] px-4 font-mono text-[10px] uppercase tracking-widest text-[#f4ead6] transition-colors hover:bg-[#5f5142] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAdding ? "Adding…" : "Add player"}
          </button>
        </form>
      )}
    </section>
  );
}

function sortEntries(left: LeaderboardEntry, right: LeaderboardEntry) {
  return right.wins - left.wins || left.name.localeCompare(right.name);
}
