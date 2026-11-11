export const GAME_TIERS = ["S", "A", "B", "C", "D", "Unranked"] as const;

export type GameTier = (typeof GAME_TIERS)[number];

export const GAME_TYPES = ["FFA", "Team vs Team", "Coop", "PvPvE"] as const;

export type GameType = (typeof GAME_TYPES)[number];

export type CardSuit = "diamond" | "club" | "heart" | "spade";

export const GAME_TYPE_SUITS: Record<GameType, CardSuit> = {
  FFA: "diamond",
  "Team vs Team": "club",
  Coop: "heart",
  PvPvE: "spade",
};

export type BoardGameEntry = {
  id: string;
  name: string;
  description: string;
  houseRules: string;
  fullRules: string;
  quickNotes: string;
  tier: GameTier;
  gameType: GameType;
};

export type GameDetailsUpdate = Pick<
  BoardGameEntry,
  "name" | "description" | "houseRules" | "fullRules" | "quickNotes" | "tier" | "gameType"
>;

export const TIER_DETAILS: Record<
  GameTier,
  { label: string; color: string; hint: string; image: string }
> = {
  S: {
    label: "Ace",
    color: "#7B302E",
    hint: "Perfect",
    image: "/images/tierlist/8BitDeck52.png",
  },
  A: {
    label: "King",
    color: "#A8793F",
    hint: "almost perfect",
    image: "/images/tierlist/8BitDeck51.png",
  },
  B: {
    label: "Queen",
    color: "#4D674D",
    hint: "would play again",
    image: "/images/tierlist/8BitDeck50.png",
  },
  C: {
    label: "Jack",
    color: "#536579",
    hint: "has its moments",
    image: "/images/tierlist/8BitDeck49.png",
  },
  D: {
    label: "10",
    color: "#554D48",
    hint: "probably not",
    image: "/images/tierlist/8BitDeck48.png",
  },
  Unranked: {
    label: "Joker",
    color: "#8B7762",
    hint: "wild card",
    image: "/images/tierlist/Joker.png",
  },
};
