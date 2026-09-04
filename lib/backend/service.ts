// lib/backend/service.ts
//
// The dashboard backend service. This is what GET /api/teams serves:
//
//   - Builds one `TeamProvider` per league and runs them all in parallel.
//   - A failing provider (API down, feed discontinued, rate limited) turns
//     into a per-team error state — it never takes the other eight teams
//     down with it.
//   - Each provider's normalized sport data is merged onto the static team
//     metadata (name, colors, championships) to produce the exact `Team`
//     shape the frontend already renders.
//
// The only data contract in play is lib/sports/types.ts — the same one the
// mock data and the frontend components use.

import type { Team } from "../sports/types.ts";
import { dashboardCache, dashboardTtlMs } from "./cache.ts";
import { TEAM_METADATA } from "./metadata.ts";
import { buildEspnProvider, type EspnLeagueConfig } from "./providers/espn.ts";
import { buildMlbProvider } from "./providers/mlb.ts";
import { buildMlrProvider } from "./providers/mlr.ts";
import { buildPwhlProvider } from "./providers/pwhl.ts";
import type { ProviderData, TeamProvider } from "./providers/types.ts";

export interface ProviderStatus {
  ok: boolean;
  error?: string;
}

export interface DashboardPayload {
  teams: Team[];
  metadata: {
    asOf: string;
    source: "live";
    note?: string;
    /** Per-league provider health, useful for debugging the dashboard. */
    providerStatus: Record<string, ProviderStatus>;
  };
}

const ESPN_CONFIGS: Array<EspnLeagueConfig & { teamId: number }> = [
  { leagueId: "nfl", sport: "football", league: "nfl", teamId: 26, recordFormat: "wl" },
  { leagueId: "nhl", sport: "hockey", league: "nhl", teamId: 124292, recordFormat: "wlot", fallStart: true },
  { leagueId: "wnba", sport: "basketball", league: "wnba", teamId: 14, recordFormat: "wl" },
  { leagueId: "mls", sport: "soccer", league: "usa.1", teamId: 9726, recordFormat: "wld" },
  { leagueId: "nwsl", sport: "soccer", league: "usa.nwsl", teamId: 15363, recordFormat: "wld" },
];

function providerForLeague(league: (typeof TEAM_METADATA)[number]["league"]): TeamProvider | null {
  switch (league) {
    case "mlb":
      return buildMlbProvider(TEAM_METADATA.find((m) => m.league === "mlb")?.mlbId ?? 136);
    case "nfl":
    case "nhl":
    case "wnba":
    case "mls":
    case "nwsl": {
      const cfg = ESPN_CONFIGS.find((c) => c.leagueId === league);
      return cfg ? buildEspnProvider(cfg) : null;
    }
    case "pwhl":
      return buildPwhlProvider("Seattle");
    case "mlr":
      return buildMlrProvider();
    case "nba":
      return null; // SuperSonics placeholder — no provider, ever
  }
}

function emptyTeam(meta: (typeof TEAM_METADATA)[number]): Team {
  return {
    id: meta.id,
    league: meta.league,
    name: meta.name,
    shortName: meta.shortName,
    status: meta.status,
    note: meta.note,
    record: { wins: 0, losses: 0, label: meta.recordLabel },
    streak: { type: "W", count: 0 },
    championships: meta.championships,
    colors: meta.colors,
    nextGames: [],
  };
}

function mergeData(team: Team, data: ProviderData): Team {
  return {
    ...team,
    record: { ...team.record, ...data.record },
    streak: data.streak ?? team.streak,
    previousGame: data.previousGame,
    currentGame: data.currentGame,
    nextGames: data.nextGames ?? [],
    seasonStats: data.seasonStats,
    gameStats: data.gameStats,
  };
}

async function buildDashboard(): Promise<DashboardPayload> {
  const metas = TEAM_METADATA;
  const statuses: Record<string, ProviderStatus> = {};
  const teams: Team[] = await Promise.all(
    metas.map(async (meta) => {
      const base = emptyTeam(meta);
      const provider = providerForLeague(meta.league);
      if (!provider) {
        statuses[meta.id] = { ok: true };
        return base;
      }
      const result = await provider.fetch();
      if (result.ok) {
        statuses[meta.id] = { ok: true };
        return mergeData(base, result.data);
      }
      statuses[meta.id] = { ok: false, error: result.error };
      return { ...base, error: result.error };
    }),
  );

  return {
    teams,
    metadata: {
      asOf: new Date().toISOString(),
      source: "live",
      note: "Live data from official/public league feeds. Refreshed server-side; the frontend only ever talks to /api/teams.",
      providerStatus: statuses,
    },
  };
}

/** Cached dashboard payload — shared across all users of this server process. */
export async function getDashboard(): Promise<DashboardPayload> {
  return dashboardCache.getOrCompute("dashboard", buildDashboard, (payload) =>
    dashboardTtlMs(payload.teams.some((t) => t.currentGame !== undefined)),
  );
}

export async function getTeam(id: string): Promise<Team | undefined> {
  const { teams } = await getDashboard();
  return teams.find((t) => t.id === id);
}
