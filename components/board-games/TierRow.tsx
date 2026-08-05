"use client";

import type { DragEvent } from "react";
import { TIER_DETAILS, type BoardGameEntry, type GameTier } from "@/lib/boardGames";
import GameCard from "./GameCard";

type TierRowProps = {
  tier: GameTier;
  games: BoardGameEntry[];
  draggingId: string | null;
  dragOverTier: GameTier | null;
  onDragOver: (event: DragEvent<HTMLDivElement>, tier: GameTier) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>, tier: GameTier) => void;
  onSave: (id: string, updates: Pick<BoardGameEntry, "name" | "description">) => void;
  onRemove: (id: string) => void;
  onMoveToTier: (id: string, tier: GameTier) => void;
  onDragStart: (event: DragEvent<HTMLElement>, game: BoardGameEntry) => void;
  onDragEnd: () => void;
};

export default function TierRow({
  tier,
  games,
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
}: TierRowProps) {
  const detail = TIER_DETAILS[tier];

  return (
    <div
      onDragOver={(event) => onDragOver(event, tier)}
      onDragLeave={onDragLeave}
      onDrop={(event) => onDrop(event, tier)}
      className={`overflow-hidden rounded-xl border border-black/20 bg-black/20 shadow-inner transition-colors ${
        dragOverTier === tier && draggingId ? "bg-pinGold/10 ring-2 ring-inset ring-pinGold/60" : ""
      }`}
    >
      <div
        className="grid min-h-16 grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-2 p-3 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-3 sm:p-4"
        style={{ borderLeft: `5px solid ${detail.color}` }}
      >
        <div className="pt-0.5">
          <span className="block whitespace-nowrap font-display text-2xl italic text-cream">{tier}</span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-cream/45">{detail.hint}</span>
        </div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isDragging={draggingId === game.id}
              onSave={(updates) => onSave(game.id, updates)}
              onDelete={() => onRemove(game.id)}
              onMoveToTier={(nextTier) => onMoveToTier(game.id, nextTier)}
              onDragStart={(event) => onDragStart(event, game)}
              onDragEnd={onDragEnd}
            />
          ))}
          {games.length === 0 && (
            <p className="col-span-full py-3 text-xs italic text-cream/35">
              Nothing here yet — move a card in.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
