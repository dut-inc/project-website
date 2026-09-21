// lib/sports/nbaTeams.ts
//
// Static NBA team metadata for the standings prediction pool. Colors come
// from lib/teamColors.ts (hex tints only, no logos). Conference splits and
// the "chalk" default order come from ESPN's final 2025-26 standings so a
// brand-new season starts with last year's finishing order as the seed.

import { TEAM_COLORS } from "../teamColors.ts";

export type Conference = "West" | "East";

export type NbaTeam = {
  /** Canonical abbreviation — doubles as the team id. Matches lib/teamColors. */
  id: string;
  /** ESPN standings abbreviation (differs from ours for a few teams). */
  espnAbbr: string;
  city: string;
  name: string;
  conference: Conference;
  primary: string;
  secondary: string;
};

type TeamSeed = {
  id: string;
  espnAbbr: string;
  city: string;
  name: string;
  conference: Conference;
};

const SEEDS: TeamSeed[] = [
  // Eastern Conference
  { id: "ATL", espnAbbr: "ATL", city: "Atlanta", name: "Hawks", conference: "East" },
  { id: "BOS", espnAbbr: "BOS", city: "Boston", name: "Celtics", conference: "East" },
  { id: "BKN", espnAbbr: "BKN", city: "Brooklyn", name: "Nets", conference: "East" },
  { id: "CHA", espnAbbr: "CHA", city: "Charlotte", name: "Hornets", conference: "East" },
  { id: "CHI", espnAbbr: "CHI", city: "Chicago", name: "Bulls", conference: "East" },
  { id: "CLE", espnAbbr: "CLE", city: "Cleveland", name: "Cavaliers", conference: "East" },
  { id: "DET", espnAbbr: "DET", city: "Detroit", name: "Pistons", conference: "East" },
  { id: "IND", espnAbbr: "IND", city: "Indiana", name: "Pacers", conference: "East" },
  { id: "MIA", espnAbbr: "MIA", city: "Miami", name: "Heat", conference: "East" },
  { id: "MIL", espnAbbr: "MIL", city: "Milwaukee", name: "Bucks", conference: "East" },
  { id: "NYK", espnAbbr: "NY", city: "New York", name: "Knicks", conference: "East" },
  { id: "ORL", espnAbbr: "ORL", city: "Orlando", name: "Magic", conference: "East" },
  { id: "PHI", espnAbbr: "PHI", city: "Philadelphia", name: "76ers", conference: "East" },
  { id: "TOR", espnAbbr: "TOR", city: "Toronto", name: "Raptors", conference: "East" },
  { id: "WAS", espnAbbr: "WSH", city: "Washington", name: "Wizards", conference: "East" },
  // Western Conference
  { id: "DAL", espnAbbr: "DAL", city: "Dallas", name: "Mavericks", conference: "West" },
  { id: "DEN", espnAbbr: "DEN", city: "Denver", name: "Nuggets", conference: "West" },
  { id: "GSW", espnAbbr: "GS", city: "Golden State", name: "Warriors", conference: "West" },
  { id: "HOU", espnAbbr: "HOU", city: "Houston", name: "Rockets", conference: "West" },
  { id: "LAC", espnAbbr: "LAC", city: "LA", name: "Clippers", conference: "West" },
  { id: "LAL", espnAbbr: "LAL", city: "Los Angeles", name: "Lakers", conference: "West" },
  { id: "MEM", espnAbbr: "MEM", city: "Memphis", name: "Grizzlies", conference: "West" },
  { id: "MIN", espnAbbr: "MIN", city: "Minnesota", name: "Timberwolves", conference: "West" },
  { id: "NOP", espnAbbr: "NO", city: "New Orleans", name: "Pelicans", conference: "West" },
  { id: "OKC", espnAbbr: "OKC", city: "Oklahoma City", name: "Thunder", conference: "West" },
  { id: "PHX", espnAbbr: "PHX", city: "Phoenix", name: "Suns", conference: "West" },
  { id: "POR", espnAbbr: "POR", city: "Portland", name: "Trail Blazers", conference: "West" },
  { id: "SAC", espnAbbr: "SAC", city: "Sacramento", name: "Kings", conference: "West" },
  { id: "SAS", espnAbbr: "SA", city: "San Antonio", name: "Spurs", conference: "West" },
  { id: "UTA", espnAbbr: "UTAH", city: "Utah", name: "Jazz", conference: "West" },
];

export const NBA_TEAMS: NbaTeam[] = SEEDS.map((seed) => {
  const palette = TEAM_COLORS[seed.id] ?? { primary: "#B23A1F", secondary: "#F58426" };
  return { ...seed, primary: palette.primary, secondary: palette.secondary };
});

export const TEAMS_BY_ID: ReadonlyMap<string, NbaTeam> = new Map(NBA_TEAMS.map((t) => [t.id, t]));

/** ESPN abbreviation -> our canonical id (only the handful that differ). */
const ESPN_ABBR_FIXUPS: Record<string, string> = {
  NY: "NYK",
  WSH: "WAS",
  GS: "GSW",
  SA: "SAS",
  NO: "NOP",
  UTAH: "UTA",
};

export function teamFromEspnAbbr(abbr: string | undefined): NbaTeam | undefined {
  if (!abbr) return undefined;
  const upper = abbr.toUpperCase();
  return TEAMS_BY_ID.get(ESPN_ABBR_FIXUPS[upper] ?? upper);
}

/**
 * The 2025-26 final conference order — the "chalk" seed every new
 * participant's board starts from before they shake it up.
 */
export const DEFAULT_EAST_ORDER = [
  "DET", "BOS", "NYK", "CLE", "ATL", "TOR", "PHI", "ORL", "CHA", "MIA", "MIL", "CHI", "BKN", "IND", "WAS",
];

export const DEFAULT_WEST_ORDER = [
  "OKC", "SAS", "DEN", "LAL", "HOU", "MIN", "PHX", "POR", "LAC", "GSW", "NOP", "DAL", "MEM", "SAC", "UTA",
];

export function chalkOrder(conference: Conference): string[] {
  return conference === "West" ? [...DEFAULT_WEST_ORDER] : [...DEFAULT_EAST_ORDER];
}
