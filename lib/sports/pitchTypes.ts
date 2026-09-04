/**
 * Pitch-type metadata shared between the model engine and the simulator UI.
 * Order matches the model's class index (see xgboost_v1_metadata.json).
 */

export const PITCH_TYPES = [
  "CH",
  "CU",
  "EP",
  "FC",
  "FF",
  "FO",
  "FS",
  "KC",
  "KN",
  "SI",
  "SL",
  "ST",
] as const;

export type PitchType = (typeof PITCH_TYPES)[number];

export const PITCH_NAMES: Record<PitchType, string> = {
  CH: "Changeup",
  CU: "Curveball",
  EP: "Eephus",
  FC: "Cutter",
  FF: "Four-Seam",
  FO: "Forkball",
  FS: "Splitter",
  KC: "Knuckle-Curve",
  KN: "Knuckleball",
  SI: "Sinker",
  SL: "Slider",
  ST: "Sweeper",
};

/** Distinct colors per pitch type (broadcast-graphic palette). */
export const PITCH_COLORS: Record<PitchType, string> = {
  CH: "#EAB308", // yellow
  CU: "#3B82F6", // blue
  EP: "#EC4899", // pink
  FC: "#A855F7", // purple
  FF: "#EF4444", // red
  FO: "#F59E0B", // amber
  FS: "#F43F5E", // rose
  KC: "#6366F1", // indigo
  KN: "#A3E635", // lime
  SI: "#F97316", // orange
  SL: "#22C55E", // green
  ST: "#06B6D4", // cyan
};

export function isPitchType(value: string): value is PitchType {
  return (PITCH_TYPES as readonly string[]).includes(value);
}