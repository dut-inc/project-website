import { GAME_TIERS, type BoardGameEntry, type GameTier } from "@/lib/boardGames";

export const BOARD_GAMES_TABLE = "boardgames";
export const BOARD_GAME_COLUMNS =
  "id, name, description, house_rules, full_rules, quick_notes, tier, created_at";

export type BoardGameDatabaseRow = {
  id: number | string;
  created_at: string | null;
  name: string | null;
  tier: string | null;
  description: string | null;
  house_rules: string | null;
  quick_notes: string | null;
  full_rules: string | null;
};

export type NewBoardGame = Omit<BoardGameEntry, "id">;

function isValidId(value: unknown): value is number | string {
  return (
    (typeof value === "number" && Number.isInteger(value)) ||
    (typeof value === "string" && /^\d+$/.test(value))
  );
}

function normalizeTier(value: unknown): GameTier {
  return typeof value === "string" && GAME_TIERS.includes(value as GameTier)
    ? (value as GameTier)
    : "Unranked";
}

export function boardGameFromDatabase(row: unknown): BoardGameEntry | null {
  if (typeof row !== "object" || row === null) return null;
  const candidate = row as Partial<BoardGameDatabaseRow>;
  if (!isValidId(candidate.id)) return null;

  return {
    id: String(candidate.id),
    name: candidate.name ?? "",
    description: candidate.description ?? "",
    houseRules: candidate.house_rules ?? "",
    fullRules: candidate.full_rules ?? "",
    quickNotes: candidate.quick_notes ?? "",
    tier: normalizeTier(candidate.tier),
  };
}

export function boardGameToDatabase(game: NewBoardGame) {
  return {
    name: game.name,
    description: game.description,
    house_rules: game.houseRules,
    full_rules: game.fullRules,
    quick_notes: game.quickNotes,
    tier: game.tier,
  };
}

export function boardGameUpdatesToDatabase(updates: Partial<BoardGameEntry>) {
  const databaseUpdates: Record<string, string> = {};

  if (updates.name !== undefined) databaseUpdates.name = updates.name;
  if (updates.description !== undefined) databaseUpdates.description = updates.description;
  if (updates.houseRules !== undefined) databaseUpdates.house_rules = updates.houseRules;
  if (updates.fullRules !== undefined) databaseUpdates.full_rules = updates.fullRules;
  if (updates.quickNotes !== undefined) databaseUpdates.quick_notes = updates.quickNotes;
  if (updates.tier !== undefined) databaseUpdates.tier = updates.tier;

  return databaseUpdates;
}

export function getDatabaseErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const candidate = error as { message?: string; details?: string };
    if (candidate.message) {
      return candidate.details
        ? `${candidate.message} ${candidate.details}`
        : candidate.message;
    }
  }

  return "The database request could not be completed.";
}
