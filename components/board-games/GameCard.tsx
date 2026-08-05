"use client";

import { useRef, useState, type DragEvent } from "react";
import { GAME_TIERS, type BoardGameEntry, type GameTier } from "@/lib/boardGames";
import GameDetailsPopup from "./GameDetailsPopup";

export type GameCardProps = {
  game: BoardGameEntry;
  isDragging: boolean;
  onSave: (updates: Pick<BoardGameEntry, "name" | "description">) => void;
  onDelete: () => void;
  onMoveToTier: (tier: GameTier) => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
};

export default function GameCard({
  game,
  isDragging,
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
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    const currentIndex = GAME_TIERS.indexOf(game.tier);
    const nextIndex = currentIndex + (event.key === "ArrowUp" ? -1 : 1);
    if (nextIndex < 0 || nextIndex >= GAME_TIERS.length) return;
    event.preventDefault();
    onMoveToTier(GAME_TIERS[nextIndex]);
  }

  return (
    <>
      <article
        aria-label={`${game.name}. Use the right side to move it between tiers.`}
        className={`group relative grid min-w-0 grid-cols-[7fr_1fr] items-stretch overflow-hidden rounded-lg border border-shelf-paperDark/30 bg-shelf-paper shadow-[0_4px_9px_rgba(38,24,15,0.2)] transition-all hover:-translate-y-0.5 hover:border-shelf-brass hover:shadow-[0_8px_14px_rgba(38,24,15,0.28)] ${
          isDragging ? "scale-[0.98] opacity-40" : ""
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-col p-3">
          <button
            ref={detailsTriggerRef}
            type="button"
            onClick={() => setIsDetailsOpen(true)}
            className="min-w-0 text-left"
            aria-label={`View details for ${game.name}`}
          >
            <h3 className="truncate font-body text-sm font-semibold text-shelf-ink" title={game.name}>{game.name}</h3>
            <p className="mt-1 min-h-10 text-xs leading-relaxed text-shelf-ink/70">{game.description}</p>
            <span className="mt-2 inline-block font-mono text-[10px] uppercase tracking-wider text-shelf-ink/70 transition-colors group-hover:text-shelf-brass">
              View details →
            </span>
          </button>
        </div>
        <button
          type="button"
          draggable
          onDragStart={handleDragStart}
          onDragEnd={onDragEnd}
          onKeyDown={handleDragZoneKeyDown}
          aria-grabbed={isDragging}
          aria-keyshortcuts="ArrowUp ArrowDown"
          aria-label={`Drag ${game.name} to another tier, or use the arrow keys to move it`}
          title="Drag this area to another tier · Arrow keys to move"
          className="flex min-h-[5.5rem] min-w-0 cursor-grab items-center justify-center border-l border-shelf-paperDark/45 px-2 py-3 font-mono text-lg leading-none text-shelf-ink/60 transition-colors hover:bg-shelf-paperDark/25 hover:text-shelf-brass focus-visible:bg-shelf-paperDark/35 focus-visible:text-shelf-brass active:cursor-grabbing"
        >
          <span aria-hidden>⋮⋮</span>
        </button>
      </article>
      {isDetailsOpen && (
        <GameDetailsPopup
          game={game}
          onClose={closeDetails}
          onSave={(updates) => {
            onSave(updates);
            closeDetails();
          }}
          onDelete={() => {
            onDelete();
            setIsDetailsOpen(false);
          }}
        />
      )}
    </>
  );
}
