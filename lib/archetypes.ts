import data from "@/public/data/player-archetypes.json";

export type PlayerArchetype = {
  player_id: number;
  player_name: string;
  team?: string; // team abbreviation, e.g. "LAL" — optional, may be missing/traded/FA
  archetype: string;
  cluster_kmeans: number;
  pct_fga_rim: number;
  pct_fga_paint_non_ra: number;
  pct_fga_midrange: number;
  pct_fga_corner3: number;
  pct_fga_above_break3: number;
  fgpct_rim: number;
  fgpct_paint_non_ra: number;
  fgpct_midrange: number;
  fgpct_corner3: number;
  fgpct_above_break3: number;
  three_point_rate: number;
  rim_plus_three_rate: number;
  pct_assisted: number;
  total_fga: number;
  ppg?: number;
  rpg?: number;
  apg?: number;
};

export type ArchetypeDataset = {
  season: string;
  generated_from: string;
  sample?: boolean;
  players: PlayerArchetype[];
};

export const archetypeData = data as ArchetypeDataset;

const PIN_CYCLE = ["navy", "teal", "gold", "red"] as const;

export function pinForArchetype(archetype: string): (typeof PIN_CYCLE)[number] {
  let hash = 0;
  for (let i = 0; i < archetype.length; i++) hash = (hash * 31 + archetype.charCodeAt(i)) >>> 0;
  return PIN_CYCLE[hash % PIN_CYCLE.length];
}

export function groupByArchetype(players: PlayerArchetype[]) {
  const groups = new Map<string, PlayerArchetype[]>();
  for (const p of players) {
    const list = groups.get(p.archetype) ?? [];
    list.push(p);
    groups.set(p.archetype, list);
  }
  return Array.from(groups.entries()).map(([archetype, players]) => ({
    archetype,
    players: players.sort((a, b) => b.total_fga - a.total_fga),
    pin: pinForArchetype(archetype),
  }));
}
