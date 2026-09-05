"use client";

import { useState, type DragEvent, type Ref } from "react";
import { GAME_TIERS, GAME_TYPE_SUITS, type BoardGameEntry, type CardSuit, type GameDetailsUpdate, type GameTier } from "@/lib/boardGames";
import SuitKey from "./SuitKey";
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
  onDropOnGame: (event: DragEvent<HTMLElement>, game: BoardGameEntry) => void;
  developerAccessTriggerRef: Ref<HTMLButtonElement>;
  onOpenDeveloperAccess: () => void;
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
  onDropOnGame,
  developerAccessTriggerRef,
  onOpenDeveloperAccess,
}: TierListProps) {
  const [selectedSuit, setSelectedSuit] = useState<CardSuit | null>(null);
  const visibleGames = selectedSuit
    ? games.filter((game) => GAME_TYPE_SUITS[game.gameType] === selectedSuit)
    : games;
  const rankedCount = visibleGames.filter((game) => game.tier !== "Unranked").length;

  return (
    <section aria-labelledby="tier-list-heading" className="min-w-0">
      <span id="tier-list-focus-target" tabIndex={-1} className="sr-only">
        Tier list updated
      </span>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 px-1">
        <h2 id="tier-list-heading" className="font-display text-3xl italic text-shelf-paper sm:text-4xl">
          Our Board Games
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-shelf-paper/60">
          {rankedCount} ranked / {visibleGames.length} {selectedSuit ? "shown" : "total"}
        </p>
      </div>

      <div className="relative overflow-visible rounded-[1.35rem] border-4 border-wall2 bg-wall px-2 pt-2 pb-4 shadow-[0_18px_35px_rgba(0,0,0,0.32),inset_0_0_0_2px_rgba(87,89,94,0.18),inset_0_12px_30px_rgba(0,0,0,0.48),inset_0_-16px_30px_rgba(0,0,0,0.4)] sm:px-3 sm:pt-3 sm:pb-5">
        <div className="pointer-events-none absolute inset-0 rounded-[0.95rem] opacity-25 [background-image:repeating-linear-gradient(7deg,transparent_0,transparent_18px,rgba(255,255,255,0.035)_19px,transparent_20px),repeating-linear-gradient(97deg,rgba(0,0,0,0.16)_0,transparent_2px,transparent_90px)]" />
        <div className="pointer-events-none absolute -inset-x-1 top-1/2 h-1/2 rounded-b-xl bg-black/20 blur-xl" />
        <SuitKey
          selectedSuit={selectedSuit}
          onSelect={setSelectedSuit}
          isEditable={isEditable}
          developerAccessTriggerRef={developerAccessTriggerRef}
          onOpenDeveloperAccess={onOpenDeveloperAccess}
        />

        <div className="relative overflow-visible rounded-lg border border-black/60 bg-[#2b1d17] shadow-[inset_0_16px_30px_rgba(0,0,0,0.58),inset_0_-8px_18px_rgba(0,0,0,0.45),0_0_0_1px_rgba(138,98,67,0.22)]">
          {GAME_TIERS.map((tier) => (
            <TierRow
              key={tier}
              tier={tier}
              games={visibleGames.filter((game) => game.tier === tier)}
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
              onDropOnGame={onDropOnGame}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
