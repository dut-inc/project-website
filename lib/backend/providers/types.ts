// lib/backend/providers/types.ts
//
// The provider contract. Every league implements `TeamProvider.fetch()` and
// returns normalized sport data only — the service layer merges it onto the
// static team metadata. A provider that cannot reach its feed returns
// `{ ok: false, error }`; the service turns that into a graceful per-team
// error state instead of failing the whole dashboard (one league's API
// outage must never take the other eight teams down with it).

import type {
  GameStats,
  GameSummary,
  LeagueId,
  LiveGame,
  SeasonStats,
  ScheduledGame,
  Streak,
  TeamRecord,
} from "../../sports/types.ts";

/** Everything a provider can contribute about its team. All optional. */
export interface ProviderData {
  record?: TeamRecord;
  streak?: Streak;
  previousGame?: GameSummary;
  currentGame?: LiveGame;
  nextGames?: ScheduledGame[];
  seasonStats?: SeasonStats;
  gameStats?: GameStats;
}

export type ProviderResult = { ok: true; data: ProviderData } | { ok: false; error: string };

export interface TeamProvider {
  readonly league: LeagueId;
  fetch(): Promise<ProviderResult>;
}
