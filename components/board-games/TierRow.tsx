"use client";

import Image from "next/image";
import { Fragment, type DragEvent } from "react";
import {
  CARD_SUITS,
  TIER_DETAILS,
  type BoardGameEntry,
  type GameDetailsUpdate,
  type GameTier,
} from "@/lib/boardGames";
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
    background: `linear-gradient(180deg, ${detail.color}99 0%, #b38a5b 32%, #6f4b32 68%, #38251b 100%)`,
    borderColor: `${detail.color}b8`,
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
      className={`group/row relative border-b-[10px] border-black/75 bg-[#21191a] shadow-[inset_0_12px_22px_rgba(0,0,0,0.62),inset_0_-2px_0_rgba(179,138,91,0.22)] transition-colors last:border-b-0 ${
        dragOverTier === tier
          ? "bg-shelf-brass/20 shadow-[inset_0_0_0_2px_rgba(169,121,63,0.8),inset_0_12px_22px_rgba(0,0,0,0.62)]"
          : ""
      }`}
    >
      <div aria-label={detail.label} className="relative grid min-h-[14rem] grid-cols-[8rem_minmax(0,1fr)] items-stretch bg-[linear-gradient(90deg,rgba(0,0,0,0.32),transparent_18%,transparent_88%,rgba(0,0,0,0.28))] sm:min-h-[16rem] sm:grid-cols-[10rem_minmax(0,1fr)]">
        <div className="relative z-10 m-2 aspect-[3/4] self-center -translate-y-[3px] overflow-hidden rounded-xl border-2 border-shelf-paper/35 bg-shelf-paper shadow-[0_7px_14px_rgba(0,0,0,0.46),inset_0_0_0_1px_rgba(255,255,255,0.3)] sm:m-3">
          <Image
            src={detail.image}
            alt=""
            fill
            sizes="(min-width: 640px) 10rem, 8rem"
            className="object-contain opacity-75 saturate-[0.7]"
            aria-hidden
          />
          <div
            className="absolute inset-0 flex flex-col justify-end p-2.5 text-shelf-paper sm:p-3"
            style={{
              background: `linear-gradient(145deg, ${detail.color}b8 0%, rgba(30,20,20,0.2) 42%, rgba(15,12,14,0.9) 100%)`,
            }}
          >
            <span className="font-display text-lg italic leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.55)] sm:text-xl">
              {detail.label}
            </span>
            <span className="mt-1 font-mono text-[7px] uppercase leading-tight tracking-[0.1em] text-shelf-paper/75 sm:text-[8px]">
              {detail.hint}
            </span>
          </div>
        </div>

        <div className="relative flex h-full min-w-0 items-center border-l border-black/35 pl-2 sm:pl-3">
          <div
            className="relative -translate-y-[3px] self-center grid h-[calc(100%_-_0.5rem)] min-w-0 flex-1 content-end gap-x-2 gap-y-0 rounded-xl border bg-black/25 px-2 pt-2 sm:pt-2.5 shadow-[inset_0_12px_22px_rgba(0,0,0,0.38),inset_0_-8px_16px_rgba(0,0,0,0.32)] grid-cols-2 sm:grid-cols-3 xl:grid-cols-5"
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
                  suit={CARD_SUITS[index % CARD_SUITS.length]}
                  isEditable={isEditable}
                  isDragging={draggingId === game.id}
                  onSave={(updates) => onSave(game.id, updates)}
                  onDelete={() => onRemove(game.id)}
                  onMoveToTier={(nextTier) => onMoveToTier(game.id, nextTier)}
                  onDragStart={(event) => onDragStart(event, game)}
                  onDragEnd={onDragEnd}
                />
                {index < games.length - 1 && (index + 1) % 2 === 0 && renderProtrudingShelf("sm:hidden")}
                {index < games.length - 1 && (index + 1) % 3 === 0 && renderProtrudingShelf("hidden sm:block xl:hidden")}
                {index < games.length - 1 && (index + 1) % 5 === 0 && renderProtrudingShelf("hidden xl:block")}
              </Fragment>
            ))}
            {games.length === 0 && (
              <p className="absolute inset-0 flex items-center justify-center px-3 text-center font-mono text-[10px] uppercase tracking-wider text-shelf-paper/45">
                Empty bay — move a game in.
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-[-10px] z-20 h-4 rounded-b-sm border-t border-shelf-woodLight/70 bg-[linear-gradient(180deg,#8a6243,#62442e_45%,#3a271c)] shadow-[0_5px_8px_rgba(0,0,0,0.48)]" />
    </div>
  );
}
