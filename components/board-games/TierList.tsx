"use client";

import type { DragEvent } from "react";
import { GAME_TIERS, type BoardGameEntry, type GameDetailsUpdate, type GameTier } from "@/lib/boardGames";
import TierRow from "./TierRow";

type TierListProps = {
  games: BoardGameEntry[];
  isEditable: boolean;
  draggingId: string | null;
  dragOverTier: GameTier | null;
  onDragOver: (event: DragEvent<HTMLDivElement>, tier: GameTier) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>, tier: GameTier) => void;
  onSave: (id: string, updates: GameDetailsUpdate) => Promise<void> | void;
  onRemove: (id: string) => Promise<void> | void;
  onMoveToTier: (id: string, tier: GameTier) => Promise<void> | void;
  onDragStart: (event: DragEvent<HTMLElement>, game: BoardGameEntry) => void;
  onDragEnd: () => void;
};

export default function TierList({
  games,
  isEditable,
  draggingId,
  dragOverTier,
  onDragOver,
  onDragLeave,
  onDrop,
  onSave,
  onRemove,
  onMoveToTier,
  onDragStart,
  onDragEnd,
}: TierListProps) {
  return (
    <section aria-labelledby="tier-list-heading" className="min-w-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <span id="tier-list-focus-target" tabIndex={-1} className="sr-only">Tier list updated</span>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-shelf-paper/75">
            {games.filter((game) => game.tier !== "Unranked").length} ranked / {games.length} total
          </p>
          <h2 id="tier-list-heading" className="mt-1 font-display text-3xl italic text-shelf-paper">
            The shelf, sorted
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        {GAME_TIERS.map((tier) => (
          <TierRow
            key={tier}
            tier={tier}
            games={games.filter((game) => game.tier === tier)}
            isEditable={isEditable}
            draggingId={draggingId}
            dragOverTier={dragOverTier}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onSave={onSave}
            onRemove={onRemove}
            onMoveToTier={onMoveToTier}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </section>
  );
}
