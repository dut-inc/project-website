// lib/sports/nbaStandingsPicks.ts
//
// Shared domain logic for the NBA standings prediction pool. Imported by the
// API routes (server) and the client component — keep it framework-free.

import { chalkOrder, NBA_TEAMS, TEAMS_BY_ID, type Conference, type NbaTeam } from "./nbaTeams.ts";

export const PARTICIPANTS = ["Owen", "Jacob", "Ben", "Eli", "Oliver", "Ronan", "Alejandro"] as const;
export type Participant = (typeof PARTICIPANTS)[number];

export function isParticipant(value: unknown): value is Participant {
  return typeof value === "string" && (PARTICIPANTS as readonly string[]).includes(value);
}

export type AwardKey = "MVP" | "ROY" | "MIP" | "DPOY" | "6MOY" | "CPOY" | "COY" | "FMVP";

export type PredictionExtras = {
  awards: Partial<Record<AwardKey, string>>;
  champion?: string;
};

export type PredictionPicks = {
  West: string[];
  East: string[];
  extras?: PredictionExtras;
};

export type PredictionRecord = {
  picks: PredictionPicks | null;
  updatedAt: string | null;
};

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Exact slot hit = 2 points; within one slot = 1 point; else 0.
 * The rubric lives here so the UI and any future re-scoring share one truth.
 */
export function slotPoints(rankDiff: number): number {
  if (rankDiff === 0) return 2;
  if (Math.abs(rankDiff) === 1) return 1;
  return 0;
}

export type ConferenceScore = {
  conference: Conference;
  points: number;
  max: number;
  /** Live NBA rank -> guessed rank for every team (empty while locked out). */
  perTeam: Array<{ teamId: string; guessRank: number; liveRank: number; points: number }>;
};

export function scoreConference(guess: string[], live: string[], conference: Conference): ConferenceScore {
  const liveRank = new Map(live.map((id, i) => [id, i + 1]));
  const perTeam = guess.map((teamId, i) => {
    const real = liveRank.get(teamId);
    const points = real === undefined ? 0 : slotPoints(real - (i + 1));
    return { teamId, guessRank: i + 1, liveRank: real ?? 0, points };
  });
  return {
    conference,
    points: perTeam.reduce((sum, t) => sum + t.points, 0),
    max: guess.length * 2,
    perTeam,
  };
}

export function totalPoints(guess: PredictionPicks, live: PredictionPicks): number {
  return scoreConference(guess.West, live.West, "West").points + scoreConference(guess.East, live.East, "East").points;
}

export const MAX_TOTAL_POINTS = 60; // 30 teams * 2 conferences * 2 points

// ---------------------------------------------------------------------------
// Lock deadline
// ---------------------------------------------------------------------------

/**
 * Picks lock at tip-off of the new season: October 20th, 2026. After the lock
 * the boards freeze — anyone can browse, nobody can edit. `now` is injectable
 * for tests; the server route passes its own clock so a stale client can't
 * unlock anything by lying about the date.
 */
export const SEASON_TIP_OFF_ISO = "2026-10-20T00:00:00-04:00";

export function isSeasonLocked(now: Date = new Date()): boolean {
  return now.getTime() >= new Date(SEASON_TIP_OFF_ISO).getTime();
}

// ---------------------------------------------------------------------------
// Validation / hydration
// ---------------------------------------------------------------------------

function validTeamIds(): Set<string> {
  return new Set(NBA_TEAMS.map((t) => t.id));
}

export function normalizeChampionCode(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return code.length === 3 && validTeamIds().has(code) ? code : null;
}

/**
 * Parse an arbitrary JSON-shaped value into PredictionPicks. Returns null
 * unless both conferences hold exactly the right 15 teams with no dupes.
 */
export function parsePicks(value: unknown): PredictionPicks | null {
  if (typeof value !== "object" || value === null) return null;
  const candidates = value as Record<string, unknown>;
  const known = validTeamIds();

  const parseSide = (raw: unknown, expected: Conference): string[] | null => {
    if (!Array.isArray(raw) || raw.length !== 15) return null;
    const seen = new Set<string>();
    for (const entry of raw) {
      if (typeof entry !== "string" || !known.has(entry)) return null;
      const team = TEAMS_BY_ID.get(entry);
      if (!team || team.conference !== expected) return null;
      if (seen.has(entry)) return null;
      seen.add(entry);
    }
    return [...seen];
  };

  const west = parseSide(candidates.West, "West");
  const east = parseSide(candidates.East, "East");
  if (!west || !east) return null;
  const rawExtras = candidates.extras;
  const extras = typeof rawExtras === "object" && rawExtras !== null ? rawExtras as Record<string, unknown> : undefined;
  const awards = extras?.awards;
  const parsedAwards: Partial<Record<AwardKey, string>> = {};
  if (typeof awards === "object" && awards !== null) {
    for (const key of ["MVP", "ROY", "MIP", "DPOY", "6MOY", "CPOY", "COY", "FMVP"] as AwardKey[]) {
      if (typeof (awards as Record<string, unknown>)[key] === "string") parsedAwards[key] = (awards as Record<string, string>)[key];
    }
  }
  const champion = normalizeChampionCode(extras?.champion);
  if (champion === null) return null;
  const parsedExtras = extras ? { awards: parsedAwards, ...(champion ? { champion } : {}) } : undefined;
  return { West: west, East: east, ...(parsedExtras ? { extras: parsedExtras } : {}) };
}

/**
 * Normalize stored picks: valid shapes pass through; anything partial or
 * corrupt falls back to the chalk order so a broken row never blanks a board.
 */
export function hydratePicks(value: unknown): PredictionPicks {
  const parsed = parsePicks(value);
  if (parsed) return parsed;
  return {
    West: chalkOrder("West"),
    East: chalkOrder("East"),
  };
}

export function teamOf(id: string): NbaTeam | undefined {
  return TEAMS_BY_ID.get(id);
}
