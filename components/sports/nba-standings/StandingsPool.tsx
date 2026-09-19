"use client";

// components/sports/nba-standings/StandingsPool.tsx
//
// The NBA standings prediction pool.
// Visual language: punk rock show flyer / DIY zine. The dark `wall-bg` is the
// wall; every panel is a sheet of paper pinned to it. Cream paper,
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
}/**
 * One headline word/phrase as a single scissor-cut scrap. The cut lives on
 * the inner span (clip-path would amputate the wrapper's drop shadow), the
 * tilt lives on the outer wrapper so hover transforms could compose there
 * later. Words are the cut unit — not letters — per the pool's design.
 */
function CutWord({
  word,
  tone,
  tilt,
  cut,
}: {
  word: string;
  tone: "cream" | "orange" | "ink";
  tilt: string;
  cut: string;
}) {
  const tones = {
    cream: "bg-cream text-ink",
    orange: "bg-pool-orange text-black",
    ink: "bg-ink text-cream",
  } as const;
  return (
    <span className={`scrap cutout-b ${tilt}`}>
      <span
        className={`block px-5 pb-4 pt-5 font-dle text-4xl font-semibold uppercase leading-none tracking-tight sm:px-7 sm:pb-5 sm:pt-6 sm:text-6xl ${
          cut
        } ${tones[tone]}`}
      >
        {word}
      </span>
    </span>
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
      <div className="scrap cutout-b mb-2">
        <span className="scrap-cut-b block bg-ink px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-cream">
          Live standings
        </span>
      </div>
      <ol className="space-y-1 border border-ink/60 bg-black/5 p-1 px-1.5">
        {rows.map((row, index) => {
          const team = TEAMS_BY_ID.get(row.teamId);
          if (!team) return null;
          return (
            <li
              key={row.teamId}
              className="cut-row-b flex items-center gap-2 border border-transparent px-2.5 py-1.5 transition-colors hover:bg-ink/[0.06]"
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
      className="scrap cutout -rotate-[0.6deg]"
    >
      <span
        className={`block px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.28em] ${
          conference === "West"
            ? "scrap-cut bg-pool-orange text-black"
            : "scrap-cut-b bg-cream text-ink"
        }`}
      >
        {conference}ern Conference
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Draggable board
// ---------------------------------------------------------------------------

function ParticipantBoard({
  name,
  rank,
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
  rank?: number;
  picks: PredictionPicks;
  saved: boolean;
  updatedAt: string | null;
  isUnlocked: boolean;
  activeName: string | null;
  isDraggingEnabled: boolean;
  onDragStart: (name: string, teamId: string) => void;
  onDragOver: (name: string, conf: Conference, index: number) => void;
  onDragLeave: () => void;
  onDrop: (name: string, conf: Conference, index: number, mode: "tile" | "gap") => void;
  onEditClick: (name: string) => void;
  draggingTeamId: string | null;
  dropSlot: { board: string; conf: Conference; index: number } | null;
  liveRanks: Map<string, number>;
  seasonStarted: boolean;
}) {
  const isActive = activeName === name;
  const canDrag = isDraggingEnabled && isActive;

  // Gap index in the list AS LAID OUT (dragged tile still present), computed
  // from the cursor's Y against tile midpoints. Gap i means "insert before
  // tile i" — which is also the tile a drop swaps with.
  const insertionIndexFor = (clientY: number, conf: Conference) => {
    for (let i = 0; i < picks[conf].length; i++) {
      const el = document.querySelector(
        `[data-board="${name}"][data-conf="${conf}"][data-team="${picks[conf][i]}"]`,
      );
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return i;
    }
    return picks[conf].length;
  };

  const renderTeam = (teamId: string, index: number, conf: Conference) => {
    const team = TEAMS_BY_ID.get(teamId);
    if (!team) return null;
    const liveRank = liveRanks.get(teamId);
    const isDragging = draggingTeamId === teamId;
    const rank = index + 1; // stable label, even while other tiles move
    // Drop highlight: gap index in present-list numbering — "insert before
    // this tile" — which is exactly the tile a drop here would swap with.
    const isDropTarget =
      dropSlot?.board === name && dropSlot.conf === conf && dropSlot.index === index;
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
          // Dropping ON a tile takes that tile's slot — swap-in place.
          onDrop(name, conf, index, "tile");
        }}
        className={`group flex items-center gap-2 border px-2.5 py-1.5 transition-all ${
          index % 2 ? "skew-y-[0.5deg]" : "skew-y-[-0.5deg]"
        } ${
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
    <section className="cut-shadow relative">
      <span aria-hidden className="cut-shadow-piece" />
      <div
        className={`paper-sheet cut-b overflow-hidden ${
          isActive ? "ring-2 ring-pool-orange" : ""
        }`}
      >
      <header className="flex items-center justify-between gap-3 border-b-2 border-ink/60 bg-[#e2d5b2] px-5 py-4">
        <div className="flex min-w-0 items-center gap-4">
          <NameScrap name={name} rank={rank ?? 0} big />
          {saved ? (
            <span className="scrap cutout-b ml-1.5 shrink-0">
              <span className="scrap-cut-b block bg-cream px-3 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-pinTeal">
                saved
              </span>
            </span>
          ) : (
            <span className="scrap cutout-b ml-1.5 shrink-0">
              <span className="scrap-cut-c block bg-cream/80 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink/60">
                chalk
              </span>
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => onEditClick(name)}
            className="scrap transition-transform hover:-translate-y-px"
          >
            <span
              className={`block px-3.5 py-2 font-mono text-[10px] uppercase tracking-widest ${
                isActive && isUnlocked
                  ? "scrap-cut-b bg-[#DCE9D4] text-pinTeal"
                  : "scrap-cut bg-pool-orange text-black"
              }`}
            >
              {isActive && isUnlocked ? "editing" : isUnlocked ? "edit" : "Unlock edit"}
            </span>
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
                  // Landed between tiles: classic insertion at that gap.
                  onDrop(name, conf, insertionIndexFor(e.clientY, conf), "gap");
                }}
                className={`space-y-1.5 px-1.5 py-1 transition-colors ${
                  isTarget ? "bg-pool-orange/15 outline-2 outline-dashed outline-pool-orange/60" : ""
                }`}
              >
                {picks[conf].map((teamId, index) => renderTeam(teamId, index, conf))}
              </ol>
            </div>
          );
        })}
        </div>
      </div>
    </section>
  );
}

/**
 * A participant name as a scissor-cut scrap, colored by leaderboard rank:
 * 1 = pinRed, 2 = orange, 3 = ink, everyone else = soft warm paper. Shared by
 * the leaderboard rows and the board popup header so both read identically.
 */
function NameScrap({
  name,
  rank,
  big,
}: {
  name: string;
  rank: number;
  big?: boolean;
}) {
  const style =
    rank === 1
      ? "scrap-cut bg-pinRed text-cream"
      : rank === 2
        ? "scrap-cut-d bg-pool-orange text-black"
        : rank === 3
          ? "scrap-cut-e bg-ink text-cream"
          : `${rank % 2 ? "scrap-cut" : "scrap-cut-b"} bg-[#F4EDDA] text-ink`;
  return (
    <span
      className={`block w-fit max-w-full truncate font-sign font-bold ${
        big ? "px-4 py-1 text-2xl uppercase tracking-wide" : "px-4 py-1 text-sm"
      } ${style}`}
    >
      {name}
    </span>
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
  onOpen: (name: string, rank: number) => void;
}) {
  const ranked = [...rows].sort((a, b) => b.points - a.points);

  return (
    <div className="paper-sheet cut-lg overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink/60 bg-[#e2d5b2] px-5 py-3.5 sm:px-6">
        <span className="scrap cutout-b">
          <span className="scrap-cut-b block bg-ink px-4 py-1.5 font-sign text-xl font-bold uppercase tracking-[0.08em] text-cream">
            Leaderboard
          </span>
        </span>
        <span className="scrap cutout-b">
          <span className="scrap-cut block bg-cream px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-ink/55">
            click a row to view/edit picks
          </span>
        </span>
      </div>
      <ol className="lb-rows">
          {ranked.map((row, i) => (
            <li key={row.name}>
              <button
                type="button"
                onClick={() => onOpen(row.name, i + 1)}
                aria-label={`View ${row.name}'s predictions`}
                className="group flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-ink/[0.07] sm:px-6"
              >
                <span
                  className={`shrink-0 px-2.5 py-1 text-center font-sign text-xl font-bold ${
                      i === 0
                        ? "scrap-cut bg-pinRed text-cream"
                        : i === 1
                          ? "scrap-cut-d bg-pool-orange text-black"
                          : i === 2
                            ? "scrap-cut-e bg-ink text-cream"
                            : `${i % 2 ? "scrap-cut-b" : "scrap-cut-c"} bg-[#F4EDDA] text-ink/60`
                    }`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block w-fit max-w-full truncate bg-[#F4EDDA] px-4 py-1 text-sm font-bold text-ink ${
                      i % 2 ? "scrap-cut" : "scrap-cut-b"
                    }`}
                  >
                    {row.name}
                  </span>
                </span>
                <span
                  className={`shrink-0 w-20 px-2 py-1.5 text-center font-mono text-base font-bold tabular-nums ${
                      i === 0 && row.points > 0
                        ? "scrap-cut bg-pool-orange text-black"
                        : i === 1 && row.points > 0
                          ? "scrap-cut-d bg-pinRed/85 text-cream"
                          : i === 2 && row.points > 0
                            ? "scrap-cut-e bg-ink text-cream"
                            : `${i % 2 ? "scrap-cut-c" : "scrap-cut-b"} bg-[#F4EDDA] text-ink`
                    }`}
                >
                    {row.points}
                    <span
                      className={`ml-0.5 font-mono text-[10px] ${
                        i === 0 && row.points > 0
                          ? "text-black/55"
                          : i === 2 && row.points > 0
                            ? "text-cream/55"
                            : "text-ink/45"
                      }`}
                    >
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
  );
}

// ---------------------------------------------------------------------------
// Board popup — one participant's picks, opened from the leaderboard
// ---------------------------------------------------------------------------

function BoardDialog({
  isOpen,
  participant,
  rank,
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
}: {
  isOpen: boolean;
  participant: ApiParticipant | null;
  rank: number | null;
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
  onDrop: (name: string, conf: Conference, index: number, mode: "tile" | "gap") => void;
  onEditClick: (name: string) => void;
  onSave: () => void;
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
          {/* West live standings rail — a narrower clipping pinned beside the board */}
          <aside className="hidden w-56 shrink-0 xl:block">
            <div className="cut-shadow relative">
              <span aria-hidden className="cut-shadow-piece" />
              <div className="paper-sheet cut-c rotate-[0.35deg] p-2.5">
                <LiveStandingsList conf="West" rows={liveRanksData.West} />
              </div>
            </div>
          </aside>
          <div className="w-full max-w-2xl">
            <ParticipantBoard
              name={participant.name}
              rank={rank ?? undefined}
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
                  <p
                    role="alert"
                    className="scrap cutout-b mr-auto -rotate-[0.5deg]"
                  >
                    <span className="scrap-cut-b block bg-cream px-3.5 py-2 font-mono text-xs text-pinRed">
                      {saveError}
                    </span>
                  </p>
                )}
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className="scrap cutout-b rotate-[0.6deg] transition-transform hover:-translate-y-px"
                >
                  <span className="scrap-cut-b block bg-pool-orange px-5 py-2 font-mono text-[10px] uppercase tracking-widest text-black">
                    {saving ? "Saving…" : "Save board"}
                  </span>
                </button>
              </div>
            )}
          </div>
          {/* East live standings rail — same sheet, same padding as the West one */}
          <aside className="hidden w-56 shrink-0 xl:block">
            <div className="cut-shadow relative">
              <span aria-hidden className="cut-shadow-piece" />
              <div className="paper-sheet cut-d -rotate-[0.3deg] p-2.5">
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
        className="cut-shadow cut-shadow--tight relative w-full max-w-sm -rotate-[0.5deg] animate-modal-pop"
      >
        <span aria-hidden className="cut-shadow-piece" />
        <div className="paper-sheet cut-b relative p-6">
        <div className="flex items-center justify-between">
          <BasketballIcon className="size-9 -rotate-6 animate-ball-bounce" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="scrap cutout-b flex size-9 items-center justify-center transition-colors hover:text-ink"
          >
            <span className="scrap-cut-c block size-full bg-cream px-1.5 pt-0.5 text-center font-mono text-base leading-[1.6] text-ink/70">
              ×
            </span>
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
          <p role="alert" className="scrap cutout-b mt-2">
            <span className="scrap-cut block bg-cream px-3 py-1.5 font-mono text-xs text-pinRed">
              {error}
            </span>
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || !passcode.trim()}
          className="scrap cutout scrap-block mt-5 block w-full transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="scrap-cut-b block bg-pool-orange px-6 py-3 font-sign text-xl font-bold uppercase tracking-[0.2em] text-black">
            {submitting ? "Checking…" : "Tip off"}
          </span>
        </button>
        </div>
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
  const [openRank, setOpenRank] = useState<number | null>(null);
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
    (
      boardName: string,
      teamId: string,
      conf: Conference,
      dropIndex: number,
      mode: "tile" | "gap",
    ) => {
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

        const next: PredictionPicks = { West: [...board.West], East: [...board.East] };

        if (mode === "tile" && conf === sourceConf) {
          // Dropped ON a tile in the same column: take that tile's slot —
          // a true swap, exactly what the drop position shows.
          if (dropIndex === sourceIndex) return current;
          const list = next[conf];
          [list[sourceIndex], list[dropIndex]] = [list[dropIndex], list[sourceIndex]];
          return { ...current, [boardName]: next };
        }

        // Everything else is an insertion at a gap between tiles. Clamped
        // because a cross-conference drop can land past the end of a shorter
        // list.
        const insertAt = Math.max(0, Math.min(dropIndex, board[conf].length));
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
    (name: string, conf: Conference, index: number, mode: "tile" | "gap") => {
      const teamId = draggingTeamId;
      setDraggingTeamId(null);
      setDropSlot(null);
      if (!teamId) return;
      moveTeam(name, teamId, conf, index, mode);
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
      <div className="cut-shadow relative min-h-[50vh] -rotate-[0.3deg]">
        <span aria-hidden className="cut-shadow-piece" />
        <div className="paper-sheet cut-c flex min-h-[50vh] items-center justify-center px-6">
        <div className="flex flex-col items-center gap-3">
          <BasketballIcon className="size-12 animate-ball-bounce" />
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-ink/60">
            Bouncing the ball out…
          </span>
        </div>
        </div>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="cut-shadow relative -rotate-[0.4deg]">
        <span aria-hidden className="cut-shadow-piece" />
        <div className="paper-sheet cut-d p-8 text-center">
        <p className="font-sign text-4xl font-bold uppercase text-ink">Airball.</p>
        <p className="mt-2 font-mono text-xs text-ink/60">{loadError ?? "No data"}</p>
        <button
          type="button"
          onClick={() => {
            setLoadError(null);
            setLoading(true);
            void load();
          }}
          className="scrap cutout mt-6 inline-block transition-transform hover:-translate-y-px"
        >
          <span className="scrap-cut block bg-pool-orange px-6 py-3 font-mono text-xs uppercase tracking-widest text-black">
            Run it back
          </span>
        </button>
        </div>
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
      {/* One big hand-cut sheet holding the title card and the leaderboard. */}
      <div className="paper-sheet cut-lg overflow-hidden">
        {/* Title card — cut-and-paste headline, no sheet behind it anymore. */}
        <header className="px-6 pb-6 pt-9 text-center sm:px-10">
        <h1 className="sr-only">Gradey Dick Fan Club Predictions</h1>
        <div
          aria-hidden
          className="flex flex-wrap items-end justify-center gap-x-3 gap-y-4 sm:gap-x-5"
        >
          <CutWord word="Gradey Dick" tone="cream" tilt="-rotate-[0.8deg]" cut="scrap-cut-lg" />
          <CutWord
            word="Fan Club"
            tone="orange"
            tilt="rotate-[0.9deg] translate-y-[2px]"
            cut="scrap-cut-lg-b"
          />
          <CutWord word="Predictions" tone="ink" tilt="-rotate-[0.5deg]" cut="scrap-cut-lg" />
        </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <p className="scrap cutout-b -rotate-[0.5deg]">
            <span className="scrap-cut block bg-cream px-4 py-2 font-mono text-[11px] uppercase tracking-[0.25em] text-ink/65">
              {data.season.key} season{locked ? " · picks frozen" : ""}
            </span>
          </p>
          <p className="scrap cutout-b rotate-[0.5deg]">
            <span className="scrap-cut-b block bg-cream px-4 py-2 font-mono text-[11px] uppercase tracking-[0.25em] text-ink/65">
              standings as of {standingsTime}
            </span>
          </p>
          </div>
        </header>

        {/* Leaderboard — a cutout panel pinned on the big sheet. Filter lives
            on the wrapper: clip-path on the panel itself would amputate any
            shadow painted by the panel. Zero-offset drop-shadow = an even
            hairline outline that follows the cut, no directional band. */}
        <div className="px-3 pb-6 sm:px-4 [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.28))]">
          <Leaderboard
          rows={leaderboardRows}
          onOpen={(name, rank) => {
            setOpenName(name);
            setOpenRank(rank);
          }}
        />
        </div>
      </div>

      {data.dbError && (
        <div
          role="alert"
          className="scrap cutout scrap-block relative mx-auto max-w-xl rotate-[1.4deg]"
        >
          <div className="graph-paper scrap-cut-lg px-6 py-5 text-[13px] text-ink/85">
          <p>{data.dbError}</p>
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-wider text-ink/55">
            Run supabase/nba-standings-schema.sql in the Supabase SQL editor, then refresh. Boards fall back to chalk order until then.
          </p>
          </div>
        </div>
      )}

      {/* Lock banner when the season has started */}
      {locked && (
        <div className="relative flex justify-center">
          <p className="scrap cutout relative -rotate-[0.6deg]">
            <span className="scrap-cut-b block bg-cream px-6 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-ink/80">
              The ball went up on Oct 20 — boards are read-only until next season.
            </span>
          </p>
        </div>
      )}

      <BoardDialog
        isOpen={openName !== null}
        participant={openRecord}
        rank={openRank}
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
