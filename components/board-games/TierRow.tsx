"use client";

import { Fragment, type DragEvent } from "react";
import { TIER_DETAILS, type BoardGameEntry, type GameDetailsUpdate, type GameTier } from "@/lib/boardGames";
import GameCard from "./GameCard";

type TierRowProps = {
  tier: GameTier;
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

export default function TierRow({
  tier,
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
}: TierRowProps) {
  const detail = TIER_DETAILS[tier];
  const ledgeStyle = {
    background: `linear-gradient(180deg, ${detail.color}80 0%, #8a6243 34%, #62442e 64%, #3a271c 100%)`,
    borderColor: `${detail.color}a8`,
  };

  function renderProtrudingShelf(visibility: string) {
    return (
      <div
        aria-hidden
        className={`pointer-events-none relative z-10 col-span-full -mx-2 mb-2 h-1 rounded-sm border-y shadow-[0_3px_6px_rgba(0,0,0,0.5)] sm:mb-2.5 ${visibility}`}
        style={ledgeStyle}
      />
    );
  }

  return (
    <div
      onDragOver={isEditable ? (event) => onDragOver(event, tier) : undefined}
      onDragLeave={isEditable ? onDragLeave : undefined}
      onDrop={isEditable ? (event) => onDrop(event, tier) : undefined}
      className={`group/row relative border-b-[10px] border-black/70 bg-[#302018] shadow-[inset_0_10px_18px_rgba(0,0,0,0.48),inset_0_-2px_0_rgba(138,98,67,0.18)] transition-colors last:border-b-0 ${
        dragOverTier === tier ? "bg-shelf-brass/20 shadow-[inset_0_0_0_2px_rgba(169,121,63,0.75),inset_0_10px_18px_rgba(0,0,0,0.48)]" : ""
      }`}
    >
      <div className="relative grid min-h-[6.5rem] grid-cols-[3.35rem_minmax(0,1fr)] items-stretch bg-[linear-gradient(90deg,rgba(0,0,0,0.2),transparent_12%,transparent_88%,rgba(0,0,0,0.22))] sm:min-h-[6.75rem] sm:grid-cols-[4.25rem_minmax(0,1fr)]">
        <div className="relative z-10 flex flex-col justify-center overflow-hidden border-r border-black/45 bg-black/10 px-1.5 py-1.5 text-center sm:px-2">
          <span
            className="absolute inset-y-2 left-0 w-0.5 rounded-r-full opacity-80"
            style={{ backgroundColor: detail.color }}
            aria-hidden
          />
          <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-shelf-paper/40">
            tier
          </span>
          <span className="mt-0.5 font-display text-2xl italic leading-none text-shelf-paper/90 sm:text-3xl">
            {tier === "Unranked" ? "—" : tier}
          </span>
          <span className="mt-1 font-mono text-[8px] uppercase leading-tight tracking-wide text-shelf-paper/40">
            {detail.hint}
          </span>
        </div>

        <div className="relative -ml-1 flex min-w-0 items-center border-l border-black/30 bg-[linear-gradient(180deg,rgba(138,98,67,0.12),rgba(0,0,0,0.22))] px-2 py-2 shadow-[inset_0_12px_20px_rgba(0,0,0,0.28),inset_0_-8px_18px_rgba(0,0,0,0.25)] sm:px-3">
          <div
            className="grid min-w-0 flex-1 content-end gap-x-2 gap-y-0 rounded-sm border border-black/45 bg-[linear-gradient(180deg,rgba(20,12,8,0.08),rgba(20,12,8,0.28))] px-1 pt-2 pb-2 shadow-[inset_0_7px_10px_rgba(0,0,0,0.12),inset_0_-7px_11px_rgba(0,0,0,0.28)] sm:px-1.5 sm:pt-2.5 sm:grid-cols-3 xl:grid-cols-4"
            style={{
              backgroundColor: `${detail.color}18`,
              borderColor: `${detail.color}70`,
            }}
          >
            {games.map((game, index) => (
              <Fragment key={game.id}>
                <GameCard
                  game={game}
                  tierColor={detail.color}
                  isEditable={isEditable}
                  isDragging={draggingId === game.id}
                  onSave={(updates) => onSave(game.id, updates)}
                  onDelete={() => onRemove(game.id)}
                  onMoveToTier={(nextTier) => onMoveToTier(game.id, nextTier)}
                  onDragStart={(event) => onDragStart(event, game)}
                  onDragEnd={onDragEnd}
                />
                {index < games.length - 1 && renderProtrudingShelf("sm:hidden")}
                {index < games.length - 1 && (index + 1) % 3 === 0 && renderProtrudingShelf("hidden sm:block xl:hidden")}
                {index < games.length - 1 && (index + 1) % 4 === 0 && renderProtrudingShelf("hidden xl:block")}
              </Fragment>
            ))}
            {games.length === 0 && (
              <p className="col-span-full flex min-h-[4rem] items-center px-3 text-xs italic text-shelf-paper/45">
                Empty bay — move a game in.
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-[-7px] z-20 h-3 rounded-b-sm border-t border-shelf-woodLight/70 bg-[linear-gradient(180deg,#8a6243,#62442e_45%,#3a271c)] shadow-[0_5px_8px_rgba(0,0,0,0.48)]" />
    </div>
  );
}
