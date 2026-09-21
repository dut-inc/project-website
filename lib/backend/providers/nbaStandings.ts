// lib/backend/providers/nbaStandings.ts
//
// NBA standings fetcher for the prediction pool. ESPN's keyless v2 standings
// endpoint returns both conferences in one call:
//
//   GET https://site.web.api.espn.com/apis/v2/sports/basketball/nba/standings
//       ?region=us&lang=en&contentorigin=espn&season={year}
//
// For fall-start leagues the `season` param is the year the season ENDS
// (season=2027 -> 2026-27). Abbreviations are normalized to our canonical
// ids via lib/sports/nbaTeams.ts before they reach the client.

import { dashboardCache } from "../cache.ts";
import { fetchJson } from "../http.ts";
import { teamFromEspnAbbr } from "@/lib/sports/nbaTeams";
import type { PredictionPicks } from "@/lib/sports/nbaStandingsPicks";

export interface NbaStandingRow {
  teamId: string;
  wins: number;
  losses: number;
  winPct: number;
  streak: string;
}

export interface NbaStandingsSnapshot {
  seasonLabel: string;
  /** True when the table is all 0-0 (preseason for the upcoming year). */
  isPreseason: boolean;
  fetchedAt: string;
  West: NbaStandingRow[];
  East: NbaStandingRow[];
}

interface EspnStandingsEntry {
  team?: { abbreviation?: string; displayName?: string };
  stats?: Array<{ name?: string; displayValue?: string }>;
}

interface EspnStandingsResponse {
  children?: Array<{
    name?: string;
    standings?: { entries?: EspnStandingsEntry[] };
  }>;
}

function statOf(entry: EspnStandingsEntry, name: string): string | undefined {
  const found = (entry.stats ?? []).find((s) => s.name === name);
  return found?.displayValue;
}

function num(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Which ESPN season year should we request? The label follows the season that
 * starts in October: from 2026-07-01 through 2027-06-30 that is 2026-27,
 * i.e. ESPN season=2027. Reusable across future seasons automatically.
 */
export function currentEspnSeasonYear(now: Date = new Date()): number {
  const startYear = now.getUTCFullYear();
  // NBA seasons run Oct -> Jun; before July, the "current" season started
  // the previous calendar year.
  const seasonStartYear = now.getUTCMonth() >= 6 ? startYear : startYear - 1;
  return seasonStartYear + 1;
}

export function seasonLabelFor(espSeasonYear: number): string {
  return `${espSeasonYear - 1}-${String(espSeasonYear).slice(2)}`;
}

function parseRows(entries: EspnStandingsEntry[] | undefined): NbaStandingRow[] {
  const rows: NbaStandingRow[] = [];
  for (const entry of entries ?? []) {
    const team = teamFromEspnAbbr(entry.team?.abbreviation);
    if (!team) continue; // unknownabbr — skip rather than break the board
    rows.push({
      teamId: team.id,
      wins: num(statOf(entry, "wins")),
      losses: num(statOf(entry, "losses")),
      winPct: num(statOf(entry, "winPercent")) || 0,
      streak: statOf(entry, "streak") ?? "",
    });
  }
  return rows;
}

async function fetchStandings(seasonYear: number): Promise<NbaStandingsSnapshot> {
  const json = await fetchJson<EspnStandingsResponse>(
    `https://site.web.api.espn.com/apis/v2/sports/basketball/nba/standings` +
      `?region=us&lang=en&contentorigin=espn&season=${seasonYear}`,
  );

  const westChild = (json.children ?? []).find((c) => /Western/i.test(c.name ?? ""));
  const eastChild = (json.children ?? []).find((c) => /Eastern/i.test(c.name ?? ""));
  const west = parseRows(westChild?.standings?.entries);
  const east = parseRows(eastChild?.standings?.entries);

  const allRows = [...west, ...east];
  const isPreseason = allRows.length > 0 && allRows.every((r) => r.wins === 0 && r.losses === 0);

  return {
    seasonLabel: seasonLabelFor(seasonYear),
    isPreseason,
    fetchedAt: new Date().toISOString(),
    West: west,
    East: east,
  };
}

const CACHE_TTL_MS = 10 * 60 * 1000; // standings move slowly; 10 min is plenty

/** Cached standings snapshot shared by every visitor of the pool page. */
export async function getNbaStandings(): Promise<NbaStandingsSnapshot> {
  return dashboardCache.getOrCompute("nba-standings", () => fetchStandings(currentEspnSeasonYear()), () => CACHE_TTL_MS);
}

/** Live standings as plain ordered id lists — the scoring input shape. */
export async function getLivePicks(): Promise<PredictionPicks | null> {
  const snapshot = await getNbaStandings();
  if (snapshot.West.length !== 15 || snapshot.East.length !== 15) return null;
  return {
    West: snapshot.West.map((r) => r.teamId),
    East: snapshot.East.map((r) => r.teamId),
  };
}
