// Approximate NBA team brand colors (primary/secondary), used only to tint
// a player's card gradient — not logos or other protected imagery, just
// hex values. Close enough for a fan-site aesthetic touch; not guaranteed
// pixel-exact to official brand guides.

export type TeamPalette = { primary: string; secondary: string; name: string };

export const TEAM_COLORS: Record<string, TeamPalette> = {
  ATL: { name: "Atlanta", primary: "#E03A3E", secondary: "#26282A" },
  BOS: { name: "Boston", primary: "#007A33", secondary: "#BA9653" },
  BKN: { name: "Brooklyn", primary: "#1A1A1A", secondary: "#555565" },
  CHA: { name: "Charlotte", primary: "#1D1160", secondary: "#00788C" },
  CHI: { name: "Chicago", primary: "#CE1141", secondary: "#1A1A1A" },
  CLE: { name: "Cleveland", primary: "#6F263D", secondary: "#FFB81C" },
  DAL: { name: "Dallas", primary: "#00538C", secondary: "#002B5E" },
  DEN: { name: "Denver", primary: "#0E2240", secondary: "#FEC524" },
  DET: { name: "Detroit", primary: "#C8102E", secondary: "#1D42BA" },
  GSW: { name: "Golden State", primary: "#1D428A", secondary: "#FFC72C" },
  HOU: { name: "Houston", primary: "#CE1141", secondary: "#1A1A1A" },
  IND: { name: "Indiana", primary: "#002D62", secondary: "#FDBB30" },
  LAC: { name: "LA Clippers", primary: "#C8102E", secondary: "#1D428A" },
  LAL: { name: "LA Lakers", primary: "#552583", secondary: "#FDB927" },
  MEM: { name: "Memphis", primary: "#5D76A9", secondary: "#12173F" },
  MIA: { name: "Miami", primary: "#98002E", secondary: "#F9A01B" },
  MIL: { name: "Milwaukee", primary: "#00471B", secondary: "#EEE1C6" },
  MIN: { name: "Minnesota", primary: "#0C2340", secondary: "#236192" },
  NOP: { name: "New Orleans", primary: "#0C2340", secondary: "#C8102E" },
  NYK: { name: "New York", primary: "#006BB6", secondary: "#F58426" },
  OKC: { name: "Oklahoma City", primary: "#007AC1", secondary: "#EF3B24" },
  ORL: { name: "Orlando", primary: "#0077C0", secondary: "#C4CED4" },
  PHI: { name: "Philadelphia", primary: "#006BB6", secondary: "#ED174C" },
  PHX: { name: "Phoenix", primary: "#1D1160", secondary: "#E56020" },
  POR: { name: "Portland", primary: "#E03A3E", secondary: "#1A1A1A" },
  SAC: { name: "Sacramento", primary: "#5A2D81", secondary: "#63727A" },
  SAS: { name: "San Antonio", primary: "#8A8D8F", secondary: "#1A1A1A" },
  TOR: { name: "Toronto", primary: "#CE1141", secondary: "#1A1A1A" },
  UTA: { name: "Utah", primary: "#002B5C", secondary: "#F9A01B" },
  WAS: { name: "Washington", primary: "#002B5C", secondary: "#E31837" },
};

// Default gradient when the team isn't recognized — the "modern orange"
// look requested as the site-wide default for this page.
export const DEFAULT_GRADIENT = { primary: "#FF7A45", secondary: "#B23A1F" };

export function teamGradient(teamAbbr?: string): { primary: string; secondary: string } {
  if (!teamAbbr) return DEFAULT_GRADIENT;
  const palette = TEAM_COLORS[teamAbbr.toUpperCase()];
  return palette ? { primary: palette.primary, secondary: palette.secondary } : DEFAULT_GRADIENT;
}
