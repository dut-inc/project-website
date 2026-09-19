"use client";

// components/sports/nba-standings/StandingsPool.tsx
//
// The NBA standings prediction pool.
// Visual language: punk rock show flyer / DIY zine. The dark `wall-bg` is the
// wall; every panel is a sheet of paper taped or pinned to it. Cream paper,
// black ink, basketball-leather orange + electric red marker accents, marker
// scrawl for annotations. Deliberately imperfect geometry, ruthlessly
// readable data.
//
// Structure:
//   <StandingsPool>   — fetches /api/nba-standings/predictions, owns state
//     <Leaderboard>   — active points table; clicking a row opens the popup
//     <BoardDialog>   — one person's West + East columns (edit + save live here)
//     <UnlockDialog>  — pool password entry

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  PARTICIPANTS,
  isSeasonLocked,
  scoreConference,
  type PredictionPicks,
} from "@/lib/sports/nbaStandingsPicks";
import { TEAMS_BY_ID, type NbaTeam } from "@/lib/sports/nbaTeams";
import type { NbaStandingRow } from "@/lib/backend/providers/nbaStandings";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ApiParticipant = {
  name: string;
  picks: PredictionPicks;
  saved: boolean;
  updatedAt: string | null;
};

type ApiPayload = {
  season: { key: string; locked: boolean; tipOff: string; isPreseason: boolean };
  standings: { fetchedAt: string; West: NbaStandingRow[]; East: NbaStandingRow[] };
  participants: ApiParticipant[];
  dbError: string | null;
};

type Conference = "West" | "East";

// ---------------------------------------------------------------------------
// Small shared pieces
// ---------------------------------------------------------------------------

/** Inline SVG basketball — used as the page marker and loading spinner. */
function BasketballIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="14.5" fill="#E8642F" stroke="#3D2412" strokeWidth="1.8" />
      <path
        d="M16 1.5v29M1.5 16h29M5.2 6.2c6 5.4 6 14.2 0 19.6M26.8 6.2c-6 5.4-6 14.2 0 19.6"
        fill="none"
        stroke="#3D2412"
        strokeWidth="1.6"
      />
    </svg>
  );
}

/** Team logo chip: a colored disc with the abbreviation. No protected imagery. */
function TeamChip({ team, size = "md" }: { team: NbaTeam; size?: "sm" | "md" }) {
  const box = size === "sm" ? "size-6 text-[9px]" : "size-8 text-[11px]";
  return (
    <span
      className={`inline-flex ${box} shrink-0 items-center justify-center rounded-full font-mono font-bold uppercase leading-none text-white ring-1 ring-black/40`}
      style={{
        background: `linear-gradient(135deg, ${team.primary} 0%, ${team.secondary} 130%)`,
      }}
    >
      {team.id}
    </span>
  );
}

/**
 * Compact live standings list shown beside a participant's picks in the
 * board popup, so the two can be compared rank-for-rank.
 */
function LiveStandingsList({ conf, rows }: { conf: Conference; rows: NbaStandingRow[] }) {
  return (
    <div className="space-y-2">
      <div className="px-1 font-mono text-[9px] uppercase tracking-[0.25em] text-ink/50">
        Live standings
      </div>
      <ol className="space-y-1 rounded-sm border border-ink/60 bg-black/5 p-1">
        {rows.map((row, index) => {
          const team = TEAMS_BY_ID.get(row.teamId);
          if (!team) return null;
          return (
            <li
              key={row.teamId}
              className="flex items-center gap-2 rounded-[3px] border border-transparent px-2 py-1.5 transition-colors hover:bg-ink/[0.06]"
            >
              <span className="w-5 shrink-0 text-center font-mono text-[10px] text-ink/45 tabular-nums">
                {index + 1}
              </span>
              <TeamChip team={team} size="sm" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink/80">
                {team.name}
              </span>
              <span className="shrink-0 font-mono text-[9px] tabular-nums text-ink/50">
                {row.wins}-{row.losses}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Paper-scrap plaque at the top of each conference column. */
function ConferencePlaque({ conference }: { conference: Conference }) {
  return (
    <div
      className={`inline-block -rotate-[0.6deg] rounded-[4px_2px_6px_3px] border-2 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] ${
        conference === "West"
          ? "border-pool-orange bg-pool-orange/15 text-pool-ink shadow-[2px_2px_0_rgba(42,38,32,0.35)]"
          : "border-ink bg-cream text-ink shadow-[2px_2px_0_rgba(42,38,32,0.35)]"
      }`}
    >
      {conference}ern Conference
    </div>
  );
}

// ---------------------------------------------------------------------------
// Draggable board
// ---------------------------------------------------------------------------

function ParticipantBoard({
  name,
  picks,
  saved,
  updatedAt,
  isUnlocked,
  activeName,
  isDraggingEnabled,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onEditClick,
  draggingTeamId,
  dropSlot,
  liveRanks,
  seasonStarted,
}: {
  name: string;
  picks: PredictionPicks;
  saved: boolean;
  updatedAt: string | null;
  isUnlocked: boolean;
  activeName: string | null;
  isDraggingEnabled: boolean;
  onDragStart: (name: string, teamId: string) => void;
  onDragOver: (name: string, conf: Conference, index: number) => void;
  onDragLeave: () => void;
  onDrop: (name: string, conf: Conference, index: number) => void;
  onEditClick: (name: string) => void;
  draggingTeamId: string | null;
  dropSlot: { board: string; conf: Conference; index: number } | null;
  liveRanks: Map<string, number>;
  seasonStarted: boolean;
}) {
  const isActive = activeName === name;
  const canDrag = isDraggingEnabled && isActive;

  // Insert index in the conference list *as seen while dragging* (dragged tile
  // removed). Computed from the cursor's Y against tile midpoints, so gaps
  // between tiles, list padding, and both list ends all resolve correctly —
  // none of which plain drop targets handle.
  const insertionIndexFor = (clientY: number, conf: Conference) => {
    const visible = picks[conf].filter((t) => t !== draggingTeamId);
    for (let i = 0; i < visible.length; i++) {
      const el = document.querySelector(
        `[data-board="${name}"][data-conf="${conf}"][data-team="${visible[i]}"]`,
      );
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return i;
    }
    return visible.length;
  };

  const renderTeam = (teamId: string, index: number, conf: Conference) => {
    const team = TEAMS_BY_ID.get(teamId);
    if (!team) return null;
    const liveRank = liveRanks.get(teamId);
    const isDragging = draggingTeamId === teamId;
    const rank = index + 1; // stable label, even while other tiles move
    // Position in the list with the dragged tile hidden — matches dropSlot.
    const visibleIndex = picks[conf].slice(0, index).filter((t) => t !== draggingTeamId).length;
    const isDropTarget =
      dropSlot?.board === name && dropSlot.conf === conf && dropSlot.index === visibleIndex;
    // Accuracy vs the live standings: exact = green, within 1 spot = gold.
    // Dormant until the season tips off — preseason 0-0 “standings” would
    // paint every board green for nothing.
    const rankDiff = liveRank === undefined ? null : Math.abs(liveRank - rank);
    const accuracyClass = !seasonStarted
      ? null
      : rankDiff === 0
        ? "border-pinGreen/80 bg-pinGreen/15"
        : rankDiff === 1
          ? "border-pinGold/80 bg-pinGold/20"
          : null;
    // The colored border already says “close”; only spell out the number when
    // the miss is 2+ spots.
    const showLive = seasonStarted && rankDiff !== null && rankDiff >= 2;

    return (
      <li
        key={teamId}
        draggable={canDrag}
        onDragStart={(e) => {
          if (!canDrag) return;
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", teamId);
          onDragStart(name, teamId);
        }}
        data-board={name}
        data-conf={conf}
        data-team={teamId}
        onDrop={(e) => {
          if (!canDrag) return;
          e.preventDefault();
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          const after = e.clientY > rect.top + rect.height / 2;
          onDrop(name, conf, visibleIndex + (after ? 1 : 0));
        }}
        className={`group flex items-center gap-2 rounded-[4px_2px_5px_3px] border px-2 py-1.5 transition-all ${
          isDragging
            ? "z-10 rotate-[1.2deg] border-pool-orange bg-pool-orange/30 opacity-60 shadow-[3px_4px_0_rgba(0,0,0,0.3)]"
            : isDropTarget
              ? "-rotate-[0.8deg] border-pool-orange bg-pool-orange/25 shadow-[0_0_0_3px_rgba(232,100,47,0.3)]"
              : (accuracyClass ??
                  (canDrag
                    ? "cursor-grab border-ink/60 bg-white/40 shadow-[2px_2px_0_rgba(42,38,32,0.28)] hover:-rotate-[0.6deg] hover:bg-white/70 active:cursor-grabbing active:rotate-[0.7deg]"
                    : "border-ink/40 bg-white/20"))
        }`}
      >
        <span className="w-5 shrink-0 text-center font-mono text-[10px] text-ink/45 tabular-nums">
          {rank}
        </span>
        <TeamChip team={team} size="sm" />
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink/90">
          {team.name}
        </span>
        {showLive && (
          <span
            className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-ink/45"
            title="Live standing"
          >
            #{liveRank}
          </span>
        )}
        {canDrag && (
          <span
            aria-hidden
            className="shrink-0 font-mono text-xs leading-none text-ink/25 group-hover:text-ink/55"
          >
            ⠿
          </span>
        )}
      </li>
    );
  };

  const columns: Conference[] = ["West", "East"];

  return (
    <section
      className={`paper-sheet overflow-hidden rounded-[10px_6px_12px_7px] transition-transform ${
        isActive ? "-rotate-[0.45deg] ring-2 ring-pool-orange" : ""
      }`}
    >
      <header className="flex items-center justify-between gap-3 border-b-2 border-ink/60 bg-[#e2d5b2] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <h3 className="truncate font-sign text-2xl font-bold uppercase tracking-wide text-ink">
            {name}
          </h3>
          {saved ? (
            <span className="stamp -rotate-2 shrink-0 border-pinGreen bg-pinGreen/15 text-pinTeal">
              saved
            </span>
          ) : (
            <span className="stamp rotate-1 shrink-0 border-ink/60 bg-transparent text-ink/60">
              chalk
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {updatedAt && (
            <time className="hidden font-mono text-[9px] uppercase tracking-wider text-ink/45 sm:inline">
              {new Date(updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </time>
          )}
          <button
            type="button"
            onClick={() => onEditClick(name)}
            className={`rounded-[3px] border-2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest shadow-[2px_2px_0_rgba(42,38,32,0.35)] transition-all hover:-translate-y-px hover:shadow-[3px_3px_0_rgba(42,38,32,0.35)] ${
              isActive && isUnlocked
                ? "border-pinTeal bg-pinGreen/25 text-pinTeal"
                : "border-pool-ink bg-pool-orange text-pool-ink"
            }`}
          >
            {isActive && isUnlocked ? "editing" : isUnlocked ? "edit" : "Unlock edit"}
          </button>
        </div>
      </header>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        {columns.map((conf) => {
          const isTarget = dropSlot?.board === name && dropSlot.conf === conf;
          return (
            <div key={conf} className="space-y-2.5">
              <ConferencePlaque conference={conf} />
              <ol
                onDragOver={(e) => {
                  if (!canDrag) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  onDragOver(name, conf, insertionIndexFor(e.clientY, conf));
                }}
                onDrop={(e) => {
                  if (!canDrag) return;
                  e.preventDefault();
                  onDrop(name, conf, insertionIndexFor(e.clientY, conf));
                }}
                className={`space-y-1.5 rounded-sm p-1 transition-colors ${
                  isTarget ? "bg-pool-orange/15 outline-2 outline-dashed outline-pool-orange/60" : ""
                }`}
              >
                {picks[conf].map((teamId, index) => renderTeam(teamId, index, conf))}
              </ol>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

function Leaderboard({
  rows,
  onOpen,
}: {
  rows: Array<{ name: string; points: number; max: number; perConf: Array<{ conf: Conference; points: number; max: number }> }>;
  onOpen: (name: string) => void;
}) {
  const ranked = [...rows].sort((a, b) => b.points - a.points);

  return (
    <div className="relative">
      <span aria-hidden className="tape -top-3 right-6 z-10 rotate-[4deg] bg-pinRed/40" />
      <div className="paper-sheet overflow-hidden rounded-[10px_5px_12px_6px]">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-ink/60 bg-[#e2d5b2] px-4 py-3 sm:px-5">
          <span className="font-sign text-xl font-bold uppercase tracking-[0.08em] text-ink">
            Leaderboard
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-ink/55">
            click a row to view/edit picks
          </span>
        </div>
        <ol className="divide-y divide-ink/25">
          {ranked.map((row, i) => (
            <li key={row.name}>
              <button
                type="button"
                onClick={() => onOpen(row.name)}
                aria-label={`View ${row.name}'s predictions`}
                className={`group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink/[0.07] sm:px-5 ${
                  i % 2 === 1 ? "bg-ink/[0.035]" : ""
                }`}
              >
                <span
                  className={`w-6 shrink-0 text-center font-sign text-xl font-bold ${
                    i === 0 ? "text-pinRed" : "text-ink/40"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
                  {row.name}
                </span>
                <span
                  className={`w-20 shrink-0 rounded-[3px] border-2 px-2 py-1 text-center font-sign text-lg font-bold tabular-nums shadow-[2px_2px_0_rgba(42,38,32,0.3)] ${
                    i === 0 && row.points > 0
                      ? "border-pool-ink bg-pool-orange text-black"
                      : "border-ink/60 bg-cream text-ink"
                  }`}
                >
                  {row.points}
                  <span className={`ml-0.5 font-mono text-[9px] ${i === 0 && row.points > 0 ? "text-black/55" : "text-ink/45"}`}>
                    /{row.max}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="shrink-0 font-mono text-sm text-ink/35 transition-all group-hover:translate-x-0.5 group-hover:text-pinRed"
                >
                  →
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Board popup — one participant's picks, opened from the leaderboard
// ---------------------------------------------------------------------------

function BoardDialog({
  isOpen,
  participant,
  picks,
  isUnlocked,
  locked,
  activeName,
  draggingTeamId,
  dropSlot,
  liveRanks,
  liveRanksData,
  seasonStarted,
  saving,
  saveError,
  onClose,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onEditClick,
  onSave,
  onDone,
}: {
  isOpen: boolean;
  participant: ApiParticipant | null;
  picks: PredictionPicks | null;
  isUnlocked: boolean;
  locked: boolean;
  activeName: string | null;
  draggingTeamId: string | null;
  dropSlot: { board: string; conf: Conference; index: number } | null;
  liveRanks: Map<string, number>;
  liveRanksData: { West: NbaStandingRow[]; East: NbaStandingRow[] };
  seasonStarted: boolean;
  saving: boolean;
  saveError: string | null;
  onClose: () => void;
  onDragStart: (name: string, teamId: string) => void;
  onDragOver: (name: string, conf: Conference, index: number) => void;
  onDragLeave: () => void;
  onDrop: (name: string, conf: Conference, index: number) => void;
  onEditClick: (name: string) => void;
  onSave: () => void;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !participant || !picks || typeof document === "undefined") return null;

  const isActive = activeName === participant.name;
  const editable = isActive && isUnlocked && !locked;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-pool-leather/85 p-4 backdrop-blur-[2px] animate-backdrop-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="my-8 w-full max-w-6xl animate-modal-pop">
        <div className="flex items-stretch justify-center gap-4">
          {/* West live standings rail — a narrower clipping taped beside the board */}
          <aside className="hidden w-56 shrink-0 xl:block">
            <div className="relative">
              <span aria-hidden className="tape -top-2.5 left-1/2 z-10 -translate-x-1/2 -rotate-3" />
              <div className="paper-sheet rotate-[0.35deg] rounded-[8px_5px_10px_6px] p-2.5">
                <LiveStandingsList conf="West" rows={liveRanksData.West} />
              </div>
            </div>
          </aside>
          <div className="w-full max-w-2xl">
            <ParticipantBoard
              name={participant.name}
              picks={picks}
              saved={participant.saved}
              updatedAt={participant.updatedAt}
              isUnlocked={isUnlocked && !locked}
              activeName={activeName}
              isDraggingEnabled={!locked && isUnlocked && activeName === participant.name}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onEditClick={onEditClick}
              draggingTeamId={draggingTeamId}
              dropSlot={dropSlot}
              liveRanks={liveRanks}
              seasonStarted={seasonStarted}
            />
            {editable && (
              <div className="mt-2 flex items-center justify-end gap-2">
                {saveError && (
                  <p role="alert" className="mr-auto font-mono text-xs text-pinRed">
                    {saveError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={onDone}
                  className="rounded-[3px] border-2 border-ink/50 bg-cream/95 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink/70 shadow-[2px_2px_0_rgba(0,0,0,0.3)] transition-all hover:-translate-y-px hover:text-ink"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className="rotate-[0.6deg] rounded-[3px] border-2 border-ink/60 bg-pool-orange px-5 py-2 font-mono text-[10px] uppercase tracking-widest text-black shadow-[2px_2px_0_rgba(0,0,0,0.4)] transition-all hover:-translate-y-px hover:bg-pool-ink hover:text-cream disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save board"}
                </button>
              </div>
            )}
          </div>
          {/* East live standings rail — same sheet, same padding as the West one */}
          <aside className="hidden w-56 shrink-0 xl:block">
            <div className="relative">
              <span aria-hidden className="tape -top-2.5 left-1/2 z-10 -translate-x-1/2 rotate-2" />
              <div className="paper-sheet -rotate-[0.3deg] rounded-[6px_8px_5px_10px] p-2.5">
                <LiveStandingsList conf="East" rows={liveRanksData.East} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Unlock dialog
// ---------------------------------------------------------------------------

function UnlockDialog({
  isOpen,
  onClose,
  onUnlocked,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const raf = window.requestAnimationFrame(() => inputRef.current?.focus());
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/nba-standings/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = (await res.json()) as { unlocked?: boolean; error?: string };
      if (!res.ok || !data.unlocked) {
        setError(data.error ?? "That password does not match.");
        return;
      }
      setPasscode("");
      onUnlocked();
      onClose();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-pool-leather/85 p-4 backdrop-blur-[2px] animate-backdrop-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pool-unlock-title"
        className="paper-sheet relative w-full max-w-sm -rotate-[0.5deg] rounded-[10px_5px_12px_6px] p-6 animate-modal-pop"
      >
        <span aria-hidden className="tape tape--dark -top-3 left-1/2 -translate-x-1/2 rotate-2" />
        <div className="flex items-center justify-between">
          <BasketballIcon className="size-9 -rotate-6 animate-ball-bounce" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-[3px] border-2 border-ink/50 font-mono text-base text-ink/70 transition-colors hover:border-ink hover:text-ink"
          >
            ×
          </button>
        </div>
        <h2 id="pool-unlock-title" className="mt-4 font-sign text-3xl font-bold uppercase tracking-wide text-ink">
          Unlock your board
        </h2>
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider leading-relaxed text-ink/60">
          Enter the pool password to drag tiles on any board.
        </p>
        <input
          ref={inputRef}
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Pool password"
          autoComplete="current-password"
          className="mt-4 min-h-11 w-full border-b-2 border-ink/60 bg-transparent px-1 font-mono text-sm text-ink placeholder:text-ink/40 focus:border-pool-orange focus:outline-none"
        />
        {error && (
          <p role="alert" className="mt-2 font-mono text-xs text-pinRed">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || !passcode.trim()}
          className="mt-4 min-h-11 w-full rounded-[3px] border-2 border-ink/70 bg-pool-orange py-2.5 font-sign text-xl font-bold uppercase tracking-[0.2em] text-black shadow-[3px_3px_0_rgba(42,38,32,0.45)] transition-all hover:-translate-y-px hover:bg-pool-ink hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Checking…" : "Tip off"}
        </button>
      </form>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export default function StandingsPool() {
  const [data, setData] = useState<ApiPayload | null>(null);
  const [boards, setBoards] = useState<Record<string, PredictionPicks>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeName, setActiveName] = useState<string | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [openName, setOpenName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const pendingUnlockRef = useRef<string | null>(null);

  const [draggingTeamId, setDraggingTeamId] = useState<string | null>(null);
  const [dropSlot, setDropSlot] = useState<{ board: string; conf: Conference; index: number } | null>(null);

  const locked = useMemo(() => (data ? data.season.locked || isSeasonLocked() : false), [data]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/nba-standings/predictions", { cache: "no-store" });
      if (!res.ok) throw new Error(`API responded ${res.status}`);
      const payload = (await res.json()) as ApiPayload;
      setData(payload);
      setBoards(Object.fromEntries(payload.participants.map((p) => [p.name, p.picks])));
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch. Every setState inside `load` fires after `await`, so no
    // synchronous cascading render actually happens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Live ranks: teamId -> 1-based position in the live conference order.
  const liveRanks = useMemo(() => {
    const map = new Map<string, number>();
    if (!data) return map;
    (["West", "East"] as Conference[]).forEach((conf) => {
      data.standings[conf].forEach((row, i) => map.set(row.teamId, i + 1));
    });
    return map;
  }, [data]);

  // Raw live rows, passed through for the comparison lists in board popups.
  const liveRanksData = useMemo(
    () => ({ West: data?.standings.West ?? [], East: data?.standings.East ?? [] }),
    [data],
  );

  // The season starts at tip-off; before that the "live" standings are 0-0
  // and the accuracy highlighting is meaningless, so it stays dormant.
  const seasonStarted = useMemo(() => {
    if (locked) return true; // frozen boards mean the season is under way
    const tipOff = data?.season.tipOff ? new Date(data.season.tipOff).getTime() : NaN;
    // Pre-existing pattern from the original implementation; reading the clock
    // once per data change is the intended behavior here.
    // eslint-disable-next-line react-hooks/purity
    return Number.isFinite(tipOff) && Date.now() >= tipOff;
  }, [data, locked]);

  // Leaderboard rows — points per participant against the live order.
  const leaderboardRows = useMemo(() => {
    if (!data) return [];
    const live = {
      West: data.standings.West.map((r) => r.teamId),
      East: data.standings.East.map((r) => r.teamId),
    };
    return PARTICIPANTS.map((name) => {
      const picks = boards[name];
      const west = scoreConference(picks.West, live.West, "West");
      const east = scoreConference(picks.East, live.East, "East");
      return {
        name,
        points: west.points + east.points,
        max: west.max + east.max,
        perConf: [
          { conf: "West" as Conference, points: west.points, max: west.max },
          { conf: "East" as Conference, points: east.points, max: east.max },
        ],
      };
    });
  }, [data, boards]);

  const openRecord = useMemo(
    () => data?.participants.find((p) => p.name === openName) ?? null,
    [data, openName],
  );

  // --- drag handlers -------------------------------------------------------

  const moveTeam = useCallback(
    (boardName: string, teamId: string, conf: Conference, dropIndex: number) => {
      if (locked || !isUnlocked) return;
      setBoards((current) => {
        const board = current[boardName];
        if (!board) return current;

        // Find where the dragged team currently lives.
        const found = (["West", "East"] as Conference[])
          .map((c) => ({ conf: c, index: board[c].indexOf(teamId) }))
          .find((hit) => hit.index !== -1);
        if (!found) return current;
        const sourceConf = found.conf;
        const sourceIndex = found.index;

        // Clamp the drop index against the list minus the dragged tile —
        // dropIndex is computed in the dragging view where the tile is hidden.
        const visible = board[conf].filter((t) => t !== teamId);
        const insertAt = Math.max(0, Math.min(dropIndex, visible.length));

        const next: PredictionPicks = { West: [...board.West], East: [...board.East] };
        next[sourceConf].splice(sourceIndex, 1);
        next[conf].splice(insertAt, 0, teamId);
        return { ...current, [boardName]: next };
      });
    },
    [locked, isUnlocked],
  );

  const handleDragStart = useCallback((name: string, teamId: string) => {
    setDraggingTeamId(teamId);
    setActiveName(name);
  }, []);

  const handleDragOver = useCallback((name: string, conf: Conference, index: number) => {
    setDropSlot((prev) =>
      prev?.board === name && prev.conf === conf && prev.index === index
        ? prev
        : { board: name, conf, index },
    );
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropSlot(null);
  }, []);

  const handleDrop = useCallback(
    (name: string, conf: Conference, index: number) => {
      const teamId = draggingTeamId;
      setDraggingTeamId(null);
      setDropSlot(null);
      if (!teamId) return;
      moveTeam(name, teamId, conf, index);
    },
    [draggingTeamId, moveTeam],
  );

  // --- persistence ---------------------------------------------------------

  async function saveBoard(name: string) {
    if (locked || !isUnlocked) return;
    const picks = boards[name];
    if (!picks) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/nba-standings/predictions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant: name, picks }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSaveError(payload.error ?? "Save failed.");
        return;
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              participants: prev.participants.map((p) =>
                p.name === name ? { ...p, picks, saved: true, updatedAt: new Date().toISOString() } : p,
              ),
            }
          : prev,
      );
    } catch {
      setSaveError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  function handleEditClick(name: string) {
    if (locked) return; // button is hidden anyway
    if (isUnlocked) {
      // Unlocking always leaves the last board active; clicking its own
      // button again deactivates.
      setActiveName(activeName === name ? null : name);
    } else {
      // Remember which board we're unlocking so it auto-activates on success.
      pendingUnlockRef.current = name;
      setUnlockOpen(true);
    }
  }

  const handleCloseBoard = useCallback(() => {
    setOpenName(null);
    setActiveName(null);
    setDraggingTeamId(null);
    setDropSlot(null);
  }, []);

  // --- render ---------------------------------------------------------------

  if (loading) {
    return (
      <div className="paper-sheet flex min-h-[50vh] -rotate-[0.3deg] items-center justify-center rounded-[10px_6px_12px_7px]">
        <div className="flex flex-col items-center gap-3">
          <BasketballIcon className="size-12 animate-ball-bounce" />
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-ink/60">
            Bouncing the ball out…
          </span>
        </div>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="paper-sheet -rotate-[0.4deg] rounded-[10px_6px_12px_7px] p-8 text-center">
        <p className="font-sign text-4xl font-bold uppercase text-ink">Airball.</p>
        <p className="mt-2 font-mono text-xs text-ink/60">{loadError ?? "No data"}</p>
        <button
          type="button"
          onClick={() => {
            setLoadError(null);
            setLoading(true);
            void load();
          }}
          className="mt-5 rounded-[3px] border-2 border-ink/70 bg-pool-orange px-6 py-2.5 font-mono text-xs uppercase tracking-widest text-black shadow-[3px_3px_0_rgba(42,38,32,0.45)] transition-all hover:-translate-y-px hover:bg-pool-ink hover:text-cream"
        >
          Run it back
        </button>
      </div>
    );
  }

  const standingsTime = new Date(data.standings.fetchedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      {/* Title card — cut-and-paste headline on a big pinned-up sheet. */}
      <header className="paper-sheet relative rounded-[12px_6px_14px_8px] px-6 py-10 text-center sm:px-10">
        <span aria-hidden className="tape -top-3 left-8 z-10 -rotate-6 bg-pinRed/40" />
        <span aria-hidden className="tape -top-2.5 right-10 z-10 rotate-[5deg]" />
        <h1 className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-2">
          <span className="punk-scrap -rotate-2 border-2 border-ink bg-cream font-dle text-4xl font-semibold uppercase leading-none tracking-tight text-ink sm:text-6xl">
            Gradey&nbsp;Dick
          </span>
          <span className="punk-scrap rotate-[1.3deg] border-2 border-ink bg-pool-orange font-dle text-4xl font-semibold uppercase leading-none tracking-tight text-black sm:text-6xl">
            Fan&nbsp;Club
          </span>
          <span className="punk-scrap -rotate-[1.1deg] border-2 border-ink bg-ink font-dle text-4xl font-semibold uppercase leading-none tracking-tight text-cream sm:text-6xl">
            Predictions
          </span>
        </h1>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.25em] text-ink/65">
          {data.season.key} season · standings as of {standingsTime}
          {locked ? " · picks frozen" : ""}
        </p>
      </header>

      {data.dbError && (
        <div
          role="alert"
          className="graph-paper relative mx-auto max-w-xl rotate-[1.4deg] border border-ink/50 p-4 text-[13px] text-ink/85 shadow-[3px_4px_0_rgba(0,0,0,0.35)]"
        >
          <span aria-hidden className="tape tape--dark -top-2.5 left-1/2 -translate-x-1/2 -rotate-2" />
          <p>{data.dbError}</p>
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-wider text-ink/55">
            Run supabase/nba-standings-schema.sql in the Supabase SQL editor, then refresh. Boards fall back to chalk order until then.
          </p>
        </div>
      )}

      {/* Leaderboard */}
      <Leaderboard rows={leaderboardRows} onOpen={(name) => setOpenName(name)} />

      {/* Lock banner when the season has started */}
      {locked && (
        <div className="-rotate-[0.35deg] border border-ink/40 bg-black/25 px-4 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-cream/65">
          The ball went up on Oct 20 — boards are read-only until next season.
        </div>
      )}

      <BoardDialog
        isOpen={openName !== null}
        participant={openRecord}
        picks={openName ? boards[openName] ?? openRecord?.picks ?? null : null}
        isUnlocked={isUnlocked}
        locked={locked}
        activeName={activeName}
        draggingTeamId={draggingTeamId}
        dropSlot={dropSlot}
        liveRanks={liveRanks}
        liveRanksData={liveRanksData}
        seasonStarted={seasonStarted}
        saving={saving}
        saveError={saveError}
        onClose={handleCloseBoard}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onEditClick={handleEditClick}
        onSave={() => {
          if (openName) void saveBoard(openName);
        }}
        onDone={() => setActiveName(null)}
      />

      <UnlockDialog
        isOpen={unlockOpen}
        onClose={() => setUnlockOpen(false)}
        onUnlocked={() => {
          setIsUnlocked(true);
          // Jump straight into editing the board that was pending unlock.
          const target = pendingUnlockRef.current;
          pendingUnlockRef.current = null;
          if (target) {
            setActiveName(target);
            setOpenName(target);
          }
        }}
      />
    </div>
  );
}
