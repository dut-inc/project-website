// Setup tools: reach from 5.2, the owner's setup facts, corner starts, standard
// setup order and the Advanced Setup draft (A.8).
//
// Run with: npm test   (node --experimental-strip-types --test)

import { test } from "node:test";
import assert from "node:assert/strict";

import { factionSetups, reachTable, setupRules } from "./setup.ts";
import {
  SECOND_VAGABOND,
  bySetupLetter,
  canChoose,
  cardCounts,
  chooserOrder,
  cornerStarters,
  deal,
  draftProblems,
  entry,
  reachCheck,
  type DraftOptions,
} from "./setupPlan.ts";

const FACTIONS = factionSetups();
const BY_ID = Object.fromEntries(FACTIONS.map((f) => [f.id, f]));
const TABLE = reachTable();
const entries = (...keys: string[]) => keys.map(entry);

// A repeatable random sequence.
function seeded(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) % 2 ** 31;
    return seed / 2 ** 31;
  };
}

test("reach values and totals come from the Law's table (5.2)", () => {
  assert.deepEqual(TABLE.thresholds, { 2: 17, 3: 18, 4: 21, 5: 25, 6: 28 });
  assert.equal(TABLE.adventurous, 17);
  assert.equal(TABLE.values["marquise-de-cat"], 10);
  assert.equal(TABLE.values["lizard-cult"], 2);
  assert.equal(TABLE.values.vagabond, 5);
  assert.equal(TABLE.secondVagabond, 2);
  assert.equal(Object.keys(TABLE.values).length, 13);
});

test("every faction has a setup card type and a letter in lawbook order", () => {
  assert.equal(FACTIONS.length, 13);
  assert.equal(FACTIONS.map((f) => f.letter).join(""), "ABCDEFGHIJKLM");
  assert.equal(BY_ID["marquise-de-cat"].letter, "A");
  assert.equal(BY_ID["knaves-of-the-deepwood"].letter, "M");
  const militant = FACTIONS.filter((f) => f.card === "militant").map((f) => f.short);
  assert.deepEqual(militant, ["Marquise", "Eyrie", "Duchy", "Hundreds", "Keepers", "Lilypad"]);
  // The owner's rule of thumb: militant factions have high reach, insurgents low.
  const minMilitant = Math.min(...FACTIONS.filter((f) => f.card === "militant").map((f) => f.reach));
  const maxInsurgent = Math.max(...FACTIONS.filter((f) => f.card === "insurgent").map((f) => f.reach));
  assert.ok(minMilitant > maxInsurgent);
});

test("corner starts are read from each faction's setup text", () => {
  assert.deepEqual(
    FACTIONS.filter((f) => f.corner).map((f) => f.short),
    ["Marquise", "Eyrie", "Lizards", "Duchy", "Hundreds", "Keepers", "Council"],
  );
  assert.equal(BY_ID.vagabond.setupSection.number, "9.3");
  assert.deepEqual(
    setupRules("marquise-de-cat").map((r) => r.rule_number),
    ["6.3.1", "6.3.2", "6.3.3", "6.3.4", "6.3.5"],
  );
});

test("reach check, counts and setup order", () => {
  const four = entries("woodland-alliance", "marquise-de-cat", "vagabond", "eyrie-dynasties");
  assert.deepEqual(reachCheck(four, BY_ID, TABLE), { players: 4, total: 25, needed: 21, meets: true, adventurous: true });
  assert.deepEqual(cardCounts(four, BY_ID), { militant: 2, insurgent: 2 });
  assert.deepEqual(
    bySetupLetter(four, BY_ID).map((e) => e.key),
    ["marquise-de-cat", "eyrie-dynasties", "woodland-alliance", "vagabond"],
  );

  const low = entries("lizard-cult", "corvid-conspiracy", "woodland-alliance", "vagabond", SECOND_VAGABOND);
  const result = reachCheck(low, BY_ID, TABLE);
  assert.equal(result.total, 2 + 3 + 3 + 5 + 2);
  assert.equal(result.meets, false);
  assert.deepEqual(
    bySetupLetter(low, BY_ID).map((e) => e.key),
    ["woodland-alliance", "vagabond", SECOND_VAGABOND, "lizard-cult", "corvid-conspiracy"],
  );
  assert.equal(reachCheck(entries("marquise-de-cat"), BY_ID, TABLE).needed, null);

  const corners = entries("marquise-de-cat", "eyrie-dynasties", "lizard-cult", "underground-duchy", "keepers-in-iron");
  assert.equal(cornerStarters(corners, BY_ID).length, 5);
});

const options = (overrides: Partial<DraftOptions> = {}): DraftOptions => ({
  players: 4,
  include: FACTIONS.map((f) => f.id).filter((id) => id !== "knaves-of-the-deepwood"),
  vagabondCards: 1,
  keepInsurgents: false,
  ...overrides,
});

test("draft problems cite the Law", () => {
  assert.deepEqual(draftProblems(options(), BY_ID), []);
  const both = draftProblems(options({ include: ["marquise-de-cat", "vagabond", "knaves-of-the-deepwood", "lizard-cult", "corvid-conspiracy"] }), BY_ID);
  assert.deepEqual(both.map((p) => p.rule), ["A.8.1"]);
  assert.deepEqual(draftProblems(options({ include: ["lizard-cult", "corvid-conspiracy", "vagabond", "woodland-alliance", "riverfolk-company"] }), BY_ID).map((p) => p.rule), ["A.8.2"]);
  // Two players: insurgents are removed, so two militant factions aren't enough for three cards.
  assert.match(draftProblems(options({ players: 2, include: ["marquise-de-cat", "eyrie-dynasties", "vagabond"] }), BY_ID)[0].text, /Not enough setup cards/);
  assert.deepEqual(draftProblems(options({ players: 2, keepInsurgents: true, include: ["marquise-de-cat", "eyrie-dynasties", "vagabond"] }), BY_ID), []);
});

test("the deal follows A.8.2", () => {
  for (let seed = 1; seed <= 200; seed++) {
    const pool = deal(options({ vagabondCards: 2 }), BY_ID, seeded(seed));
    assert.equal(pool.length, 5, "one more card than players");
    assert.equal(pool[0].card, "militant", "the first card dealt is militant");
    assert.equal(new Set(pool.map((c) => c.key)).size, 5, "no card twice");
    const last = pool[pool.length - 1];
    assert.equal(last.locked, last.card === "insurgent", "only a last insurgent is locked");
    assert.ok(pool.slice(0, -1).every((c) => !c.locked));
    assert.ok(pool.every((c) => c.factionId !== "knaves-of-the-deepwood"));
  }
  for (let seed = 1; seed <= 50; seed++) {
    const two = deal(options({ players: 2 }), BY_ID, seeded(seed));
    assert.equal(two.length, 3);
    assert.ok(two.every((c) => c.card === "militant"), "two players: no insurgents");
  }
  const seen = new Set<string>();
  for (let seed = 1; seed <= 300; seed++) for (const c of deal(options({ vagabondCards: 2 }), BY_ID, seeded(seed))) seen.add(c.key);
  assert.ok(seen.has(SECOND_VAGABOND), "the second Vagabond card can be dealt");
  assert.throws(() => deal(options({ include: ["lizard-cult"] }), BY_ID));
});

test("choosing: last player first, and the lock (A.8.2.II, A.8.3)", () => {
  assert.deepEqual(chooserOrder(4), [4, 3, 2, 1]);
  const militant = { ...entry("marquise-de-cat"), card: "militant" as const, locked: false };
  const insurgent = { ...entry("lizard-cult"), card: "insurgent" as const, locked: false };
  const locked = { ...entry("corvid-conspiracy"), card: "insurgent" as const, locked: true };
  assert.equal(canChoose(locked, []), false);
  assert.equal(canChoose(locked, [insurgent]), false);
  assert.equal(canChoose(locked, [militant]), true);
  assert.equal(canChoose(militant, [militant]), false, "already chosen");
  assert.equal(canChoose(insurgent, []), true);
});
