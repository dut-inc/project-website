// Doom Score scatterplot: types and league styling. The numbers live in
// data/sports/doom-score-teams.json and are placeholders until real data is
// dropped in (see that file's _comment).

export type League = "NBA" | "NHL" | "NFL" | "MLB" | "WNBA";

export type DoomTeam = {
  id: string; // `${league}-${abbr}`
  league: League;
  abbr: string;
  name: string;
  // Local logo path, or null to draw the league's marker shape.
  logo: string | null;
  doomScore: number;
  winPct: number; // 0–1
  // Picks owned over the next three drafts.
  draftPicks: { firsts: number; total: number };
  avgAge: number;
  // $M under the cap (negative = over). MLB has no cap: room under the luxury-tax line.
  capSpaceM: number;
};

export type MarkerShape = "circle" | "square" | "diamond" | "triangle" | "hexagon";

// Five hues can't all stay distinct for colour-blind readers in a scatter, so
// each league also has its own shape. Colours are stepped for the dark editor surface.
export const LEAGUES: { id: League; color: string; shape: MarkerShape }[] = [
  { id: "NBA", color: "#3987e5", shape: "circle" },
  { id: "NHL", color: "#199e70", shape: "square" },
  { id: "NFL", color: "#d95926", shape: "diamond" },
  { id: "MLB", color: "#c98500", shape: "triangle" },
  { id: "WNBA", color: "#d55181", shape: "hexagon" },
];

export const LEAGUE_STYLE = Object.fromEntries(LEAGUES.map((l) => [l.id, l])) as Record<
  League,
  (typeof LEAGUES)[number]
>;

export function formatWinPct(pct: number): string {
  return pct >= 1 ? "1.000" : pct.toFixed(3).replace(/^0/, "");
}

export function formatCap(team: DoomTeam): string {
  const amount = `$${Math.abs(team.capSpaceM).toFixed(1)}M`;
  if (team.league === "MLB") {
    return team.capSpaceM >= 0 ? `${amount} under the tax line` : `${amount} over the tax line`;
  }
  return team.capSpaceM >= 0 ? `${amount} in cap space` : `${amount} over the cap`;
}
