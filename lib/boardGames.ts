export const GAME_TIERS = ["S", "A", "B", "C", "D", "Unranked"] as const;

export type GameTier = (typeof GAME_TIERS)[number];

export type BoardGameEntry = {
  id: string;
  name: string;
  description: string;
  tier: GameTier;
};

export const TIER_DETAILS: Record<
  GameTier,
  { label: string; color: string; hint: string }
> = {
  S: { label: "S tier", color: "#C1442D", hint: "clear the table" },
  A: { label: "A tier", color: "#D47A35", hint: "almost perfect" },
  B: { label: "B tier", color: "#C9A227", hint: "would play again" },
  C: { label: "C tier", color: "#2F7A6B", hint: "has its moments" },
  D: { label: "D tier", color: "#274B6D", hint: "probably not" },
  Unranked: { label: "Unranked", color: "#6B6250", hint: "still deciding" },
};

export const STARTER_GAMES: BoardGameEntry[] = [
  {
    id: "wingspan",
    name: "Wingspan",
    description: "Beautiful birds, satisfying engines, gentle competition.",
    tier: "A",
  },
  {
    id: "catan",
    name: "Catan",
    description: "Trade wood for sheep and pretend the robber is personal.",
    tier: "B",
  },
  {
    id: "azul",
    name: "Azul",
    description: "Quietly tactical tile drafting with excellent table presence.",
    tier: "A",
  },
  {
    id: "root",
    name: "Root",
    description: "Asymmetric woodland politics for a group ready to commit.",
    tier: "S",
  },
  {
    id: "gloomhaven",
    name: "Gloomhaven",
    description: "A campaign-sized undertaking for the most committed shelf space.",
    tier: "Unranked",
  },
];
