"use client";

import { useRef, useState, type DragEvent } from "react";
import { GAME_TIERS, type BoardGameEntry, type GameDetailsUpdate, type GameTier } from "@/lib/boardGames";
import GameDetailsPopup from "./GameDetailsPopup";

export type GameCardProps = {
  game: BoardGameEntry;
  isDragging: boolean;
  isEditable: boolean;
  onSave: (updates: GameDetailsUpdate) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  onMoveToTier: (tier: GameTier) => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
};

export default function GameCard({
  game,
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

  function closeDetails() {
    setIsDetailsOpen(false);
    window.requestAnimationFrame(() => detailsTriggerRef.current?.focus());
  }

  function handleDragStart(event: DragEvent<HTMLButtonElement>) {
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

  function handleDragZoneKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!isEditable || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
    const currentIndex = GAME_TIERS.indexOf(game.tier);
    const nextIndex = currentIndex + (event.key === "ArrowUp" ? -1 : 1);
    if (nextIndex < 0 || nextIndex >= GAME_TIERS.length) return;
    event.preventDefault();
    void Promise.resolve(onMoveToTier(GAME_TIERS[nextIndex])).catch(() => undefined);
  }

  return (
    <>
      <article
        aria-label={`${game.name}. ${isEditable ? "Use the right side to move it between tiers." : "View details; developer controls are locked."}`}
        className={`group relative mb-2 grid min-w-0 grid-cols-[minmax(0,1fr)_1.5rem] items-stretch overflow-hidden rounded-sm border border-shelf-paperDark/80 bg-shelf-paper shadow-[0_4px_0_-3px_rgba(38,24,15,0.9),0_7px_10px_rgba(0,0,0,0.38),inset_0_1px_rgba(255,255,255,0.32)] transition-all hover:border-shelf-brass hover:shadow-[0_4px_0_-3px_rgba(38,24,15,0.9),0_10px_14px_rgba(0,0,0,0.46),inset_0_1px_rgba(255,255,255,0.38)] ${
          isDragging ? "scale-[0.98] opacity-40" : ""
        }`}
      >
        <div className="relative min-w-0 border-l-4 border-shelf-ochre px-2 py-1 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-shelf-paper/45">
          <span className="pointer-events-none absolute inset-x-2 bottom-0 h-px bg-shelf-paperDark/80" aria-hidden />
          <button
            ref={detailsTriggerRef}
            type="button"
            onClick={() => setIsDetailsOpen(true)}
            className="block min-w-0 text-left"
            aria-label={`View details for ${game.name}`}
          >
            <span className="block truncate font-body text-sm font-semibold leading-tight text-shelf-ink" title={game.name}>
              {game.name}
            </span>
            <span className="mt-1 block min-h-[4rem] overflow-hidden text-[11px] leading-tight text-shelf-ink/70 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:1]">
              {game.description || "No description yet."}
            </span>
          </button>
        </div>
        <button
          type="button"
          draggable={isEditable}
          onDragStart={isEditable ? handleDragStart : undefined}
          onDragEnd={isEditable ? onDragEnd : undefined}
          onKeyDown={handleDragZoneKeyDown}
          aria-grabbed={isEditable ? isDragging : undefined}
          aria-keyshortcuts={isEditable ? "ArrowUp ArrowDown" : undefined}
          aria-label={isEditable ? `Drag ${game.name} to another tier, or use the arrow keys to move it` : `Developer controls are locked for ${game.name}`}
          title={isEditable ? "Drag this area to another tier · Arrow keys to move" : "Unlock developer controls to move this game"}
          className={`flex min-h-[5.5rem] min-w-0 items-center justify-center border-l border-shelf-paperDark/65 bg-shelf-paperDark/25 px-0.5 font-mono text-sm leading-none text-shelf-ink/55 transition-colors focus-visible:bg-shelf-brass/25 focus-visible:text-shelf-walnut ${isEditable ? "cursor-grab hover:bg-shelf-brass/20 active:cursor-grabbing" : "cursor-not-allowed opacity-45"}`}
        >
          <span aria-hidden className="tracking-[-0.2em]">⋮⋮</span>
        </button>
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
