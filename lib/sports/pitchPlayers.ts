import data from "@/public/data/pitch-predictor-players.json";
import type { PitchType } from "./pitchTypes.ts";

export type Pitcher = {
  player_id: number;
  player_name: string;
  team: string;
  hand: "R" | "L";
  /** Season usage per pitch type, summing to ~100. */
  usage: Partial<Record<PitchType, number>>;
};

export type Batter = {
  player_id: number;
  player_name: string;
  team: string;
  hand: "R" | "L" | "S";
  /** Strikeout rate, percent (e.g. 25 = 25%). */
  k_rate: number;
};

export type PitchPlayerDataset = {
  season: string;
  sample?: boolean;
  generated_from?: string;
  pitchers: Pitcher[];
  batters: Batter[];
};

export const pitchPlayerData = data as PitchPlayerDataset;

/** Top pitches a pitcher throws, sorted by usage — drives the pitch picker. */
export function pitcherTopPitches(pitcher: Pitcher, limit = 6): { type: PitchType; pct: number }[] {
  return Object.entries(pitcher.usage)
    .filter(([type]) => type in pitcher.usage)
    .map(([type, pct]) => ({ type: type as PitchType, pct: pct ?? 0 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, limit);
}