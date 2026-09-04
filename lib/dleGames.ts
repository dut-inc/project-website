export type DleGameStatus = "PLANNING" | "IN DEVELOPMENT" | "LIVE";

export type DleGame = {
  slug: string;
  title: string;
  world: string;
  description: string;
  status: DleGameStatus;
  accent: "teal" | "gold";
};

// Add future daily guessing games here; the hub and dynamic route pick them up automatically.
export const DLE_GAMES: DleGame[] = [
  {
    slug: "genshin-impact",
    title: "Genshin Impact",
    world: "Teyvat",
    description: "lets do the genshindle.",
    status: "LIVE",
    accent: "teal",
  },
  {
    slug: "wuthering-waves",
    title: "Wuthering Waves",
    world: "Solaris-3",
    description: "A daily Resonator mystery built around the details that make each kit distinct.",
    status: "PLANNING",
    accent: "gold",
  },
];

export function getDleGame(slug: string) {
  return DLE_GAMES.find((game) => game.slug === slug);
}
