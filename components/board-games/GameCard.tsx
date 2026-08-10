"use client";

import { useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { GAME_TIERS, type BoardGameEntry, type CardSuit, type GameDetailsUpdate, type GameTier } from "@/lib/boardGames";
import GameDetailsPopup from "./GameDetailsPopup";

export type GameCardProps = {
  game: BoardGameEntry;
  tierColor: string;
  suit: CardSuit;
  isDragging: boolean;
  isEditable: boolean;
  onSave: (updates: GameDetailsUpdate) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  onMoveToTier: (tier: GameTier) => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
};

const suitGlyph: Record<CardSuit, string> = {
  diamond: "♦",
  club: "♣",
  heart: "♥",
  spade: "♠",
};

const suitLabel: Record<CardSuit, string> = {
  diamond: "diamond",
  club: "club",
  heart: "heart",
  spade: "spade",
};

const redSuits = new Set<CardSuit>(["diamond", "heart"]);

export default function GameCard({
  game,
  tierColor,
  suit,
  isDragging,
  isEditable,
  onSave,
  onDelete,
  onMoveToTier,
  onDragStart,
  onDragEnd,
}: GameCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const detailsTriggerRef = useRef<HTMLButtonElement>(null);
  const glyph = suitGlyph[suit];
  const suitColor = redSuits.has(suit) ? "#9f302f" : "#29201c";

  function closeDetails() {
    setIsDetailsOpen(false);
    window.requestAnimationFrame(() => detailsTriggerRef.current?.focus());
  }

  function handleDragStart(event: DragEvent<HTMLElement>) {
    const card = event.currentTarget.closest("article");
    if (card) {
      const rect = card.getBoundingClientRect();
      const preview = card.cloneNode(true) as HTMLElement;
      preview.style.position = "fixed";
      preview.style.left = "-10000px";
      preview.style.top = "-10000px";
      preview.style.width = `${rect.width}px`;
      preview.style.height = `${rect.height}px`;
      preview.style.pointerEvents = "none";
      preview.style.opacity = "1";
      preview.style.transform = "none";
      document.body.appendChild(preview);
      event.dataTransfer.setDragImage(
        preview,
        Math.max(0, event.clientX - rect.left),
        Math.max(0, event.clientY - rect.top),
      );
      window.setTimeout(() => preview.remove(), 0);
    }

    onDragStart(event);
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget || !isEditable || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
    const currentIndex = GAME_TIERS.indexOf(game.tier);
    const nextIndex = currentIndex + (event.key === "ArrowUp" ? -1 : 1);
    if (nextIndex < 0 || nextIndex >= GAME_TIERS.length) return;
    event.preventDefault();
    void Promise.resolve(onMoveToTier(GAME_TIERS[nextIndex])).catch(() => undefined);
  }

  return (
    <>
      <article
        draggable={isEditable}
        onDragStart={isEditable ? handleDragStart : undefined}
        onDragEnd={isEditable ? onDragEnd : undefined}
        onKeyDown={handleCardKeyDown}
        tabIndex={isEditable ? 0 : undefined}
        aria-grabbed={isEditable ? isDragging : undefined}
        aria-keyshortcuts={isEditable ? "ArrowUp ArrowDown" : undefined}
        aria-label={`${game.name}. ${suitLabel[suit]} playing card. ${isEditable ? "Drag the whole card to move it between tiers, or use the arrow keys." : "View details; developer controls are locked."}`}
        title={isEditable ? "Drag the whole card · Arrow keys to move" : "Unlock developer controls to move this game"}
        className={`group relative block aspect-[5/7] min-w-0 self-end overflow-hidden rounded-[0.8rem] border-2 bg-[#f4ead6] text-[#29201c] shadow-[0_5px_0_-2px_rgba(38,24,15,0.85),0_9px_14px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.72)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_0_-2px_rgba(38,24,15,0.85),0_13px_18px_rgba(0,0,0,0.48),inset_0_0_0_1px_rgba(255,255,255,0.82)] ${
          isDragging ? "scale-[0.98] opacity-40" : ""
        } ${isEditable ? "cursor-grab active:cursor-grabbing" : ""}`}
        style={{ borderColor: `${tierColor}b8` }}
      >
        <div className="relative h-full min-w-0 px-2 py-2 sm:px-2.5">
          <span className="pointer-events-none absolute inset-x-2 bottom-0 h-px bg-[#8d765a]/50" aria-hidden />
          <span className="absolute left-1.5 top-1 font-serif text-base leading-none" style={{ color: suitColor }} aria-hidden>
            {glyph}
          </span>
          <button
            ref={detailsTriggerRef}
            type="button"
            onClick={() => setIsDetailsOpen(true)}
            className="block min-w-0 px-2 pt-2 text-left"
            aria-label={`View details for ${game.name}`}
          >
            <span className="block truncate text-center font-display text-[0.95rem] italic font-semibold leading-tight text-[#29201c] sm:text-base" title={game.name}>
              {game.name}
            </span>
            <span className="mt-1 block min-h-[6rem] overflow-hidden text-[11px] leading-tight text-[#5f5142] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {game.description || "No description yet."}
            </span>
          </button>
          <span className="absolute bottom-1 right-1.5 rotate-180 font-serif text-base leading-none" style={{ color: suitColor }} aria-hidden>
            {glyph}
          </span>
        </div>
      </article>
      {isDetailsOpen && (
        <GameDetailsPopup
          game={game}
          onClose={closeDetails}
          canEdit={isEditable}
          onSave={async (updates) => {
            await onSave(updates);
            closeDetails();
          }}
          onDelete={async () => {
            await onDelete();
            setIsDetailsOpen(false);
          }}
        />
      )}
    </>
  );
}
