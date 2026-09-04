/**
 * Client-side inference for the XGBoost v1 pitch predictor.
 *
 * The model lives in public/data/xgboost-pitch-model.json (exported from
 * notebooks/xgboost_v1_model.joblib by notebooks/export_xgboost_for_web.py)
 * and reimplements xgboost's `multi:softprob` prediction:
 *
 *     raw[c]  = base_score[c] + sum of leaf values over trees assigned to class c
 *     prob[c] = softmax(raw)[c]
 *
 * Each tree belongs to exactly one class (model.trees[i].c); internal nodes
 * are traversed with `feature[f[node]] < s[node] ? left : right`.
 *
 * Feature encodings below were reverse-engineered from the model's split
 * thresholds (the feature-engineering script lives outside this repo), so
 * they're documented assumptions — swap in the real pipeline's encodings if
 * they differ.
 */

import { PITCH_TYPES, type PitchType } from "./pitchTypes.ts";

export type PitchModelTree = {
  c: number; // class index this tree votes for
  l: number[]; // left child per node (-1 = leaf)
  r: number[]; // right child per node (-1 = leaf)
  s: number[]; // split threshold (internal) or leaf value
  f: number[]; // feature index per split
};

export type PitchModel = {
  model_version: string;
  pitch_types: string[];
  pitch_type_mapping: Record<string, number>;
  features: string[];
  base_score: number[];
  trees: PitchModelTree[];
};

export type PitchProbabilities = { type: PitchType; prob: number }[];

let modelPromise: Promise<PitchModel> | null = null;

/** Lazily fetch + parse the model once per page load. */
export function loadPitchModel(): Promise<PitchModel> {
  if (!modelPromise) {
    modelPromise = fetch("/data/xgboost-pitch-model.json")
      .then((res) => {
        if (!res.ok) throw new Error(`model fetch failed: ${res.status}`);
        return res.json() as Promise<PitchModel>;
      })
      .catch((err) => {
        modelPromise = null; // allow retry
        throw err;
      });
  }
  return modelPromise;
}

/** Full softmax probability vector over the model's 12 pitch classes. */
export function predictProba(model: PitchModel, features: number[]): number[] {
  const raws = model.base_score.slice();
  for (const tree of model.trees) {
    const { l, r, s, f } = tree;
    let node = 0;
    while (l[node] !== -1 && r[node] !== -1) {
      node = features[f[node]] < s[node] ? l[node] : r[node];
    }
    raws[tree.c] += s[node];
  }
  const max = Math.max(...raws);
  const exps = raws.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

export function predictProbabilities(model: PitchModel, features: number[]): PitchProbabilities {
  const probs = predictProba(model, features);
  return PITCH_TYPES.map((type, i) => ({ type, prob: probs[i] })).sort((a, b) => b.prob - a.prob);
}

// ---------------------------------------------------------------------------
// Feature vector construction
// ---------------------------------------------------------------------------

export type AtBatContext = {
  balls: number;
  strikes: number;
  pitcherHand: "R" | "L";
  batterHand: "R" | "L" | "S";
  outs: number;
  inning: number;
  /** Pitches thrown by the pitcher so far this game (drives workload bucket). */
  pitchesThrown: number;
  /** Strikeout rate as a percent, e.g. 25 = 25%. */
  batterKRate: number;
  runnerOn1b: boolean;
  runnerOn2b: boolean;
  runnerOn3b: boolean;
  /** Batting team's runs minus fielding team's runs. */
  scoreDiff: number;
  usage: Partial<Record<PitchType, number>>;
};

/** Encoding assumptions, reverse-engineered from the model's split thresholds. */
const HAND: Record<string, number> = { R: 0, L: 1 }; // pitcher_hand / batter_hand
const RUNNER_ID_OCCUPIED = 600_000; // training used MLBAM-style runner IDs; 0 when empty

/**
 * Workload bucket from pitches thrown — 5 buckets inferred from the model
 * (splits observed at 1, 2, 3). Assumed 0-20 / 21-40 / 41-60 / 61-80 / 81+.
 */
export function workloadBucket(pitchesThrown: number): number {
  if (pitchesThrown <= 20) return 0;
  if (pitchesThrown <= 40) return 1;
  if (pitchesThrown <= 60) return 2;
  if (pitchesThrown <= 80) return 3;
  return 4;
}

/**
 * handedness_matchup: 2*pitcher_hand + batter_hand (0=RvR, 1=RvL, 2=LvR,
 * 3=LvL); switch hitters take 4, matching the model's observed 0-4 range.
 */
function handednessMatchup(pitcherHand: "R" | "L", batterHand: "R" | "L" | "S"): number {
  if (batterHand === "S") return 4;
  return 2 * HAND[pitcherHand] + HAND[batterHand];
}

export function buildFeatureVector(ctx: AtBatContext): number[] {
  const usageVector = PITCH_TYPES.map((type) => ctx.usage[type] ?? 0);
  return [
    ctx.balls, // 0 balls
    ctx.strikes, // 1 strikes
    HAND[ctx.pitcherHand], // 2 pitcher_hand
    HAND[ctx.batterHand], // 3 batter_hand
    handednessMatchup(ctx.pitcherHand, ctx.batterHand), // 4 handedness_matchup
    ctx.outs, // 5 outs_when_up
    ctx.inning, // 6 inning
    workloadBucket(ctx.pitchesThrown), // 7 workload_bucket_encoded
    ctx.batterKRate, // 8 batter_k_rate
    ctx.runnerOn1b ? RUNNER_ID_OCCUPIED : 0, // 9 runner_on_1b
    ctx.runnerOn2b ? RUNNER_ID_OCCUPIED : 0, // 10 runner_on_2b
    ctx.runnerOn3b ? RUNNER_ID_OCCUPIED : 0, // 11 runner_on_3b
    ctx.runnerOn1b && ctx.runnerOn2b && ctx.runnerOn3b ? 1 : 0, // 12 bases_loaded
    ctx.scoreDiff, // 13 score_diff
    ...usageVector, // 14-25 CH_pct..ST_pct
  ];
}