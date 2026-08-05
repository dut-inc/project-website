export const GAME_TIERS = ["S", "A", "B", "C", "D", "Unranked"] as const;

export type GameTier = (typeof GAME_TIERS)[number];

export type BoardGameEntry = {
  id: string;
  name: string;
  description: string;
  houseRules: string;
  fullRules: string;
  quickNotes: string;
  tier: GameTier;
};

export type GameDetailsUpdate = Pick<
  BoardGameEntry,
  "name" | "description" | "houseRules" | "fullRules" | "quickNotes"
>;

export const TIER_DETAILS: Record<
  GameTier,
  { label: string; color: string; hint: string }
> = {
  S: { label: "S tier", color: "#7B302E", hint: "clear the table" },
  A: { label: "A tier", color: "#A8793F", hint: "almost perfect" },
  B: { label: "B tier", color: "#4D674D", hint: "would play again" },
  C: { label: "C tier", color: "#536579", hint: "has its moments" },
  D: { label: "D tier", color: "#554D48", hint: "probably not" },
  Unranked: { label: "Unranked", color: "#8B7762", hint: "still deciding" },
};

export const STARTER_GAMES: BoardGameEntry[] = [
  {
    id: "wingspan",
    name: "Wingspan",
    description: "Beautiful birds, satisfying engines, gentle competition.",
    houseRules: "First player rotates each round. Keep the bird tray visible to everyone.",
    fullRules: "Use the official rulebook for setup, habitat actions, end-of-round goals, and end-game scoring.",
    quickNotes: "Draft food early. Eggs are a reliable late-game pivot.",
    tier: "A",
  },
  {
    id: "catan",
    name: "Catan",
    description: "Trade wood for sheep and pretend the robber is personal.",
    houseRules: "No trading after the dice are picked up. Friendly table talk encouraged.",
    fullRules: "Use the official rulebook for setup, production, trading, building, development cards, and victory points.",
    quickNotes: "Watch the number tokens. Do not forget ports exist.",
    tier: "B",
  },
  {
    id: "azul",
    name: "Azul",
    description: "Quietly tactical tile drafting with excellent table presence.",
    houseRules: "Call out the final round clearly once a player completes a horizontal row.",
    fullRules: "Use the official rulebook for factory display drafting, wall tiling, scoring, and penalties.",
    quickNotes: "The floor line is a resource too. Plan around the next player.",
    tier: "A",
  },
  {
    id: "root",
    name: "Root",
    description: "Asymmetric woodland politics for a group ready to commit.",
    houseRules: "Explain factions before choosing. Pause for rules questions during the first round.",
    fullRules: "Use the official rulebook and faction boards for setup, crafting, actions, dominance, and victory conditions.",
    quickNotes: "Read your faction board out loud. Everyone has a different game.",
    tier: "S",
  },
  {
    id: "gloomhaven",
    name: "Gloomhaven",
    description: "A campaign-sized undertaking for the most committed shelf space.",
    houseRules: "Keep a campaign log beside the box and return components to labeled trays.",
    fullRules: "Use the scenario book, rulebook, and character sheets for campaign setup, actions, monsters, loot, and retirement.",
    quickNotes: "Check the scenario goal before spending every card.",
    tier: "Unranked",
  },
];
