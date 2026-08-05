// lib/sports/types.ts
//
// Shared team data model for the Seattle Sports Dashboard.
//
// This file IS the frontend/backend contract: everything the dashboard UI
// knows how to render lives here, and sport-specific detail is kept in
// optional nested fields so adding a league never forces a change to the
// common model or to the UI components.
//
// The mock data in mockTeams.ts is shaped exactly like this. When the
// Supabase/backend implementation lands, it only has to return the same
// shape — components don't change.

export type LeagueId =
  | "mlb" //  Seattle Mariners
  | "nfl" //  Seattle Seahawks
  | "nhl" //  Seattle Kraken
  | "pwhl" // Seattle Torrent
  | "wnba" // Seattle Storm
  | "mls" //  Seattle Sounders
  | "nwsl" // Seattle Reign
  | "mlr" //  Seattle Seawolves
  | "nba"; // Seattle SuperSonics (placeholder only)

/** "inactive" = placeholder team (SuperSonics) with no live data. */
export type TeamStatus = "active" | "inactive";

export type Outcome = "W" | "L" | "T" | "D";
export type HomeAway = "home" | "away";
export type StreakType = "W" | "L" | "T" | "D";

export interface TeamColors {
  /** Gradient border start. */
  primary: string;
  /** Gradient border end. */
  secondary: string;
}

export interface TeamRecord {
  wins: number;
  losses: number;
  /** NHL / PWHL overtime or shootout losses (3rd column in W-L-OTL). */
  otLosses?: number;
  /** Soccer draws (MLS / NWSL, 3rd column in W-L-D). */
  draws?: number;
  /** League standing position. */
  position?: number;
  /** Context label, e.g. "Preseason" or "2025-26". */
  label?: string;
}

export interface Streak {
  type: StreakType;
  count: number;
}

/** Most recent completed game. */
export interface GameSummary {
  /** ISO date (yyyy-mm-dd). */
  date: string;
  opponent: string;
  at: HomeAway;
  outcome: Outcome;
  teamScore: number;
  opponentScore: number;
  /** e.g. "F/10", "OT", "SO", "Preseason". */
  note?: string;
  channel?: string;
}

/** One upcoming scheduled game. */
export interface ScheduledGame {
  /** ISO date (yyyy-mm-dd). */
  date: string;
  /** Local time string, e.g. "7:10 PM". */
  time: string;
  opponent: string;
  at: HomeAway;
  channel?: string;
  /** e.g. "Preseason", "Season opener", "Cascadia Derby". */
  note?: string;
}

/**
 * A game in progress. Only present when the team is currently playing.
 * Sport-specific game state lives in `sportSpecific` (e.g. MLB outs /
 * balls / strikes) — the UI must not assume every sport has an inning,
 * quarter, period, or clock, which is why `period` / `clock` / `detail`
 * are free-form display strings.
 */
export interface LiveGame {
  opponent: string;
  at: HomeAway;
  teamScore: number;
  opponentScore: number;
  /** Display label for the current segment, e.g. "Top 7th", "3rd Quarter". */
  period: string;
  /** Game clock where the sport has one (NFL/NHL/MLS/NWSL/WNBA/MLR). */
  clock?: string;
  /** Extra situational detail, e.g. "2 outs · runners on 1st & 2nd". */
  detail?: string;
  channel?: string;
  sportSpecific?: Record<string, string | number>;
}

/** A labeled stat, e.g. { label: "Batting average", value: ".261", sublabel: "3rd" }. */
export interface StatLine {
  label: string;
  value: string | number;
  sublabel?: string;
}

export interface StandingsRow {
  position: number;
  team: string;
  /** Pre-formatted record, e.g. "62-48" or "14-6-7". */
  record: string;
  /** Soccer / hockey points, where applicable. */
  points?: number;
  gamesBack?: string;
}

export interface PlayerLeader {
  label: string;
  player: string;
  value: string;
}

export interface ScoringEvent {
  /** e.g. "T3", "Q2", "2nd". */
  period: string;
  /** "seattle" or "opponent". */
  side: "seattle" | "opponent";
  description: string;
  /** Score after the event, e.g. "SEA 4 – 3 HOU". */
  score: string;
}

export interface SeasonStats {
  offense?: StatLine[];
  defense?: StatLine[];
  misc?: StatLine[];
  standings?: StandingsRow[];
  leaders?: PlayerLeader[];
}

export interface GameStats {
  teamStats?: StatLine[];
  leaders?: PlayerLeader[];
  scoring?: ScoringEvent[];
  sportSpecific?: Record<string, string | number>;
}

export interface Team {
  id: string;
  league: LeagueId;
  name: string;
  /** e.g. "Mariners". Used for placeholder logo initials. */
  shortName: string;
  status: TeamStatus;
  /** Shown when `status === "inactive"` (SuperSonics placeholder). */
  note?: string;
  record: TeamRecord;
  streak: Streak;
  /** Total championships won (0 when none). */
  championships: number;
  colors: TeamColors;
  previousGame?: GameSummary;
  currentGame?: LiveGame;
  nextGames: ScheduledGame[];
  seasonStats?: SeasonStats;
  gameStats?: GameStats;
}
