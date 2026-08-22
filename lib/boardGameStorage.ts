import { GAME_TIERS, GAME_TYPES, type BoardGameEntry, type GameTier, type GameType } from "@/lib/boardGames";

export const BOARD_GAMES_STORAGE_KEY = "the-board:board-game-tiers";

export function makeBoardGameId() {
  return `game-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isGameTier(value: unknown): value is GameTier {
  return typeof value === "string" && GAME_TIERS.includes(value as GameTier);
}

function normalizeGameType(value: unknown): GameType {
  return typeof value === "string" && GAME_TYPES.includes(value as GameType)
    ? (value as GameType)
    : "FFA";
}

export function readSavedGames(value: string | null): BoardGameEntry[] | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;

    const validGames = parsed.map((game): BoardGameEntry | null => {
      if (
        typeof game !== "object" ||
        game === null ||
        typeof game.id !== "string" ||
        typeof game.name !== "string" ||
        typeof game.description !== "string" ||
        !isGameTier(game.tier)
      ) {
        return null;
      }

      return {
        id: game.id,
        name: game.name,
        description: game.description,
        houseRules: typeof game.houseRules === "string" ? game.houseRules : "",
        fullRules: typeof game.fullRules === "string" ? game.fullRules : "",
        quickNotes: typeof game.quickNotes === "string" ? game.quickNotes : "",
        tier: game.tier,
        gameType: normalizeGameType(game.gameType),
      };
    });

    return validGames.every((game): game is BoardGameEntry => game !== null)
      ? validGames
      : null;
  } catch {
    return null;
  }
}
