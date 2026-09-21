import assert from "node:assert/strict";
import { test } from "node:test";

import {
  PARTICIPANTS,
  hydratePicks,
  isSeasonLocked,
  parsePicks,
  slotPoints,
  scoreConference,
  totalPoints,
  MAX_TOTAL_POINTS,
} from "./nbaStandingsPicks.ts";
import { NBA_TEAMS, teamFromEspnAbbr, chalkOrder } from "./nbaTeams.ts";


test("roster shape: 30 teams, 15 per conference", () => {
  assert.equal(NBA_TEAMS.length, 30);
  assert.equal(NBA_TEAMS.filter((t) => t.conference === "West").length, 15);
  assert.equal(NBA_TEAMS.filter((t) => t.conference === "East").length, 15);
  const ids = new Set(NBA_TEAMS.map((t) => t.id));
  assert.equal(ids.size, 30);
});

test("ESPN abbreviation fixups resolve to canonical ids", () => {
  assert.equal(teamFromEspnAbbr("NY")?.id, "NYK");
  assert.equal(teamFromEspnAbbr("GS")?.id, "GSW");
  assert.equal(teamFromEspnAbbr("SA")?.id, "SAS");
  assert.equal(teamFromEspnAbbr("NO")?.id, "NOP");
  assert.equal(teamFromEspnAbbr("UTAH")?.id, "UTA");
  assert.equal(teamFromEspnAbbr("WSH")?.id, "WAS");
  assert.equal(teamFromEspnAbbr("BOS")?.id, "BOS");
  assert.equal(teamFromEspnAbbr(undefined), undefined);
  assert.equal(teamFromEspnAbbr("XX"), undefined);
});

test("slotPoints rubric: 2 exact, 1 within one, 0 otherwise", () => {
  assert.equal(slotPoints(0), 2);
  assert.equal(slotPoints(1), 1);
  assert.equal(slotPoints(-1), 1);
  assert.equal(slotPoints(2), 0);
  assert.equal(slotPoints(14), 0);
});

test("scoreConference sums exact and near misses", () => {
  const live = ["A", "B", "C", "D"];
  // A exact (2), C one off (1), B one off (1), D exact (2)
  const guess = ["A", "C", "B", "D"];
  const score = scoreConference(guess, live, "West");
  assert.equal(score.points, 6);
  assert.equal(score.max, 8);
  // Flipping the ends costs the two moved teams everything.
  const far = scoreConference(["D", "B", "C", "A"], live, "West");
  assert.equal(far.points, 4); // B and C still exact, D and A score zero
});

test("totalPoints across both conferences", () => {
  const live = { West: ["A", "B"], East: ["C", "D"] };
  // Full swap in one conference = 4 pts, chalk in the other = 4 pts.
  assert.equal(totalPoints({ West: ["A", "B"], East: ["D", "C"] }, live), 6);
  assert.equal(totalPoints({ West: ["B", "A"], East: ["C", "D"] }, live), 6);
  assert.equal(totalPoints({ West: ["B", "A"], East: ["D", "C"] }, live), 4);
  assert.equal(totalPoints({ West: ["A", "B"], East: ["C", "D"] }, live), 8);
});

test("parsePicks rejects wrong shapes and accepts valid ones", () => {
  const valid = { West: chalkOrder("West"), East: chalkOrder("East") };
  assert.deepEqual(parsePicks(valid), valid);
  assert.equal(parsePicks(null), null);
  assert.equal(parsePicks({}), null);
  assert.equal(parsePicks({ West: [], East: [] }), null);
  // Cross-conference team rejected
  const badConf = {
    West: [...chalkOrder("West").slice(0, 14), "BOS"],
    East: [...chalkOrder("East").slice(1), "OKC"],
  };
  assert.equal(parsePicks(badConf), null);
  // Duplicate team rejected
  const dupe = {
    West: [...chalkOrder("West").slice(0, 14), chalkOrder("West")[0]],
    East: chalkOrder("East"),
  };
  assert.equal(parsePicks(dupe), null);
});

test("hydratePicks falls back to chalk on garbage", () => {
  const chalk = hydratePicks("garbage");
  assert.deepEqual(chalk, { West: chalkOrder("West"), East: chalkOrder("East") });
  assert.equal(hydratePicks(null).West.length, 15);
});

test("season lock: before, during, and after tip-off", () => {
  assert.equal(isSeasonLocked(new Date("2026-10-19T23:59:59-04:00")), false);
  assert.equal(isSeasonLocked(new Date("2026-10-20T00:00:00-04:00")), true);
  assert.equal(isSeasonLocked(new Date("2027-02-01T00:00:00Z")), true);
  assert.equal(isSeasonLocked(new Date("2026-09-01T00:00:00Z")), false);
});

test("participants list matches the pool roster", () => {
  assert.equal(PARTICIPANTS.length, 7);
  assert.ok(PARTICIPANTS.includes("Owen") && PARTICIPANTS.includes("Alejandro"));
  assert.equal(MAX_TOTAL_POINTS, 60);
});
