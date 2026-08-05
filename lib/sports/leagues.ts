// lib/sports/leagues.ts
//
// League registry + display helpers. This is where league-specific
// presentation is isolated: adding a new sport means adding one entry
// here (and data shaped like types.ts) — no component changes.

import type { LeagueId, LiveGame, Streak, Team } from "./types";

export interface LeagueConfig {
  id: LeagueId;
  name: string;
  shortName: string;
  sport: string;
  /** How the record string is composed. */
  recordFormat: "wl" | "wlot" | "wld";
  /** Current period label for a live game, e.g. "Top 7th". */
  livePeriod: (game: LiveGame) => string;
  /** Game clock for a live game — null when the sport has none (MLB). */
  liveClock: (game: LiveGame) => string | null;
}

export const LEAGUES: Record<LeagueId, LeagueConfig> = {
  mlb: {
    id: "mlb",
    name: "Major League Baseball",
    shortName: "MLB",
    sport: "Baseball",
    recordFormat: "wl",
    livePeriod: (g) => g.period, // "Top 7th"
    liveClock: () => null,
  },
  nfl: {
    id: "nfl",
    name: "National Football League",
    shortName: "NFL",
    sport: "Football",
    recordFormat: "wl",
    livePeriod: (g) => `${g.period} Quarter`,
    liveClock: (g) => g.clock ?? null,
  },
  nhl: {
    id: "nhl",
    name: "National Hockey League",
    shortName: "NHL",
    sport: "Hockey",
    recordFormat: "wlot",
    livePeriod: (g) => `${g.period} Period`,
    liveClock: (g) => g.clock ?? null,
  },
  pwhl: {
    id: "pwhl",
    name: "Professional Women's Hockey League",
    shortName: "PWHL",
    sport: "Hockey",
    recordFormat: "wlot",
    livePeriod: (g) => `${g.period} Period`,
    liveClock: (g) => g.clock ?? null,
  },
  wnba: {
    id: "wnba",
    name: "Women's National Basketball Association",
    shortName: "WNBA",
    sport: "Basketball",
    recordFormat: "wl",
    livePeriod: (g) => `${g.period} Quarter`,
    liveClock: (g) => g.clock ?? null,
  },
  mls: {
    id: "mls",
    name: "Major League Soccer",
    shortName: "MLS",
    sport: "Soccer",
    recordFormat: "wld",
    livePeriod: (g) => `${g.period} Half`,
    liveClock: (g) => g.clock ?? null,
  },
  nwsl: {
    id: "nwsl",
    name: "National Women's Soccer League",
    shortName: "NWSL",
    sport: "Soccer",
    recordFormat: "wld",
    livePeriod: (g) => `${g.period} Half`,
    liveClock: (g) => g.clock ?? null,
  },
  mlr: {
    id: "mlr",
    name: "Major League Rugby",
    shortName: "MLR",
    sport: "Rugby",
    recordFormat: "wl",
    livePeriod: (g) => `${g.period} Half`,
    liveClock: (g) => g.clock ?? null,
  },
  nba: {
    id: "nba",
    name: "National Basketball Association",
    shortName: "NBA",
    sport: "Basketball",
    recordFormat: "wl",
    livePeriod: (g) => `${g.period} Quarter`,
    liveClock: (g) => g.clock ?? null,
  },
};

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function formatRecord(team: Team): string {
  const r = team.record;
  const format = LEAGUES[team.league].recordFormat;
  if (format === "wlot") return `${r.wins}-${r.losses}-${r.otLosses ?? 0}`;
  if (format === "wld") return `${r.wins}-${r.losses}-${r.draws ?? 0}`;
  return `${r.wins}-${r.losses}`;
}

export function formatStreak(streak: Streak): string {
  if (streak.count <= 0) return "—";
  return `${streak.type}${streak.count}`;
}

/**
 * Friendly display for a completed-game note/status. Raw feeds typically
 * abbreviate: "F" → "Final", "F/9" → "Final · 9 innings". Other notes
 * ("Preseason", "OT", "SO", …) pass through unchanged.
 */
export function formatGameNote(note: string): string {
  if (note === "F") return "Final";
  const innings = note.match(/^F\/(\d{1,2})$/);
  if (innings) return `Final · ${innings[1]} innings`;
  return note;
}

/** Full status line for a live game, e.g. "Top 7th · 2 outs · 1st & 2nd". */
export function liveStatusLine(team: Team): string {
  const game = team.currentGame;
  if (!game) return "In progress";
  const cfg = LEAGUES[team.league];
  const parts = [cfg.livePeriod(game)];
  const clock = cfg.liveClock(game);
  if (clock) parts.push(clock);
  if (game.detail) parts.push(game.detail);
  return parts.join(" · ");
}

/** Short status line for the scoreboard: period + clock only (no detail). */
export function liveScoreboardLine(team: Team): string {
  const game = team.currentGame;
  if (!game) return "In progress";
  const cfg = LEAGUES[team.league];
  const parts = [cfg.livePeriod(game)];
  const clock = cfg.liveClock(game);
  if (clock) parts.push(clock);
  return parts.join(" · ");
}

/** Compact team name for scoreboards: "Las Vegas Aces" → "Aces". */
export function shortTeamName(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  return parts[parts.length - 1] ?? name;
}

// ---------------------------------------------------------------------------
// Date helpers (parsed locally to avoid UTC shift from "yyyy-mm-dd" strings)
// ---------------------------------------------------------------------------

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** e.g. "Mon Aug 3". */
export function formatGameDate(iso: string): string {
  const dt = parseDate(iso);
  return `${DAYS[dt.getDay()]} ${MONTHS[dt.getMonth()]} ${dt.getDate()}`;
}

/** e.g. "Aug 5". */
export function formatShortDate(iso: string): string {
  const dt = parseDate(iso);
  return `${MONTHS[dt.getMonth()]} ${dt.getDate()}`;
}

// ---------------------------------------------------------------------------
// Tiny color helpers (used for hover-intensified gradient borders)
// ---------------------------------------------------------------------------

/** Lighten (amt > 0) or darken (amt < 0) a hex color toward white/black. */
export function shade(hex: string, amt: number): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  if (amt >= 0) {
    r = r + (255 - r) * amt;
    g = g + (255 - g) * amt;
    b = b + (255 - b) * amt;
  } else {
    const f = 1 + amt;
    r *= f;
    g *= f;
    b *= f;
  }
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

/** Gradient used for a team's card border. */
export function teamGradient(team: Team, hover = false): string {
  const { primary, secondary } = team.colors;
  if (hover) {
    return `linear-gradient(135deg, ${shade(primary, 0.18)} 0%, ${primary} 40%, ${secondary} 70%, ${shade(
      secondary,
      0.22
    )} 100%)`;
  }
  return `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;
}
