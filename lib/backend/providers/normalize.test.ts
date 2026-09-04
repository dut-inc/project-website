// lib/backend/providers/normalize.test.ts
//
// Fixture-based tests for the dashboard backend's normalization layer.
// Fixtures are real payloads captured from the public feeds (Aug 2026) and
// checked into lib/backend/fixtures/ — so the backend stays testable
// without hammering the sports APIs, exactly as the backend prompt requires.
//
// Run with:  npm test   (node --experimental-strip-types --test)

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { espnGameNote, ordinal, parseEspnPeriodClock, streakFromOutcomes } from "../normalize.ts";
import { parseScheduleEvents, parseStandingsV2, parseSummary, type ParsedEspnGame } from "./espn.ts";
import {
  parseMlbLiveFeed,
  parseMlbSchedule,
  parseMlbStandings,
  parseMlbTeamLeaders,
  parseMlbTeamStats,
} from "./mlb.ts";
import { parsePwhlStandings, parseScorebar } from "./pwhl.ts";
import { buildMlrProvider } from "./mlr.ts";

function load(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8")) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

test("streakFromOutcomes counts consecutive trailing outcomes", () => {
  assert.deepEqual(streakFromOutcomes(["W", "L", "W", "W"]), { type: "W", count: 2 });
  assert.deepEqual(streakFromOutcomes(["W", "W", "W"]), { type: "W", count: 3 });
  assert.deepEqual(streakFromOutcomes(["W", "D", "L", "L"]), { type: "L", count: 2 });
  assert.deepEqual(streakFromOutcomes([]), { type: "W", count: 0 });
});

test("ordinal renders 1st-4th", () => {
  assert.equal(ordinal(1), "1st");
  assert.equal(ordinal(2), "2nd");
  assert.equal(ordinal(3), "3rd");
  assert.equal(ordinal(4), "4th");
});

test("parseEspnPeriodClock splits quarter/half/period detail into period + clock", () => {
  assert.deepEqual(parseEspnPeriodClock("Q3 4:32", "basketball"), { period: "3rd", clock: "4:32" });
  assert.deepEqual(parseEspnPeriodClock("2nd Half 12:45", "soccer"), { period: "2nd", clock: "12:45" });
  assert.deepEqual(parseEspnPeriodClock("3rd Period 15:21", "hockey"), { period: "3rd", clock: "15:21" });
  assert.deepEqual(parseEspnPeriodClock("Q1 10:00", "football"), { period: "1st", clock: "10:00" });
  assert.deepEqual(parseEspnPeriodClock("Half", "basketball"), { period: "Half", clock: undefined });
  assert.deepEqual(parseEspnPeriodClock("OT 1:23", "basketball"), { period: "OT", clock: "1:23" });
  // Unparseable input passes through — the UI must not assume a clock.
  assert.deepEqual(parseEspnPeriodClock("In Progress", "hockey"), { period: "In Progress", clock: undefined });
});

test("espnGameNote maps Final/OT/SO", () => {
  assert.equal(espnGameNote("Final"), "F");
  assert.equal(espnGameNote("Final/OT"), "OT");
  assert.equal(espnGameNote("Final/SO"), "SO");
  assert.equal(espnGameNote(undefined), "F");
});

// ---------------------------------------------------------------------------
// ESPN (WNBA / NHL)
// ---------------------------------------------------------------------------

test("espn schedule: Storm season splits completed / live / upcoming", () => {
  const schedule = load("espn-wnba-schedule.json");
  const { completed, live, upcoming } = parseScheduleEvents(schedule, 14);

  assert.ok(completed.length >= 30, `expected many completed games, got ${completed.length}`);
  assert.ok(upcoming.length >= 1, `expected upcoming games, got ${upcoming.length}`);
  assert.equal(live, null);

  const last = completed[completed.length - 1];
  assert.ok(last.date >= "2026-08-01", `last completed should be recent, got ${last.date}`);
  assert.ok(["home", "away"].includes(last.at));
  assert.ok(last.opponent.length > 0);
  assert.ok(last.teamScore !== undefined && last.opponentScore !== undefined);
  assert.ok(["W", "L", "D"].includes(last.outcome ?? ""));
});

test("espn schedule: Kraken off-season has no completed games (upcoming preseason only)", () => {
  const schedule = load("espn-nhl-schedule.json");
  const { completed, upcoming } = parseScheduleEvents(schedule, 124292);
  assert.equal(completed.length, 0);
  assert.ok(upcoming.length >= 1);
  // Off-season hockey in August: the next game is a preseason opener.
  assert.ok(upcoming[0].date >= "2026-09-01");
});

test("espn summary: WNBA box stats + leaders + per-quarter scoring", () => {
  const summary = load("espn-wnba-summary.json");
  // Storm were the away team in event 401857116 (SEA @ NYL, Aug 5 2026).
  const live: ParsedEspnGame = {
    eventId: "401857116",
    date: "2026-08-05",
    iso: "2026-08-05T23:00Z",
    opponent: "New York Liberty",
    at: "away",
    teamScore: 86,
    opponentScore: 92,
    state: "in",
    shortDetail: "Q3 4:32",
    ourAbbr: "SEA",
    oppAbbr: "NY",
    timeouts: {},
  };
  const result = parseSummary(summary, 14, "basketball", live);

  assert.ok(result.teamStats && result.teamStats.length >= 3, "expected team stat lines");
  const fg = result.teamStats.find((s) => s.label === "Field goal %");
  assert.ok(fg && typeof fg.value === "string" && fg.value.includes("–"), "field goal line should be ours – theirs");
  assert.ok(result.leaders && result.leaders.length > 0, "expected Storm player leaders");
  assert.ok(result.scoring && result.scoring.length >= 3, "expected per-quarter scoring lines");
  assert.match(result.scoring[0].score, /SEA \d+ – \d+ NY/);
});

test("espn standings v2: Storm row + conference table", () => {
  const standings = load("espn-wnba-standings.json");
  const parsed = parseStandingsV2(standings, 14, "wl", "2026");

  assert.ok(parsed.rows.length > 0, "expected a standings table");
  assert.ok(parsed.ours, "expected our team row");
  assert.ok(parsed.ours.wins >= 0 && parsed.ours.losses > 0);
  const row = parsed.rows.find((r) => r.team.includes("Storm"));
  assert.ok(row, "Storm should appear in the table");
  assert.equal(row.position, parsed.ours.position);
});

// ---------------------------------------------------------------------------
// MLB
// ---------------------------------------------------------------------------

test("mlb schedule: regular-season completed games, no spring training", () => {
  const schedule = load("mlb-schedule.json");
  const { completed, live, upcoming } = parseMlbSchedule(schedule, 136);

  assert.ok(completed.length > 100, `expected many completed games, got ${completed.length}`);
  assert.ok(upcoming.length >= 1);
  assert.equal(live, null);

  // All completed games must be regular season (gameType R) — spring
  // training games are excluded from the dashboard view.
  const last = completed[completed.length - 1];
  assert.equal(last.gameType, "R");
  assert.ok(last.date >= "2026-07-01");
  assert.ok(last.record, "completed games carry the current season record");
  assert.ok(last.record.wins + last.record.losses >= 100, "record reflects a played-out season");
});

test("mlb team stats: hitting + pitching lines", () => {
  const stats = load("mlb-teamstats.json");
  const parsed = parseMlbTeamStats(stats);
  assert.ok(parsed.offense && parsed.offense.length >= 3);
  assert.ok(parsed.defense && parsed.defense.length >= 2);
  const avg = parsed.offense.find((s) => s.label === "Batting average");
  assert.ok(avg && String(avg.value).startsWith("."));
});

test("mlb standings: Mariners division table", () => {
  const standings = load("mlb-standings.json");
  const { rows, position } = parseMlbStandings(standings, 136);
  assert.ok(rows.length >= 5, "expected a division table");
  assert.ok(position !== undefined && position >= 1);
  assert.ok(rows.some((r) => r.team.includes("Mariners")));
});

test("mlb team leaders parse", () => {
  const leaders = load("mlb-leaders.json");
  const parsed = parseMlbTeamLeaders(leaders);
  assert.ok(parsed.length >= 2);
  assert.ok(parsed.some((l) => l.label === "Home Runs" && l.value === "18" && l.player === "Dominic Canzone"));
});

test("mlb team leaders dedupe repeated categories", () => {
  const parsed = parseMlbTeamLeaders({
    teamLeaders: [
      { leaderCategory: "stolenBases", leaders: [{ person: { fullName: "Cal Raleigh" }, value: 5 }] },
      { leaderCategory: "stolenBases", leaders: [{ person: { fullName: "Cal Raleigh" }, value: 5 }] },
      { leaderCategory: "homeRuns", leaders: [{ person: { fullName: "Cal Raleigh" }, value: 24 }] },
    ],
  });
  assert.equal(parsed.length, 2);
  assert.equal(parsed.filter((l) => l.label === "Stolen Bases").length, 1);
});

test("mlb live feed: inning/outs/balls/strikes + box stats + scoring", () => {
  const feed = {
    liveData: {
      linescore: {
        currentInning: 7,
        isTopInning: true,
        outs: 2,
        balls: 1,
        strikes: 2,
        runnersOnBase: [{ base: "1B" }, { base: "2B" }],
        teams: { home: { runs: 3 }, away: { runs: 4 } },
        innings: [
          { num: 1, home: { runs: 0 }, away: { runs: 1 } },
          { num: 2, home: { runs: 0 }, away: { runs: 0 } },
          { num: 3, home: { runs: 1 }, away: { runs: 2 } },
          { num: 4, home: { runs: 0 }, away: { runs: 0 } },
          { num: 5, home: { runs: 2 }, away: { runs: 1 } },
        ],
        // Top of the 7th → away (Astros) batting: away batter + home pitcher.
        offense: {
          batter: { id: 1, fullName: "Jose Altuve" },
          // Red herring: offense.pitcher is the BATTING team's pitcher (e.g.
          // the previous half-inning) — the parser must ignore it and take
          // the current pitcher from defense.pitcher.
          pitcher: { id: 999, fullName: "Tyler Wells" },
        },
        defense: {
          pitcher: { id: 2, fullName: "Logan Gilbert" },
        },
      },
      boxscore: {
        teams: {
          home: {
            teamStats: { batting: { hits: 6, homeRuns: 1, leftOnBase: 4 }, fielding: { errors: 0 } },
            players: {
              ID2: { person: { id: 2, fullName: "Logan Gilbert" }, stats: { pitching: { numberOfPitches: 84 } } },
            },
          },
          away: {
            teamStats: { batting: { hits: 9, homeRuns: 2, leftOnBase: 6 }, fielding: { errors: 2 } },
            players: {
              ID1: { person: { id: 1, fullName: "Jose Altuve" }, stats: { batting: { atBats: 4, hits: 2 } } },
            },
          },
        },
      },
    },
  };
  const game = {
    gamePk: 1,
    date: "2026-08-08",
    iso: "2026-08-08T20:10:00Z",
    opponent: "Houston Astros",
    at: "home" as const,
    teamScore: 3,
    opponentScore: 4,
    state: "in" as const,
    gameType: "R",
  };
  const { currentGame, gameStats } = parseMlbLiveFeed(feed, game);

  assert.equal(currentGame.period, "Top 7th");
  assert.equal(currentGame.sportSpecific?.Balls, 1);
  assert.equal(currentGame.sportSpecific?.Strikes, 2);
  assert.equal(currentGame.sportSpecific?.Outs, 2);
  // Outs are dropped from the status line (the B-S-O circles show them);
  // runner detail stays, and the batting side + batter/pitcher arrive.
  assert.equal(currentGame.detail, "runners on 1st & 2nd");
  assert.equal(currentGame.sportSpecific?.Batting, "away");
  assert.equal(currentGame.sportSpecific?.Batter, "Jose Altuve");
  assert.equal(currentGame.sportSpecific?.["Batter H"], 2);
  assert.equal(currentGame.sportSpecific?.["Batter AB"], 4);
  assert.equal(currentGame.sportSpecific?.Pitcher, "Logan Gilbert");
  assert.equal(currentGame.sportSpecific?.Pitches, 84);
  assert.equal(currentGame.teamScore, 3);
  assert.equal(currentGame.opponentScore, 4);
  assert.ok(gameStats?.teamStats && gameStats.teamStats.some((s) => s.label === "Hits" && s.value === "6 – 9"));
  assert.ok(gameStats?.scoring && gameStats.scoring.length >= 1);
  assert.equal(gameStats.scoring[0].side, "opponent"); // T1 away runs — not ours
  assert.equal(gameStats.scoring[0].period, "T1");
  const oursScoring = gameStats.scoring.find((s) => s.period === "B3");
  assert.equal(oursScoring?.side, "seattle");
});

// ---------------------------------------------------------------------------
// PWHL
// ---------------------------------------------------------------------------

test("pwhl scorebar: Seattle games classify into completed / upcoming", () => {
  const scorebar = load("pwhl-scorebar.json");
  const { completed, live, upcoming } = parseScorebar(scorebar, "Seattle");

  assert.ok(completed.length >= 20, `expected many Seattle finals, got ${completed.length}`);
  assert.equal(live, null);
  // Captured in August 2026, before the 2026-27 schedule was released —
  // zero upcoming games is the honest data state, not a parse bug.
  assert.equal(upcoming.length, 0);
  const last = completed[completed.length - 1];
  assert.ok(last.date >= "2026-04-01");
  assert.ok(["F", "OT"].includes(last.note ?? ""), `note should be F or OT, got ${last.note}`);
  assert.ok(["home", "away"].includes(last.at));
});

test("pwhl standings: Torrent record from the last completed season", () => {
  const standings = load("pwhl-standings.json");
  const { rows, ours } = parsePwhlStandings(standings, "Seattle");

  assert.ok(rows.length >= 6, "expected a standings table");
  assert.ok(ours, "expected Seattle row");
  assert.ok(ours.wins > 5 && ours.losses > 0);
  assert.equal(ours.wins + ours.losses + ours.otLosses, 27); // real 2025-26: 9-16-2
  assert.ok(rows.some((r) => r.team.includes("Torrent")));
});

// ---------------------------------------------------------------------------
// MLR — graceful error state
// ---------------------------------------------------------------------------

test("mlr provider returns a graceful error state (no public feed)", async () => {
  const result = await buildMlrProvider().fetch();
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.error.includes("MLR"));
  }
});
