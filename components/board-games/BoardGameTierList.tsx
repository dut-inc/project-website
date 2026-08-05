"use client";

import { useEffect, useState, type DragEvent } from "react";
import {
  BOARD_GAMES_STORAGE_KEY,
  BOARD_GAME_NOTES_KEY,
  readSavedGames,
} from "@/lib/boardGameStorage";
import { STARTER_GAMES, type BoardGameEntry, type GameTier } from "@/lib/boardGames";
import AddGameForm from "./AddGameForm";
import GroupNotes from "./GroupNotes";
import QuickStartGuide from "./QuickStartGuide";
import TierList from "./TierList";

export default function BoardGameTierList() {
  const [games, setGames] = useState<BoardGameEntry[]>(STARTER_GAMES);
  const [notes, setNotes] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverTier, setDragOverTier] = useState<GameTier | null>(null);

  useEffect(() => {
    try {
      const savedGames = readSavedGames(window.localStorage.getItem(BOARD_GAMES_STORAGE_KEY));
      const savedNotes = window.localStorage.getItem(BOARD_GAME_NOTES_KEY);
      if (savedGames) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setGames(savedGames);
      }
      if (savedNotes) setNotes(savedNotes);
    } catch {
      // Keep the starter list if storage is unavailable or contains bad data.
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    try {
      window.localStorage.setItem(BOARD_GAMES_STORAGE_KEY, JSON.stringify(games));
    } catch {
      // Storage can be unavailable in private browsing or when full.
    }
  }, [games, isReady]);

  useEffect(() => {
    if (!isReady) return;
    try {
      window.localStorage.setItem(BOARD_GAME_NOTES_KEY, notes);
    } catch {
      // Storage can be unavailable in private browsing or when full.
    }
  }, [notes, isReady]);

  function updateGame(id: string, updates: Partial<BoardGameEntry>) {
    setGames((current) =>
      current.map((game) => (game.id === id ? { ...game, ...updates } : game)),
    );
  }

  function moveGameToTier(id: string, tier: GameTier) {
    updateGame(id, { tier });
    setDraggingId(null);
    setDragOverTier(null);
  }

  function handleDragStart(event: DragEvent<HTMLElement>, game: BoardGameEntry) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", game.id);
    setDraggingId(game.id);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, tier: GameTier) {
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
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    if (id) moveGameToTier(id, tier);
    else {
      setDraggingId(null);
      setDragOverTier(null);
    }
  }

  function removeGame(id: string) {
    setGames((current) => current.filter((game) => game.id !== id));
    window.requestAnimationFrame(() => {
      document.getElementById("tier-list-focus-target")?.focus();
    });
  }

  function resetBoard() {
    if (!window.confirm("Reset the tier list to the starter games?")) return;
    setGames(STARTER_GAMES);
    setNotes("");
  }

  return (
    <div className="mx-auto mt-10 max-w-6xl space-y-6">
      <QuickStartGuide />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div>
          <TierList
            games={games}
            draggingId={draggingId}
            dragOverTier={dragOverTier}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onSave={(id, updates) => updateGame(id, updates)}
            onRemove={removeGame}
            onMoveToTier={moveGameToTier}
            onDragStart={handleDragStart}
            onDragEnd={() => {
              setDraggingId(null);
              setDragOverTier(null);
            }}
          />
          <button
            type="button"
            onClick={resetBoard}
            className="mt-4 min-h-11 rounded-full px-3 font-mono text-[10px] uppercase tracking-widest text-cream/45 transition-colors hover:text-pinGold"
          >
            Reset list
          </button>
        </div>

        <aside className="space-y-5">
          <AddGameForm
            onAdd={(game) => setGames((current) => [...current, game])}
          />
          <GroupNotes notes={notes} onChange={setNotes} />
        </aside>
      </div>
    </div>
  );
}
