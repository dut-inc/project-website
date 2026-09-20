import { scoreConference, type PredictionPicks } from "./nbaStandingsPicks.ts";

export type ProgressionSeason = {
  key: string;
  seasonStart: string;
  seasonEnd: string;
  numberOfWeeks: number;
};

export type ProgressionSnapshot = {
  week: number;
  date: string;
  scores: Record<string, number>;
};

export type ProgressionInput = {
  name: string;
  picks: PredictionPicks;
}[];

export const CURRENT_PROGRESSION_SEASON: ProgressionSeason = {
  key: "2025-26",
  seasonStart: "2025-10-22",
  seasonEnd: "2026-04-11",
  numberOfWeeks: 25,
};

export function weeklyCheckpoints(season: ProgressionSeason, now = new Date()): { week: number; date: string }[] {
  const start = Date.parse(`${season.seasonStart}T00:00:00Z`);
  const end = Date.parse(`${season.seasonEnd}T00:00:00Z`);
  const current = now.getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start || season.numberOfWeeks < 1) return [];

  return Array.from({ length: season.numberOfWeeks }, (_, index) => {
    const ratio = index / (season.numberOfWeeks - 1 || 1);
    const timestamp = Math.round(start + (end - start) * ratio);
    return {
      week: index + 1,
      date: new Date(timestamp).toISOString().slice(0, 10),
    };
  }).filter((checkpoint) => Date.parse(`${checkpoint.date}T23:59:59Z`) <= current);
}

export function scoreSnapshot(
  participants: ProgressionInput,
  standings: { West: string[]; East: string[] },
): Record<string, number> {
  return Object.fromEntries(
    participants.map(({ name, picks }) => [
      name,
      scoreConference(picks.West, standings.West, "West").points +
        scoreConference(picks.East, standings.East, "East").points,
    ]),
  );
}

export function buildProgression(
  season: ProgressionSeason,
  participants: ProgressionInput,
  snapshots: Array<{ date: string; standings: { West: string[]; East: string[] } }>,
  now = new Date(),
): ProgressionSnapshot[] {
  const available = new Map(snapshots.map((snapshot) => [snapshot.date, snapshot.standings]));
  return weeklyCheckpoints(season, now).flatMap((checkpoint) => {
    const standings = available.get(checkpoint.date);
    return standings ? [{ ...checkpoint, scores: scoreSnapshot(participants, standings) }] : [];
  });
}
