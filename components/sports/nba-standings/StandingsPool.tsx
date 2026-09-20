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
import { TEAMS_BY_ID, chalkOrder, type NbaTeam } from "@/lib/sports/nbaTeams";
import type { NbaStandingRow } from "@/lib/backend/providers/nbaStandings";
import { CURRENT_PROGRESSION_SEASON, type ProgressionSnapshot } from "@/lib/sports/nbaProgression";
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

type PredictionExtras = {
  awards: Partial<Record<"MVP" | "ROY" | "MIP" | "DPOY" | "6MOY" | "CPOY" | "COY" | "FMVP", string>>;
  champion?: string;
};

type HistoricalRow = {
  name: string;
  points: number;
  picks: PredictionPicks;
  extras?: PredictionExtras;
};

type HistoricalSeason = {
  key: string;
  label: string;
  rows: HistoricalRow[];
  actualStandings: { West: NbaStandingRow[]; East: NbaStandingRow[] };
  actualChampion: string;
  actualAwards?: PredictionExtras;
};

const actualRows = (ids: string[], records?: Record<string, [number, number]>): NbaStandingRow[] =>
  ids.map((teamId) => {
    const [wins, losses] = records?.[teamId] ?? [0, 0];
    return { teamId, wins, losses, winPct: wins + losses ? wins / (wins + losses) : 0, streak: "" };
  });

const HISTORICAL_STANDINGS: Record<string, { West: NbaStandingRow[]; East: NbaStandingRow[] }> = {
  "2025-2026": {
    West: actualRows(["OKC", "SAS", "DEN", "LAL", "HOU", "MIN", "PHX", "POR", "LAC", "GSW", "NOP", "DAL", "MEM", "SAC", "UTA"], { OKC: [64, 18], SAS: [62, 20], DEN: [54, 28], LAL: [53, 29], HOU: [52, 30], MIN: [49, 33], PHX: [45, 37], POR: [42, 40], LAC: [42, 40], GSW: [37, 45], NOP: [26, 56], DAL: [26, 56], MEM: [25, 57], SAC: [22, 60], UTA: [22, 60] }),
    East: actualRows(["DET", "BOS", "NYK", "CLE", "TOR", "ATL", "PHI", "ORL", "CHA", "MIA", "MIL", "CHI", "BKN", "IND", "WAS"], { DET: [60, 22], BOS: [56, 26], NYK: [53, 29], CLE: [52, 30], TOR: [46, 36], ATL: [46, 36], PHI: [45, 37], ORL: [45, 37], CHA: [44, 38], MIA: [43, 39], MIL: [32, 50], CHI: [31, 51], BKN: [20, 62], IND: [19, 63], WAS: [17, 65] }),
  },
  "2023-2024": {
    West: actualRows(["OKC", "DEN", "MIN", "LAC", "DAL", "PHX", "NOP", "LAL", "SAC", "GSW", "HOU", "UTA", "MEM", "SAS", "POR"]),
    East: actualRows(["BOS", "NYK", "MIL", "CLE", "ORL", "IND", "PHI", "MIA", "CHI", "ATL", "BKN", "TOR", "CHA", "DET", "WAS"]),
  },
  "2024-2025": {
    West: actualRows(["OKC", "HOU", "LAL", "DEN", "LAC", "MIN", "GSW", "MEM", "SAC", "PHX", "DAL", "POR", "SAS", "NOP", "UTA"]),
    East: actualRows(["CLE", "BOS", "NYK", "IND", "MIL", "DET", "ORL", "ATL", "MIA", "CHI", "TOR", "BKN", "PHI", "CHA", "WAS"]),
  },
};

const historicalStandingsFor = (key: string) => HISTORICAL_STANDINGS[key] ?? { West: [], East: [] };

function ranksFor(standings: { West: NbaStandingRow[]; East: NbaStandingRow[] }) {
  const map = new Map<string, number>();
  (["West", "East"] as Conference[]).forEach((conf) => standings[conf].forEach((row, index) => map.set(row.teamId, index + 1)));
  return map;
}

const picks = (West: string[], East: string[]): PredictionPicks => ({ West, East });

// Normalized from past-standings.md. The same Leaderboard and board popup
// render this archive, so the recorded picks stay inspectable rather than
// becoming a second, display-only implementation.
const PAST_SEASONS: HistoricalSeason[] = [
  {
    key: "2025-2026",
    label: "2025–26",
    rows: [
      { name: "Owen", points: 0, picks: picks(["OKC", "HOU", "DEN", "GSW", "MIN", "LAC", "LAL", "SAS", "DAL", "MEM", "NOP", "SAC", "POR", "PHX", "UTA"], ["CLE", "NYK", "ORL", "ATL", "MIL", "DET", "PHI", "MIA", "BOS", "TOR", "IND", "CHA", "CHI", "WAS", "BKN"]), extras: { awards: { MVP: "Shai Gilgeous-Alexander", ROY: "Egor Demin", MIP: "Matas Buzelis", DPOY: "Victor Wembanyama", "6MOY": "Naz Reid", CPOY: "Stephen Curry", COY: "Quin Snyder", FMVP: "Shai Gilgeous-Alexander" }, champion: "OKC" } },
      { name: "Jacob", points: 0, picks: picks(["GSW", "UTA", "OKC", "SAS", "DAL", "POR", "MEM", "MIN", "NOP", "PHX", "SAC", "DEN", "LAC", "HOU", "LAL"], ["NYK", "CLE", "MIA", "MIL", "CHA", "ORL", "TOR", "DET", "ATL", "BOS", "BKN", "PHI", "CHI", "IND", "WAS"]), extras: { awards: { MVP: "Steph Curry", ROY: "Ace Bailey", MIP: "Kevon Looney", DPOY: "LeBron James", "6MOY": "Lou Williams", CPOY: "Mason Plumlee", COY: "Will Hardy", FMVP: "Jimmy Butler" }, champion: "GSW" } },
      { name: "Ben", points: 0, picks: picks(["OKC", "HOU", "DEN", "MIN", "SAS", "LAL", "LAC", "GSW", "POR", "DAL", "MEM", "NOP", "PHX", "SAC", "UTA"], ["NYK", "CLE", "DET", "ORL", "ATL", "MIL", "BOS", "PHI", "IND", "MIA", "TOR", "CHA", "CHI", "WAS", "BKN"]), extras: { awards: { MVP: "Luka Doncic", ROY: "Cooper Flagg", MIP: "Ausar Thompson", DPOY: "Victor Wembanyama", "6MOY": "Jordan Clarkson", CPOY: "Anthony Edwards", COY: "Jahmal Mosley", FMVP: "Nikola Jokic" }, champion: "DEN" } },
      { name: "Eli", points: 0, picks: picks(["OKC", "DEN", "HOU", "MIN", "LAL", "SAS", "GSW", "LAC", "DAL", "MEM", "NOP", "POR", "PHX", "SAC", "UTA"], ["CLE", "NYK", "DET", "ORL", "MIL", "ATL", "PHI", "IND", "BOS", "TOR", "MIA", "CHA", "WAS", "CHI", "BKN"]), extras: { awards: { MVP: "Luka Doncic", ROY: "VJ Edgecombe", MIP: "Ausar Thompson", DPOY: "Victor Wembanyama", "6MOY": "Jordan Clarkson", CPOY: "LeBron James", COY: "JJ Redick", FMVP: "Donovan Mitchell" }, champion: "CLE" } },
      { name: "Oliver", points: 0, picks: picks(["OKC", "HOU", "DEN", "MIN", "LAC", "GSW", "LAL", "SAS", "DAL", "POR", "MEM", "NOP", "SAC", "PHX", "UTA"], ["CLE", "NYK", "ORL", "DET", "MIL", "ATL", "PHI", "BOS", "IND", "MIA", "TOR", "CHI", "CHA", "WAS", "BKN"]), extras: { awards: { MVP: "Nikola Jokic", ROY: "Cooper Flagg", MIP: "Amen Thompson", DPOY: "Victor Wembanyama", "6MOY": "Ty Jerome", CPOY: "Anthony Edwards", COY: "Jamahl Mosley", FMVP: "Nikola Jokic" }, champion: "DEN" } },
      { name: "Ronan", points: 0, picks: picks(["OKC", "DEN", "HOU", "MIN", "LAL", "LAC", "GSW", "DAL", "MEM", "SAS", "NOP", "POR", "PHX", "SAC", "UTA"], ["NYK", "CLE", "PHI", "MIL", "ORL", "DET", "BOS", "MIA", "IND", "ATL", "CHI", "CHA", "BKN", "TOR", "WAS"]), extras: { awards: { MVP: "Luka Doncic", ROY: "Dylan Harper", MIP: "Scoot Henderson", DPOY: "Dyson Daniels", "6MOY": "Payton Pritchard", CPOY: "Cade Cunningham", COY: "Chris Finch", FMVP: "Nikola Jokic" }, champion: "DEN" } },
      { name: "Alejandro", points: 0, picks: picks(["OKC", "HOU", "DEN", "LAL", "LAC", "MIN", "GSW", "DAL", "SAS", "MEM", "SAC", "POR", "NOP", "PHX", "UTA"], ["NYK", "CLE", "ORL", "MIL", "IND", "DET", "BOS", "ATL", "MIA", "CHI", "PHI", "TOR", "BKN", "WAS", "CHA"]), extras: { awards: {} } },
    ],
    actualStandings: historicalStandingsFor("2025-2026"),
    actualChampion: "NYK",
    actualAwards: { awards: { MVP: "Shai Gilgeous-Alexander", ROY: "Cooper Flagg", MIP: "Nickeil Alexander-Walker", DPOY: "Victor Wembanyama", "6MOY": "Keldon Johnson", CPOY: "Shai Gilgeous-Alexander", COY: "Joe Mazzulla", FMVP: "Jalen Brunson" }, champion: "NYK" },
  },
  {
    key: "2024-2025",
    label: "2024–25",
    rows: [
      { name: "Oliver", points: 14, picks: picks(["OKC", "MIN", "DEN", "MEM", "DAL", "PHX", "NOP", "SAC", "GSW", "LAL", "HOU", "LAC", "SAS", "UTA", "POR"], ["BOS", "NYK", "PHI", "MIL", "CLE", "ORL", "IND", "MIA", "ATL", "TOR", "CHI", "CHA", "DET", "WAS", "BKN"]), extras: { awards: {}, champion: "MIN" } },
      { name: "Ronan", points: 22, picks: picks(["OKC", "DAL", "MEM", "DEN", "MIN", "SAC", "PHX", "NOP", "LAC", "LAL", "GSW", "SAS", "HOU", "UTA", "POR"], ["BOS", "MIL", "NYK", "IND", "CLE", "PHI", "ORL", "MIA", "ATL", "CHI", "TOR", "BKN", "WAS", "CHA", "DET"]), extras: { awards: {}, champion: "BOS" } },
      { name: "Eli", points: 13, picks: picks(["MEM", "OKC", "MIN", "DAL", "DEN", "NOP", "PHX", "SAC", "HOU", "GSW", "LAL", "LAC", "SAS", "UTA", "POR"], ["BOS", "MIL", "NYK", "PHI", "IND", "CLE", "ORL", "MIA", "TOR", "CHA", "ATL", "CHI", "WAS", "BKN", "DET"]), extras: { awards: {}, champion: "PHI" } },
      { name: "Ben", points: 17, picks: picks(["OKC", "DAL", "MIN", "DEN", "MEM", "PHX", "SAC", "HOU", "NOP", "SAS", "GSW", "LAL", "LAC", "UTA", "POR"], ["BOS", "NYK", "PHI", "MIL", "CLE", "IND", "ORL", "MIA", "ATL", "CHI", "TOR", "WAS", "BKN", "CHA", "DET"]), extras: { awards: {}, champion: "DAL" } },
      { name: "Owen", points: 16, picks: picks(["OKC", "MIN", "MEM", "DEN", "DAL", "PHX", "NOP", "SAC", "GSW", "HOU", "LAL", "SAS", "UTA", "LAC", "POR"], ["BOS", "NYK", "PHI", "IND", "MIL", "ORL", "CLE", "MIA", "ATL", "TOR", "CHI", "CHA", "DET", "WAS", "BKN"]), extras: { awards: {}, champion: "OKC" } },
      { name: "Jacob", points: 17, picks: picks(["OKC", "MIN", "DEN", "MEM", "DAL", "PHX", "GSW", "SAC", "LAL", "NOP", "LAC", "HOU", "SAS", "UTA", "POR"], ["BOS", "PHI", "NYK", "MIL", "CLE", "ORL", "IND", "CHA", "MIA", "ATL", "TOR", "CHI", "WAS", "DET", "BKN"]), extras: { awards: {}, champion: "BOS" } },
      { name: "Alejandro", points: 3, picks: picks(["DEN", "MEM", "DAL", "NOP", "MIN", "SAS", "POR", "PHX", "OKC", "GSW", "LAL", "UTA", "HOU", "LAC", "SAC"], ["BOS", "MIL", "BKN", "WAS", "MIA", "CHA", "TOR", "CHI", "PHI", "DET", "NYK", "IND", "CLE", "ATL", "ORL"]), extras: { awards: {}, champion: "MEM" } },
    ],
    actualStandings: historicalStandingsFor("2024-2025"),
    actualChampion: "OKC",
    actualAwards: { awards: { MVP: "Shai Gilgeous-Alexander", ROY: "Stephon Castle", MIP: "Dyson Daniels", DPOY: "Dyson Daniels", "6MOY": "Payton Pritchard", CPOY: "Shai Gilgeous-Alexander", COY: "Kenny Atkinson", FMVP: "Shai Gilgeous-Alexander" }, champion: "OKC" },
  },
  {
    key: "2023-2024",
    label: "2023–24",
    rows: [
      { name: "Oliver", points: 17, picks: picks(["DEN", "PHX", "LAL", "GSW", "SAC", "MEM", "LAC", "MIN", "DAL", "OKC", "NOP", "UTA", "SAS", "POR", "HOU"], ["BOS", "MIL", "CLE", "PHI", "NYK", "MIA", "ATL", "IND", "CHI", "BKN", "TOR", "ORL", "WAS", "CHA", "DET"]), extras: { awards: {}, champion: "GSW" } },
      { name: "Ronan", points: 10, picks: picks(["DEN", "SAC", "PHX", "LAL", "GSW", "MEM", "LAC", "DAL", "MIN", "UTA", "SAS", "OKC", "NOP", "POR", "HOU"], ["MIL", "BOS", "PHI", "CLE", "NYK", "MIA", "BKN", "CHI", "TOR", "ATL", "IND", "ORL", "WAS", "DET", "CHA"]), extras: { awards: {}, champion: "BOS" } },
      { name: "Eli", points: 16, picks: picks(["LAL", "DEN", "PHX", "SAC", "OKC", "LAC", "GSW", "MEM", "NOP", "DAL", "MIN", "HOU", "UTA", "SAS", "POR"], ["BOS", "MIL", "CLE", "PHI", "MIA", "NYK", "IND", "ATL", "ORL", "DET", "CHI", "BKN", "CHA", "WAS", "TOR"]), extras: { awards: {}, champion: "LAL" } },
      { name: "Ben", points: 15, picks: picks(["DEN", "SAC", "LAL", "GSW", "PHX", "LAC", "DAL", "OKC", "MEM", "SAS", "MIN", "NOP", "UTA", "HOU", "POR"], ["MIL", "BOS", "PHI", "CLE", "NYK", "ATL", "MIA", "CHI", "BKN", "IND", "WAS", "TOR", "ORL", "CHA", "DET"]), extras: { awards: {}, champion: "DAL" } },
      { name: "Jacob", points: 15, picks: picks(["DEN", "PHX", "GSW", "LAL", "MEM", "LAC", "SAC", "DAL", "MIN", "OKC", "NOP", "UTA", "SAS", "HOU", "POR"], ["BOS", "MIL", "PHI", "CLE", "MIA", "NYK", "ATL", "CHA", "TOR", "CHI", "BKN", "IND", "ORL", "WAS", "DET"]), extras: { awards: {}, champion: "CHA" } },
      { name: "Owen", points: 14, picks: picks(["DEN", "PHX", "GSW", "LAL", "LAC", "OKC", "MEM", "SAC", "MIN", "NOP", "SAS", "DAL", "HOU", "UTA", "POR"], ["BOS", "MIL", "CLE", "PHI", "MIA", "NYK", "ATL", "BKN", "IND", "CHI", "TOR", "CHA", "ORL", "DET", "WAS"]), extras: { awards: {}, champion: "DEN" } },
    ],
    actualStandings: historicalStandingsFor("2023-2024"),
    actualChampion: "BOS",
    actualAwards: { awards: { MVP: "Nikola Jokic", ROY: "Victor Wembanyama", MIP: "Tyrese Maxey", DPOY: "Rudy Gobert", "6MOY": "Naz Reid", CPOY: "Stephen Curry", COY: "Mark Daigneault", FMVP: "Jaylen Brown" }, champion: "BOS" },
  },
];

function scoredHistoricalRows(season: HistoricalSeason) {
  const live = {
    West: season.actualStandings.West.map((row) => row.teamId),
    East: season.actualStandings.East.map((row) => row.teamId),
  };
  return season.rows.map((row) => {
    const west = scoreConference(row.picks.West, live.West, "West");
    const east = scoreConference(row.picks.East, live.East, "East");
    return { name: row.name, points: west.points + east.points };
  });
}

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
function LiveStandingsList({ conf, rows, champion, standingsLabel }: { conf: Conference; rows: NbaStandingRow[]; champion?: string; standingsLabel?: string }) {
  return (
    <div className="space-y-2">
      <div className="scrap cutout-b mb-2">
        <span className="scrap-cut-b block bg-ink px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-cream">
          {standingsLabel ?? "Live standings"}
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
                {team.id === champion && <span aria-label="champion" title="Champion"> 👑</span>}
              </span>
              {(row.wins !== 0 || row.losses !== 0) && <span className="shrink-0 font-mono text-[9px] tabular-nums text-ink/50">
                {row.wins}-{row.losses}
              </span>}
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
  showEditButton = true,
  showSavedStatus = true,
  predictedChampion,
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
  showEditButton?: boolean;
  showSavedStatus?: boolean;
  predictedChampion?: string;
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
          {team.name}{team.id === predictedChampion && <span aria-label="predicted champion" title="Predicted champion"> 👑</span>}
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
          {showSavedStatus && (saved ? (
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
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          {showEditButton && <button
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
          </button>}
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
      className={`block w-fit max-w-full truncate font-bold ${
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

function ProgressionChart({
  snapshots,
}: {
  snapshots: ProgressionSnapshot[];
}) {
  const names = PARTICIPANTS.filter((name) => snapshots.some((snapshot) => snapshot.scores[name] !== undefined));
  const width = Math.max(720, snapshots.length * 72);
  const height = 280;
  const maxScore = Math.max(1, ...snapshots.flatMap((snapshot) => Object.values(snapshot.scores)));
  const x = (index: number) => (snapshots.length === 1 ? width / 2 : (index / (snapshots.length - 1)) * (width - 48) + 24);
  const y = (score: number) => height - 34 - (score / maxScore) * (height - 62);
  const colors = ["#C1442D", "#E8642F", "#2F7A6B", "#274B6D", "#7A5C2E", "#5B3C88", "#1A1410"];

  return (
    <div className="paper-sheet cut-c overflow-hidden p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="scrap cutout-b -rotate-[0.4deg]">
            <span className="scrap-cut block bg-ink px-4 py-1.5 font-sign text-2xl font-bold uppercase tracking-wide text-cream">Season prediction race</span>
          </span>

        </div>
      </div>
      {snapshots.length === 0 ? (
        <p className="graph-paper scrap-cut-lg p-5 font-mono text-xs uppercase tracking-wider text-ink/65">Season has not started yet!</p>
      ) : (
      <div className="overflow-x-auto pb-2">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Weekly prediction progression chart" className="min-w-[720px] w-full">
          <line x1="24" y1={height - 34} x2={width - 24} y2={height - 34} stroke="#2A2620" strokeWidth="1.5" />
          <line x1="24" y1="18" x2="24" y2={height - 34} stroke="#2A2620" strokeWidth="1.5" />
          {[0, Math.ceil(maxScore / 2), maxScore].map((tick) => (
            <g key={tick}>
              <line x1="24" y1={y(tick)} x2={width - 24} y2={y(tick)} stroke="#2A2620" strokeOpacity="0.14" strokeDasharray="3 5" />
              <text x="18" y={y(tick) + 4} textAnchor="end" fontSize="9" fill="#2A2620">{tick}</text>
            </g>
          ))}
          {names.map((name, nameIndex) => {
            const points = snapshots.map((snapshot, index) => `${x(index)},${y(snapshot.scores[name] ?? 0)}`).join(" ");
            return (
              <g key={name}>
                <polyline points={points} fill="none" stroke={colors[nameIndex % colors.length]} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                {snapshots.map((snapshot, index) => (
                  <circle key={`${name}-${snapshot.week}`} cx={x(index)} cy={y(snapshot.scores[name] ?? 0)} r="3.5" fill={colors[nameIndex % colors.length]}>
                    <title>Week {snapshot.week} — {new Date(`${snapshot.date}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric" })} — {name}: {snapshot.scores[name] ?? 0} points</title>
                  </circle>
                ))}
              </g>
            );
          })}
          {snapshots.map((snapshot, index) => (
            index === 0 || index === snapshots.length - 1 || index % 4 === 0 ? (
              <text key={snapshot.week} x={x(index)} y={height - 12} textAnchor="middle" fontSize="9" fill="#2A2620">{new Date(`${snapshot.date}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</text>
            ) : null
          ))}
        </svg>
      </div>
      )}
      {snapshots.length > 0 && <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {names.map((name, index) => (
          <span key={name} className="scrap cutout-b">
            <span className="scrap-cut-b block bg-cream px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink" style={{ borderLeft: `4px solid ${colors[index % colors.length]}` }}>{name}</span>
          </span>
        ))}
      </div>}
    </div>
  );
}

function Leaderboard({
  rows,
  onOpen,
  interactive = true,
  seasonLabel,
  showMax = true,
}: {
  seasonLabel?: string;
  rows: Array<{
    name: string;
    points: number;
    max?: number;
    perConf?: Array<{ conf: Conference; points: number; max: number }>;
  }>;
  onOpen: (name: string, rank: number) => void;
  interactive?: boolean;
  showMax?: boolean;
}) {
  const ranked = [...rows].sort((a, b) => b.points - a.points);

  return (
    <div className="paper-sheet cut-lg overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink/60 bg-[#e2d5b2] px-5 py-3.5 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="scrap cutout-b">
            <span className="scrap-cut-b block bg-ink px-4 py-1.5 font-sign text-xl font-bold uppercase tracking-[0.08em] text-cream">
              Leaderboard
            </span>
          </span>
          {seasonLabel && <span className="scrap cutout-b rotate-[0.6deg]"><span className="scrap-cut block bg-pool-orange px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-black">{seasonLabel}</span></span>}
        </div>
        <span className="scrap cutout-b">
          <span className="scrap-cut block bg-cream px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-ink/55">
            {interactive ? "click a row to view/edit picks" : "archived pool scores"}
          </span>
        </span>
      </div>
      <ol className="lb-rows">
          {ranked.map((row, i) => (
            <li key={row.name}>
              <button
                type="button"
                onClick={interactive ? () => onOpen(row.name, i + 1) : undefined}
                aria-label={interactive ? `View ${row.name}'s predictions` : `${row.name}'s archived score`}
                className={`group flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors sm:px-6 ${
                  interactive ? "hover:bg-ink/[0.07]" : "cursor-default"
                }`}
              >
                <span className={i >= 3 ? "cutout-outline shrink-0" : "shrink-0"}>
                  <span
                    className={`block px-2.5 py-1 text-center font-sign text-xl font-bold ${
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
                </span>
                <span className="cutout-outline min-w-0 flex-1">
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
                      i === 0 && row.points !== null && row.points > 0
                        ? "scrap-cut bg-pool-orange text-black"
                        :                      i === 1 && row.points !== null && row.points > 0
                          ? "scrap-cut-d bg-pinRed/85 text-cream"
                          :                      i === 2 && row.points !== null && row.points > 0
                            ? "scrap-cut-e bg-ink text-cream"
                            : `${i % 2 ? "scrap-cut-c" : "scrap-cut-b"} bg-[#F4EDDA] text-ink`
                    }`}
                >
                    {row.points}
                    {showMax && row.max !== undefined && (
                      <span
                        className={`ml-0.5 font-mono text-[10px] ${
                          i === 0 && row.points !== null && row.points > 0
                            ? "text-black/55"
                            :                      i === 2 && row.points !== null && row.points > 0
                              ? "text-cream/55"
                              : "text-ink/45"
                        }`}
                      >
                        /{row.max}
                      </span>
                    )}
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

const AWARD_LABELS = ["MVP", "ROY", "MIP", "DPOY", "6MOY", "CPOY", "COY", "FMVP"] as const;
type AwardLabel = (typeof AWARD_LABELS)[number];

function PredictionExtrasCard({
  extras,
  actualChampion,
  editable = false,
  onChange,
}: {
  extras: PredictionExtras;
  actualChampion?: string;
  editable?: boolean;
  onChange?: (extras: PredictionExtras) => void;
}) {
  const [championError, setChampionError] = useState<string | null>(null);
  const update = (key: string, value: string) => {
    if (!onChange) return;
    if (key === "Champion") {
      const normalized = value.trim().toUpperCase();
      if (!normalized) {
        setChampionError(null);
        onChange({ ...extras, champion: undefined });
      } else if (normalized.length > 3 || !TEAMS_BY_ID.has(normalized)) {
        setChampionError("Use a valid three-letter NBA team code, such as DEN.");
        onChange({ ...extras, champion: normalized });
      } else {
        setChampionError(null);
        onChange({ ...extras, champion: normalized });
      }
    } else onChange({ ...extras, awards: { ...extras.awards, [key]: value || undefined } });
  };
  return (
    <section className="mt-3 paper-sheet cut-c p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="scrap cutout-b"><span className="scrap-cut block bg-ink px-3 py-1 font-sign text-xl font-bold uppercase tracking-wide text-cream">Awards + title</span></span>
      </div>
      <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {[...AWARD_LABELS, "Champion"].map((label) => {
          const awardKey = label as AwardLabel;
          const value = label === "Champion" ? extras.champion ?? "" : extras.awards[awardKey] ?? "";
          const correct = label === "Champion" && actualChampion && value === actualChampion;
          return (
            <label key={label} className={`scrap cutout-b flex items-center justify-between gap-3 px-2 py-1.5 font-mono text-[10px] ${correct ? "bg-pinGreen/25 text-pinTeal" : "bg-cream"}`}>
              <span className="font-bold uppercase text-ink/55">{label}</span>
              {editable ? (
                <span className="flex min-w-0 flex-col items-end">
                  <input value={value} onChange={(event) => update(label, event.target.value)} maxLength={label === "Champion" ? 3 : undefined} placeholder={label === "Champion" ? "DEN" : "Your pick"} className={`min-w-0 w-32 border-b bg-transparent px-1 text-right uppercase text-ink outline-none ${label === "Champion" && championError ? "border-pinRed text-pinRed" : "border-ink/30 focus:border-pool-orange"}`} />
                  {label === "Champion" && championError && <span role="alert" className="mt-1 max-w-32 text-right font-mono text-[9px] leading-tight text-pinRed">{championError}</span>}
                </span>
              ) :              <span className="scrap-cut-b block text-right text-ink">{value || "—"}{correct && " 👑"}</span>}
            </label>
          );
        })}
      </div>
    </section>
  );
}

function ActualAwardsCard({ awards }: { awards: PredictionExtras }) {
  return (
    <section className="mt-3 paper-sheet cut-c p-4">
      <span className="scrap cutout-b"><span className="scrap-cut block bg-pool-orange px-3 py-1 font-sign text-xl font-bold uppercase tracking-wide text-black">Actual awards</span></span>
      <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {[...AWARD_LABELS, "Champion"].map((label) => {
          const key = label as AwardLabel;
          const value = label === "Champion" ? awards.champion : awards.awards[key];
          return <div key={label} className="scrap cutout-b flex items-center justify-between gap-2 bg-cream px-2 py-1.5 font-mono text-[10px]"><span className="font-bold uppercase text-ink/55">{label}</span><span className="scrap-cut-b block max-w-[9rem] truncate text-right text-ink">{value ?? "—"}</span></div>;
        })}
      </div>
    </section>
  );
}

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
  showLiveRails = true,
  seasonStarted,
  actualChampion,
  actualAwards,
  extras,
  readOnly = false,
  onExtrasChange,
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
  showLiveRails?: boolean;
  seasonStarted: boolean;
  actualChampion?: string;
  actualAwards?: PredictionExtras;
  extras?: PredictionExtras;
  readOnly?: boolean;
  onExtrasChange?: (extras: PredictionExtras) => void;
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
          {showLiveRails && (
            <aside className="hidden w-56 shrink-0 xl:block">
              <div className="cut-shadow relative">
                <span aria-hidden className="cut-shadow-piece" />
                <div className="paper-sheet cut-c rotate-[0.35deg] p-2.5">
                  <LiveStandingsList conf="West" rows={liveRanksData.West} champion={actualChampion} standingsLabel={readOnly ? "Actual standings" : undefined} />
                </div>
              </div>
            </aside>
          )}
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
              showEditButton={!readOnly}
              showSavedStatus={!readOnly}
              predictedChampion={extras?.champion}
            />
            {extras && <PredictionExtrasCard extras={extras} actualChampion={actualChampion} editable={!readOnly && editable} onChange={onExtrasChange} />}
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
          {showLiveRails && (
            <aside className="hidden w-56 shrink-0 xl:block">
              <div className="cut-shadow relative">
                <span aria-hidden className="cut-shadow-piece" />
                <div className="paper-sheet cut-d -rotate-[0.3deg] p-2.5">
                  <LiveStandingsList conf="East" rows={liveRanksData.East} champion={actualChampion} standingsLabel={readOnly ? "Actual standings" : undefined} />
                </div>
                {actualAwards && <div className="cut-shadow relative -ml-8 mt-4 w-72">
                  <span aria-hidden className="cut-shadow-piece" />
                  <ActualAwardsCard awards={actualAwards} />
                </div>}
              </div>
            </aside>
          )}
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
  const [historicalOpen, setHistoricalOpen] = useState<{
    seasonKey: string;
    participant: ApiParticipant;
    rank: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPastYears, setShowPastYears] = useState(false);
  const [progression, setProgression] = useState<ProgressionSnapshot[]>([]);

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

  useEffect(() => {
    let cancelled = false;
    fetch("/api/nba-standings/progression", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ checkpoints?: ProgressionSnapshot[] }>)
      .then((payload) => {
        if (!cancelled) setProgression(payload.checkpoints ?? []);
      })
      .catch(() => {
        if (!cancelled) setProgression([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const updateLiveExtras = useCallback((extras: PredictionExtras) => {
    if (!openName) return;
    setBoards((current) => ({
      ...current,
      [openName]: { ...(current[openName] ?? { West: chalkOrder("West"), East: chalkOrder("East") }), extras },
    }));
  }, [openName]);

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

        const next: PredictionPicks = { West: [...board.West], East: [...board.East], extras: board.extras };


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
    setHistoricalOpen(null);
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
        <div className="px-3 pb-6 sm:px-4 [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.28))]">                  <Leaderboard
          rows={leaderboardRows}
          seasonLabel="2026–27"
          showMax={false}
          onOpen={(name, rank) => {
            setHistoricalOpen(null);
            setOpenName(name);
            setOpenRank(rank);
          }}
        />
        </div>
      </div>

      <ProgressionChart snapshots={progression} />

      <div className="flex justify-center px-4">
        <button
          type="button"
          aria-expanded={showPastYears}
          onClick={() => setShowPastYears((open) => !open)}
          className="scrap cutout-b rotate-[0.5deg] transition-transform hover:-translate-y-px"
        >
          <span className="scrap-cut-b block bg-pool-orange px-6 py-3 font-sign text-xl font-bold uppercase tracking-[0.14em] text-black">
            {showPastYears ? "Hide past years" : "View past years"}
          </span>
        </button>
      </div>

      {showPastYears && (
        <section id="past-years" className="scroll-mt-6 space-y-5">
          <div className="paper-sheet cut-c p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="scrap cutout-b -rotate-[0.7deg]">
                <span className="scrap-cut block bg-ink px-4 py-1.5 font-sign text-2xl font-bold uppercase tracking-wide text-cream">
                  Past years
                </span>
              </span>
              <nav aria-label="Past season navigation" className="flex flex-wrap gap-2">
                {PAST_SEASONS.map((season) => (
                  <a
                    key={season.key}
                    href={`#past-${season.key}`}
                    className="scrap cutout-b transition-transform hover:-translate-y-px"
                  >
                    <span className="scrap-cut-b block bg-cream px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink">
                      {season.label}
                    </span>
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {PAST_SEASONS.map((season) => (
            <section key={season.key} id={`past-${season.key}`} className="scroll-mt-6">
              <div className="px-2">
                <div className="min-w-0">
                  <Leaderboard
                    rows={scoredHistoricalRows(season)}
                    seasonLabel={season.label}
                    onOpen={(name, rank) => {
                      const row = season.rows.find((candidate) => candidate.name === name);
                      if (!row) return;
                      setHistoricalOpen({
                        seasonKey: season.key,
                        participant: {
                          name: row.name,
                          picks: row.picks,
                          saved: true,
                          updatedAt: null,
                        },
                        rank,
                      });
                    }}
                    interactive
                  />
                </div>
              </div>
            </section>
          ))}
        </section>
      )}

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
        isOpen={openName !== null || historicalOpen !== null}
        participant={historicalOpen?.participant ?? openRecord}
        rank={historicalOpen?.rank ?? openRank}
        picks={historicalOpen?.participant.picks ?? (openName ? boards[openName] ?? openRecord?.picks ?? null : null)}
        isUnlocked={historicalOpen ? false : isUnlocked}
        locked={locked || historicalOpen !== null}
        activeName={activeName}
        draggingTeamId={draggingTeamId}
        dropSlot={dropSlot}
        liveRanks={historicalOpen ? ranksFor(PAST_SEASONS.find((season) => season.key === historicalOpen.seasonKey)?.actualStandings ?? historicalStandingsFor(historicalOpen.seasonKey)) : liveRanks}
        liveRanksData={historicalOpen ? (PAST_SEASONS.find((season) => season.key === historicalOpen.seasonKey)?.actualStandings ?? historicalStandingsFor(historicalOpen.seasonKey)) : liveRanksData}
        actualChampion={historicalOpen ? PAST_SEASONS.find((season) => season.key === historicalOpen.seasonKey)?.actualChampion : undefined}
        actualAwards={historicalOpen ? PAST_SEASONS.find((season) => season.key === historicalOpen.seasonKey)?.actualAwards : { awards: {} }}
        extras={historicalOpen ? (PAST_SEASONS.find((season) => season.key === historicalOpen.seasonKey)?.rows.find((row) => row.name === historicalOpen.participant.name)?.extras) : (openName ? boards[openName]?.extras ?? { awards: {} } : undefined)}
        readOnly={historicalOpen !== null}
        onExtrasChange={updateLiveExtras}
        showLiveRails
        seasonStarted={historicalOpen ? true : seasonStarted}
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
