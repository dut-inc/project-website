// lib/backend/metadata.ts
//
// Stable team metadata, kept deliberately separate from live sports data
// (the backend prompt calls for this: "team ID / team name / league / team
// colors / championship count / provider ID"). Adding or renaming a team
// touches this file only — never a provider.
//
// Championship counts are franchise facts, not API data. Colors match the
// frontend mock data so the Pike Place board keeps its palette.

import type { LeagueId, TeamColors } from "../sports/types.ts";

export type ProviderKind = "mlb" | "espn" | "pwhl" | "mlr" | "none";

/** ESPN league reference (the ESPN provider is config-driven per league). */
export interface EspnTeamRef {
  sport: string; // "football" | "hockey" | "basketball" | "soccer"
  league: string; // "nfl" | "nhl" | "wnba" | "usa.1" | "usa.nwsl"
  teamId: number;
}

export interface TeamMeta {
  id: string;
  league: LeagueId;
  name: string;
  shortName: string;
  status: "active" | "inactive";
  /** Shown for inactive placeholder teams (SuperSonics). */
  note?: string;
  championships: number;
  colors: TeamColors;
  provider: ProviderKind;
  /** Official MLB Stats API team id. */
  mlbId?: number;
  /** ESPN provider reference. */
  espn?: EspnTeamRef;
  /** PWHL HockeyTech team name fragment used to resolve the team. */
  pwhlName?: string;
  /** Current-season label shown next to the record (e.g. "2026", "2025-26"). */
  recordLabel?: string;
}

export const TEAM_METADATA: TeamMeta[] = [
  {
    id: "mariners",
    league: "mlb",
    name: "Seattle Mariners",
    shortName: "Mariners",
    status: "active",
    championships: 0,
    colors: { primary: "#0C2C56", secondary: "#005C5C" },
    provider: "mlb",
    mlbId: 136,
    recordLabel: "2026",
  },
  {
    id: "seahawks",
    league: "nfl",
    name: "Seattle Seahawks",
    shortName: "Seahawks",
    status: "active",
    championships: 1,
    colors: { primary: "#002244", secondary: "#69BE28" },
    provider: "espn",
    espn: { sport: "football", league: "nfl", teamId: 26 },
    recordLabel: "2026",
  },
  {
    id: "kraken",
    league: "nhl",
    name: "Seattle Kraken",
    shortName: "Kraken",
    status: "active",
    championships: 0,
    colors: { primary: "#001628", secondary: "#99D9D9" },
    provider: "espn",
    espn: { sport: "hockey", league: "nhl", teamId: 124292 },
    recordLabel: "2025-26",
  },
  {
    id: "storm",
    league: "wnba",
    name: "Seattle Storm",
    shortName: "Storm",
    status: "active",
    championships: 4,
    colors: { primary: "#007A33", secondary: "#FFC20E" },
    provider: "espn",
    espn: { sport: "basketball", league: "wnba", teamId: 14 },
    recordLabel: "2026",
  },
  {
    id: "sounders",
    league: "mls",
    name: "Seattle Sounders FC",
    shortName: "Sounders",
    status: "active",
    championships: 2,
    colors: { primary: "#005C29", secondary: "#0077C8" },
    provider: "espn",
    espn: { sport: "soccer", league: "usa.1", teamId: 9726 },
    recordLabel: "2026",
  },
  {
    id: "reign",
    league: "nwsl",
    name: "Seattle Reign FC",
    shortName: "Reign",
    status: "active",
    championships: 0,
    colors: { primary: "#1E1E4B", secondary: "#A8D120" },
    provider: "espn",
    espn: { sport: "soccer", league: "usa.nwsl", teamId: 15363 },
    recordLabel: "2026",
  },
  {
    id: "seawolves",
    league: "mlr",
    name: "Seattle Seawolves",
    shortName: "Seawolves",
    status: "active",
    championships: 3,
    colors: { primary: "#123B8A", secondary: "#D7263D" },
    provider: "mlr",
    recordLabel: "2026",
  },
  {
    id: "torrent",
    league: "pwhl",
    name: "Seattle Torrent",
    shortName: "Torrent",
    status: "active",
    championships: 0,
    colors: { primary: "#2F4F4F", secondary: "#8FD0D8" },
    provider: "pwhl",
    pwhlName: "Seattle",
    recordLabel: "2025-26",
  },
  {
    id: "supersonics",
    league: "nba",
    name: "Seattle SuperSonics",
    shortName: "SuperSonics",
    status: "inactive",
    note: "Not currently an NBA franchise. Placeholder card — waiting on NBA expansion before any roster, schedule, or stats exist.",
    championships: 1,
    colors: { primary: "#007A33", secondary: "#FFC200" },
    provider: "none",
  },
];

export function teamMetaById(id: string): TeamMeta | undefined {
  return TEAM_METADATA.find((m) => m.id === id);
}
