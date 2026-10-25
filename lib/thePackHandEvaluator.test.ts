// lib/thePackHandEvaluator.test.ts
//
// Covers all 9 hand categories, kicker tiebreaks, the wheel straight, best-
// 5-of-7 selection, the reduced <5-card evaluator, and explicit ties -- the
// same cases a Postgres-backed test would cover, standing in for one since
// this repo's workflow has no local Postgres test harness.
//
// Run with: npm test   (node --experimental-strip-types --test)

import { test } from "node:test";
import assert from "node:assert/strict";

import { handRank, handCategoryLabel } from "./thePackHandEvaluator.ts";
import type { Card } from "./thePack.ts";

function cards(...values: string[]): Card[] {
  return values as Card[];
}

test("high card", () => {
  const score = handRank(cards("AS", "TD", "7H", "4C", "2S"));
  assert.equal(handCategoryLabel(score), "High Card");
});

test("pair beats high card", () => {
  const pair = handRank(cards("AS", "AD", "7H", "4C", "2S"));
  const high = handRank(cards("KS", "QD", "7H", "4C", "2S"));
  assert.ok(pair > high);
  assert.equal(handCategoryLabel(pair), "Pair");
});

test("pair kicker tiebreak", () => {
  const better = handRank(cards("7S", "7D", "AH", "4C", "2S"));
  const worse = handRank(cards("7C", "7H", "KD", "4S", "2D"));
  assert.ok(better > worse);
  assert.equal(handCategoryLabel(better), "Pair");
});

test("two pair beats pair regardless of kickers, higher pair wins ties", () => {
  const twoPair = handRank(cards("7S", "7D", "4H", "4C", "2S"));
  const onePair = handRank(cards("AS", "AD", "KH", "QC", "2S"));
  assert.ok(twoPair > onePair);
  assert.equal(handCategoryLabel(twoPair), "Two Pair");

  const higherTwoPair = handRank(cards("9S", "9D", "4H", "4C", "2S"));
  const lowerTwoPairWithAceKicker = handRank(cards("8S", "8D", "6H", "6C", "AS"));
  assert.ok(higherTwoPair > lowerTwoPairWithAceKicker);
});

test("three of a kind beats two pair", () => {
  const trips = handRank(cards("7S", "7D", "7H", "4C", "2S"));
  const twoPair = handRank(cards("9S", "9D", "4H", "4C", "AS"));
  assert.ok(trips > twoPair);
  assert.equal(handCategoryLabel(trips), "Three of a Kind");
});

test("straight beats three of a kind, wheel is the lowest straight", () => {
  const straight = handRank(cards("6S", "5D", "4H", "3C", "2S"));
  const trips = handRank(cards("AS", "AD", "AH", "KC", "QS"));
  assert.ok(straight > trips);
  assert.equal(handCategoryLabel(straight), "Straight");

  const wheel = handRank(cards("AS", "2D", "3H", "4C", "5S"));
  const sixHigh = handRank(cards("2S", "3D", "4H", "5C", "6S"));
  assert.ok(sixHigh > wheel);
  assert.equal(handCategoryLabel(wheel), "Straight");
});

test("flush beats straight", () => {
  const flush = handRank(cards("2S", "5S", "9S", "JS", "KS"));
  const straight = handRank(cards("6S", "5D", "4H", "3C", "2S"));
  assert.ok(flush > straight);
  assert.equal(handCategoryLabel(flush), "Flush");
});

test("full house beats flush", () => {
  const fullHouse = handRank(cards("7S", "7D", "7H", "4C", "4S"));
  const flush = handRank(cards("2S", "5S", "9S", "JS", "KS"));
  assert.ok(fullHouse > flush);
  assert.equal(handCategoryLabel(fullHouse), "Full House");
});

test("four of a kind beats full house", () => {
  const quads = handRank(cards("7S", "7D", "7H", "7C", "4S"));
  const fullHouse = handRank(cards("9S", "9D", "9H", "KC", "KS"));
  assert.ok(quads > fullHouse);
  assert.equal(handCategoryLabel(quads), "Four of a Kind");
});

test("straight flush beats four of a kind, and outranks the wheel straight flush", () => {
  const straightFlush = handRank(cards("6S", "5S", "4S", "3S", "2S"));
  const quads = handRank(cards("7S", "7D", "7H", "7C", "4S"));
  assert.ok(straightFlush > quads);
  assert.equal(handCategoryLabel(straightFlush), "Straight Flush");

  const wheelFlush = handRank(cards("AS", "2S", "3S", "4S", "5S"));
  assert.ok(straightFlush > wheelFlush);
  assert.equal(handCategoryLabel(wheelFlush), "Straight Flush");
});

test("best-5-of-7 picks the strongest subset", () => {
  // Three 7s plus four lone singles (4, 9, 2, K) across 7 cards -- the best
  // 5-card subset is trips with the two best kickers (K, 9), not a weaker
  // subset that happens to come first.
  const score = handRank(cards("7S", "7D", "4H", "9C", "2S", "7H", "KD"));
  assert.equal(handCategoryLabel(score), "Three of a Kind");
});

test("exact ties score equal regardless of suit", () => {
  const a = handRank(cards("7S", "7D", "AH", "4C", "2S"));
  const b = handRank(cards("7C", "7H", "AD", "4S", "2D"));
  assert.equal(a, b);
});

test("under-5-card reduced evaluator never attempts straight/flush/full-house checks", () => {
  const pair = handRank(cards("AS", "AD"));
  assert.equal(handCategoryLabel(pair), "Pair");

  const trips = handRank(cards("7S", "7D", "7H"));
  assert.equal(handCategoryLabel(trips), "Three of a Kind");

  const quads = handRank(cards("9S", "9D", "9H", "9C"));
  assert.equal(handCategoryLabel(quads), "Four of a Kind");

  const highCard = handRank(cards("AS", "KD", "4H"));
  assert.equal(handCategoryLabel(highCard), "High Card");
});

test("rejects fewer than 2 cards", () => {
  assert.throws(() => handRank(cards("AS")));
});
