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

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { dashboardCache } from "../cache.ts";
import { fetchJson } from "../http.ts";
import { teamFromEspnAbbr } from "../../sports/nbaTeams.ts";
import type { PredictionPicks } from "../../sports/nbaStandingsPicks.ts";

export interface NbaStandingRow {
  teamId: string;
  wins: number;
  losses: number;
  winPct: number;
  streak: string;
}

export const NBA_STANDINGS_FREEZE_SEASON = "2026-27";
export const NBA_STANDINGS_FREEZE_AT = "2027-04-13T09:00:00-07:00";
export const NBA_STANDINGS_FREEZE_RECOVERY_WINDOW_MS = 60 * 60 * 1000;

export function shouldFreezeNbaStandings(seasonLabel: string, now: Date = new Date()): boolean {
  return seasonLabel === NBA_STANDINGS_FREEZE_SEASON && now.getTime() >= Date.parse(NBA_STANDINGS_FREEZE_AT);
}

export function canRecoverMissedNbaStandingsFreeze(now: Date = new Date()): boolean {
  const elapsed = now.getTime() - Date.parse(NBA_STANDINGS_FREEZE_AT);
  return elapsed >= 0 && elapsed <= NBA_STANDINGS_FREEZE_RECOVERY_WINDOW_MS;
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

export function parseNbaStandingsRows(entries: EspnStandingsEntry[] | undefined): NbaStandingRow[] {
  const rows = (entries ?? []).flatMap((entry, index) => {
    const team = teamFromEspnAbbr(entry.team?.abbreviation);
    if (!team) return []; // unknownabbr — skip rather than break the board
    const seed = Number(statOf(entry, "playoffSeed"));
    return [{
      row: {
        teamId: team.id,
        wins: num(statOf(entry, "wins")),
        losses: num(statOf(entry, "losses")),
        winPct: num(statOf(entry, "winPercent")),
        streak: statOf(entry, "streak") ?? "",
      },
      seed: Number.isFinite(seed) ? seed : Number.POSITIVE_INFINITY,
      index,
    }];
  });

  // ESPN's playoffSeed is its authoritative seed, including the play-in ranks.
  // Preserve source order only when ESPN gives teams the same/missing seed.
  return rows
    .sort((a, b) => {
      const aSeeded = Number.isFinite(a.seed);
      const bSeeded = Number.isFinite(b.seed);
      if (aSeeded && bSeeded) return a.seed - b.seed || a.index - b.index;
      if (aSeeded !== bSeeded) return aSeeded ? -1 : 1;
      return a.index - b.index;
    })
    .map(({ row }) => row);
}

async function fetchStandings(seasonYear: number): Promise<NbaStandingsSnapshot> {
  const json = await fetchJson<EspnStandingsResponse>(
    `https://site.web.api.espn.com/apis/v2/sports/basketball/nba/standings` +
      `?region=us&lang=en&contentorigin=espn&season=${seasonYear}`,
  );

  const westChild = (json.children ?? []).find((c) => /Western/i.test(c.name ?? ""));
  const eastChild = (json.children ?? []).find((c) => /Eastern/i.test(c.name ?? ""));
  const west = parseNbaStandingsRows(westChild?.standings?.entries);
  const east = parseNbaStandingsRows(eastChild?.standings?.entries);

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

function snapshotStoreClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("NBA standings freeze requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }
  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function isSnapshot(value: unknown, seasonLabel: string): value is NbaStandingsSnapshot {
  if (typeof value !== "object" || value === null) return false;
  const snapshot = value as Partial<NbaStandingsSnapshot>;
  const validRows = (rows: unknown): rows is NbaStandingRow[] =>
    Array.isArray(rows) && rows.length === 15 && rows.every((row) =>
      typeof row === "object" && row !== null &&
      typeof (row as NbaStandingRow).teamId === "string" &&
      typeof (row as NbaStandingRow).wins === "number" &&
      typeof (row as NbaStandingRow).losses === "number" &&
      typeof (row as NbaStandingRow).winPct === "number" &&
      typeof (row as NbaStandingRow).streak === "string",
    );
  return snapshot.seasonLabel === seasonLabel && typeof snapshot.fetchedAt === "string" &&
    typeof snapshot.isPreseason === "boolean" && validRows(snapshot.West) && validRows(snapshot.East);
}

async function loadFrozenStandings(seasonLabel: string): Promise<NbaStandingsSnapshot | null> {
  const { data, error } = await snapshotStoreClient()
    .from("nba_standings_snapshots")
    .select("snapshot")
    .eq("season_key", seasonLabel)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (!isSnapshot(data.snapshot, seasonLabel)) {
    throw new Error(`Stored NBA standings snapshot for ${seasonLabel} is invalid`);
  }
  return data.snapshot;
}

async function persistFrozenStandings(snapshot: NbaStandingsSnapshot): Promise<NbaStandingsSnapshot> {
  const client = snapshotStoreClient();
  const { error } = await client.from("nba_standings_snapshots").upsert(
    { season_key: snapshot.seasonLabel, snapshot, frozen_at: new Date().toISOString() },
    { onConflict: "season_key", ignoreDuplicates: true },
  );
  if (error) throw error;

  const stored = await loadFrozenStandings(snapshot.seasonLabel);
  if (!stored) throw new Error(`Could not persist NBA standings snapshot for ${snapshot.seasonLabel}`);
  return stored;
}

/** Capture ESPN's standings once at/after the deadline and persist immutably. */
export async function freezeNbaStandings(now: Date = new Date()): Promise<NbaStandingsSnapshot> {
  const seasonYear = currentEspnSeasonYear(now);
  const seasonLabel = seasonLabelFor(seasonYear);
  if (!shouldFreezeNbaStandings(seasonLabel, now)) {
    throw new Error(`NBA standings are not due to freeze for ${seasonLabel}`);
  }

  const existing = await loadFrozenStandings(seasonLabel);
  if (existing) return existing;
  if (!canRecoverMissedNbaStandingsFreeze(now)) {
    throw new Error("The 2026-27 NBA standings freeze snapshot is missing and its recovery window has passed");
  }
  return persistFrozenStandings(await fetchStandings(seasonYear));
}

/** Cached live standings until the configured season freeze; frozen data is durable in Supabase. */
export async function getNbaStandings(now: Date = new Date()): Promise<NbaStandingsSnapshot> {
  const seasonYear = currentEspnSeasonYear(now);
  const seasonLabel = seasonLabelFor(seasonYear);
  if (shouldFreezeNbaStandings(seasonLabel, now)) {
    // If the scheduled invocation was missed, recovery is limited to the first
    // hour so later play-in results cannot contaminate the regular-season snapshot.
    return freezeNbaStandings(now);
  }
  return dashboardCache.getOrCompute("nba-standings", () => fetchStandings(seasonYear), () => CACHE_TTL_MS);
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
