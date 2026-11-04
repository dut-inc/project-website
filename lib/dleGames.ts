export type DleGameStatus = "PLANNING" | "IN DEVELOPMENT" | "LIVE";

export type DleGame = {
  // URL segment (/dle/<slug>); kept stable so saved links keep working.
  slug: string;
  // The game's file in the explorer is `<file>.dle`.
  file: string;
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
    file: "genshin",
    title: "Genshindle",
    world: "Teyvat",
    description: "let's do the genshindle.",
    status: "LIVE",
    accent: "teal",
  },
  {
    slug: "wuthering-waves",
    file: "wuwa",
    title: "Wuwadle",
    world: "Solaris-3",
    description: "let's do the wuwadle.",
    status: "LIVE",
    accent: "gold",
  },
];

export function getDleGame(slug: string) {
  return DLE_GAMES.find((game) => game.slug === slug);
}
