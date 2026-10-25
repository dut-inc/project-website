// TS port of the poker hand scoring algorithm in supabase/the-pack-schema.sql
// (the_pack_score5 / the_pack_score_under5 / the_pack_hand_rank /
// the_pack_hand_category_label). The SQL version is authoritative at
// runtime; this is the test oracle for lib/thePackHandEvaluator.test.ts and
// is also available for client-side label decoding.
//
// Scores are encoded as a single orderable number: higher is better.
// category * 15^5 + k1*15^4 + k2*15^3 + k3*15^2 + k4*15 + k5, where category
// is 0 (high card) .. 8 (straight flush) and k1..k5 are tiebreak ranks, most
// significant first. All values involved are tiny (max possible score is
// well under a million), so plain numbers are used -- no bigint needed.

import type { Card } from "./thePack";

const RANK_VALUES: Record<string, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

const BASE = 15;
const CATEGORY_DIVISOR = BASE ** 5; // 759375 -- isolates the category digit

function rankValue(card: string): number {
  return RANK_VALUES[card[0]];
}

function suitOf(card: string): string {
  return card[1];
}

export const HAND_CATEGORY_LABELS = [
  "High Card",
  "Pair",
  "Two Pair",
  "Three of a Kind",
  "Straight",
  "Flush",
  "Full House",
  "Four of a Kind",
  "Straight Flush",
] as const;

function encodeScore(category: number, kickers: number[]): number {
  let score = category;
  for (let i = 0; i < 5; i++) {
    score = score * BASE + (kickers[i] ?? 0);
  }
  return score;
}

// Groups ranks by (count desc, rank desc). Flattening this (repeating each
// rank by its count) gives the correct comparison key for every
// non-straight/non-flush category at once: pair, two pair, trips, full
// house, quads, and high card.
function groupByCountThenRank(ranks: number[]): { rank: number; count: number }[] {
  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  return [...counts.entries()]
    .map(([rank, count]) => ({ rank, count }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);
}

function flattenGroups(ranks: number[]): { flat: number[]; maxCount: number; countOf2s: number } {
  const groups = groupByCountThenRank(ranks);
  const flat: number[] = [];
  let maxCount = 0;
  let countOf2s = 0;
  for (const g of groups) {
    for (let i = 0; i < g.count; i++) flat.push(g.rank);
    if (g.count > maxCount) maxCount = g.count;
    if (g.count === 2) countOf2s += 1;
  }
  return { flat, maxCount, countOf2s };
}

// Scores exactly 5 cards.
function score5(ranks: number[], suits: string[]): number {
  const isFlush = suits.every((s) => s === suits[0]);
  const sortedDesc = [...ranks].sort((a, b) => b - a);
  const distinctRanks = [...new Set(ranks)].sort((a, b) => b - a);

  let isStraight = false;
  let straightHigh = 0;
  if (distinctRanks.length === 5) {
    if (distinctRanks[0] - distinctRanks[4] === 4) {
      isStraight = true;
      straightHigh = distinctRanks[0];
    } else if (
      distinctRanks[0] === 14 &&
      distinctRanks[1] === 5 &&
      distinctRanks[2] === 4 &&
      distinctRanks[3] === 3 &&
      distinctRanks[4] === 2
    ) {
      // The wheel: A-2-3-4-5 is a straight with 5 as its high card.
      isStraight = true;
      straightHigh = 5;
    }
  }

  if (isStraight && isFlush) return encodeScore(8, [straightHigh, 0, 0, 0, 0]);
  if (isStraight) return encodeScore(4, [straightHigh, 0, 0, 0, 0]);
  if (isFlush) return encodeScore(5, sortedDesc);

  const { flat, maxCount, countOf2s } = flattenGroups(ranks);
  const category =
    maxCount === 4
      ? 7
      : maxCount === 3 && countOf2s >= 1
        ? 6
        : maxCount === 3
          ? 3
          : countOf2s === 2
            ? 2
            : countOf2s === 1
              ? 1
              : 0;

  return encodeScore(category, flat);
}

// Scores 2-4 cards. Straight, flush, and full house are structurally
// impossible with fewer than 5 cards, so this skips those checks entirely.
function scoreUnder5(ranks: number[]): number {
  const { flat, maxCount, countOf2s } = flattenGroups(ranks);
  const category = maxCount === 4 ? 7 : maxCount === 3 ? 3 : countOf2s === 2 ? 2 : countOf2s === 1 ? 1 : 0;
  return encodeScore(category, flat);
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const [first, ...rest] = items;
  const withFirst = combinations(rest, size - 1).map((combo) => [first, ...combo]);
  const withoutFirst = combinations(rest, size);
  return [...withFirst, ...withoutFirst];
}

// Dispatches on card count: for >=5 cards, tries every 5-card subset (at
// most C(7,5)=21) and keeps the best; for <5, uses the reduced evaluator.
export function handRank(cards: Card[]): number {
  const n = cards.length;
  if (n < 2) throw new Error("Need at least 2 cards to score a hand");

  const ranks = cards.map(rankValue);
  const suits = cards.map(suitOf);

  if (n < 5) return scoreUnder5(ranks);

  const indices = cards.map((_, i) => i);
  let best = -1;
  for (const combo of combinations(indices, 5)) {
    const comboRanks = combo.map((i) => ranks[i]);
    const comboSuits = combo.map((i) => suits[i]);
    const candidate = score5(comboRanks, comboSuits);
    if (candidate > best) best = candidate;
  }
  return best;
}

export function handCategoryLabel(score: number): string {
  const category = Math.floor(score / CATEGORY_DIVISOR);
  return HAND_CATEGORY_LABELS[category] ?? "Unknown";
}
