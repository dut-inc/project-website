"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent, type Ref } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  BOARD_GAME_COLUMNS,
  BOARD_GAMES_TABLE,
  boardGameFromDatabase,
  boardGameToDatabase,
  boardGameUpdatesToDatabase,
  getDatabaseErrorMessage,
} from "@/lib/boardGamesDatabase";
import { BOARD_GAMES_STORAGE_KEY, readSavedGames } from "@/lib/boardGameStorage";
import type { BoardGameEntry, GameTier } from "@/lib/boardGames";
import AddGameForm from "./AddGameForm";
import TierList from "./TierList";
export default function BoardGameTierList({
  isEditable,
  developerAccessTriggerRef,
  onOpenDeveloperAccess,
}: {
  isEditable: boolean;
  developerAccessTriggerRef: Ref<HTMLButtonElement>;
  onOpenDeveloperAccess: () => void;
}) {
  const [games, setGames] = useState<BoardGameEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverTier, setDragOverTier] = useState<GameTier | null>(null);
  const loadPromiseRef = useRef<Promise<void> | null>(null);
  const loadGames = useCallback(() => {
    if (loadPromiseRef.current) return loadPromiseRef.current;

    const loadPromise = (async () => {
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: queryError } = await supabase
        .from(BOARD_GAMES_TABLE)
        .select(BOARD_GAME_COLUMNS)
        .order("created_at", { ascending: true });

      if (queryError) throw queryError;
      const remoteGames = (data ?? [])
        .map((row) => boardGameFromDatabase(row))
        .filter((game): game is BoardGameEntry => game !== null);

      if (remoteGames.length > 0) {
        setGames(remoteGames);
        return;
      }

      const savedGames = readSavedGames(window.localStorage.getItem(BOARD_GAMES_STORAGE_KEY));
      if (!savedGames?.length) {
        setGames([]);
        return;
      }

      const migrationPayload = savedGames.map(({ name, description, houseRules, fullRules, quickNotes, tier }) =>
        boardGameToDatabase({ name, description, houseRules, fullRules, quickNotes, tier }),
      );
      const { error: migrationError } = await supabase
        .from(BOARD_GAMES_TABLE)
        .insert(migrationPayload);
      if (migrationError) throw migrationError;

      const { data: migratedData, error: reloadError } = await supabase
        .from(BOARD_GAMES_TABLE)
        .select(BOARD_GAME_COLUMNS)
        .order("created_at", { ascending: true });
      if (reloadError) throw reloadError;

      window.localStorage.removeItem(BOARD_GAMES_STORAGE_KEY);
      setGames(
        (migratedData ?? [])
          .map((row) => boardGameFromDatabase(row))
          .filter((game): game is BoardGameEntry => game !== null),
      );
    } catch (caughtError) {
      setError(getDatabaseErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
    })();

    loadPromiseRef.current = loadPromise;
    void loadPromise
      .finally(() => {
        if (loadPromiseRef.current === loadPromise) loadPromiseRef.current = null;
      })
      .catch(() => undefined);
    return loadPromise;
  }, []);

  useEffect(() => {
    // The initial fetch synchronizes component state with the remote table.
    void loadGames();
  }, [loadGames]);

  useEffect(() => {
    if (isEditable) return;
    // Clear any visual drag state if the session is locked while dragging.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraggingId(null);
    setDragOverTier(null);
  }, [isEditable]);

  async function updateGame(id: string, updates: Partial<BoardGameEntry>) {
    if (!isEditable) return;
    setIsWorking(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: queryError } = await supabase
        .from(BOARD_GAMES_TABLE)
        .update(boardGameUpdatesToDatabase(updates))
        .eq("id", id);

      if (queryError) throw queryError;
      setGames((current) =>
        current.map((game) => (game.id === id ? { ...game, ...updates } : game)),
      );
    } catch (caughtError) {
      setError(getDatabaseErrorMessage(caughtError));
      throw caughtError;
    } finally {
      setIsWorking(false);
    }
  }

  async function addGame(game: Omit<BoardGameEntry, "id">) {
    if (!isEditable) return;
    setIsWorking(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: queryError } = await supabase
        .from(BOARD_GAMES_TABLE)
        .insert(boardGameToDatabase(game));

      if (queryError) throw queryError;
      await loadGames();
    } catch (caughtError) {
      setError(getDatabaseErrorMessage(caughtError));
      throw caughtError;
    } finally {
      setIsWorking(false);
    }
  }

  async function moveGameToTier(id: string, tier: GameTier) {
    if (!isEditable) return;

    try {
      if (games.find((game) => game.id === id)?.tier === tier) return;
      await updateGame(id, { tier });
    } finally {
      setDraggingId(null);
      setDragOverTier(null);
    }
  }

  function handleDragStart(event: DragEvent<HTMLElement>, game: BoardGameEntry) {
    if (!isEditable) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", game.id);
    setDraggingId(game.id);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, tier: GameTier) {
    if (!isEditable) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverTier(tier);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    const relatedTarget = event.relatedTarget;
    if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) return;
    setDragOverTier(null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, tier: GameTier) {
    if (!isEditable) return;
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    if (id) void moveGameToTier(id, tier).catch(() => undefined);
    else {
      setDraggingId(null);
      setDragOverTier(null);
    }
  }

  async function removeGame(id: string): Promise<void> {
    if (!isEditable) return;
    setIsWorking(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: queryError } = await supabase
        .from(BOARD_GAMES_TABLE)
        .delete()
        .eq("id", id);

      if (queryError) throw queryError;
      setGames((current) => current.filter((entry) => entry.id !== id));
      window.requestAnimationFrame(() => {
        document.getElementById("tier-list-focus-target")?.focus();
      });
    } catch (caughtError) {
      setError(getDatabaseErrorMessage(caughtError));
      throw caughtError;
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-6xl space-y-7">
      {error && (
        <div role="alert" className="rounded-xl border border-shelf-burgundy/70 bg-shelf-burgundy/20 px-4 py-3 text-sm text-shelf-paper">
          <p>{error}</p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-shelf-paper/75">
            Run the latest supabase/schema.sql in the Supabase SQL editor, then refresh the page.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-lg border-4 border-shelf-wood bg-shelf-walnut px-4 py-12 text-center text-sm text-shelf-paper/75 shadow-[0_18px_35px_rgba(38,24,15,0.35),inset_0_0_0_1px_rgba(203,184,147,0.18)]">
          Reading the shelf from Supabase…
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div className={isWorking ? "opacity-75 transition-opacity" : ""}>
            <TierList
              games={games}
              isEditable={isEditable}
              draggingId={draggingId}
              dragOverTier={dragOverTier}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onSave={(id, updates) => updateGame(id, updates)}
              onRemove={removeGame}
              onMoveToTier={(id, tier) => moveGameToTier(id, tier)}
              onDragStart={handleDragStart}
              onDragEnd={() => {
                setDraggingId(null);
                setDragOverTier(null);
              }}
              developerAccessTriggerRef={developerAccessTriggerRef}
              onOpenDeveloperAccess={onOpenDeveloperAccess}
            />
          </div>

          <aside className="space-y-5 lg:pt-16">
            <AddGameForm onAdd={addGame} disabled={!isEditable} />
          </aside>
        </div>
      )}
    </div>
  );
}
