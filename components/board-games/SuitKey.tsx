"use client";

import type { Ref } from "react";
import { GAME_TYPES, GAME_TYPE_SUITS, type CardSuit, type GameType } from "@/lib/boardGames";

type SuitKeyProps = {
  selectedSuit: CardSuit | null;
  onSelect: (suit: CardSuit | null) => void;
  isEditable: boolean;
  developerAccessTriggerRef: Ref<HTMLButtonElement>;
  onOpenDeveloperAccess: () => void;
};

const suitGlyph: Record<CardSuit, string> = {
  diamond: "♦",
  club: "♣",
  heart: "♥",
  spade: "♠",
};

const suitColor: Record<CardSuit, string> = {
  diamond: "text-red-300/80",
  club: "text-shelf-paper/70",
  heart: "text-red-300/80",
  spade: "text-shelf-paper/70",
};

const suitOrder: CardSuit[] = ["diamond", "club", "heart", "spade"];

function gameTypeForSuit(suit: CardSuit): GameType {
  return GAME_TYPES.find((gameType) => GAME_TYPE_SUITS[gameType] === suit) ?? "FFA";
}

export default function SuitKey({
  selectedSuit,
  onSelect,
  isEditable,
  developerAccessTriggerRef,
  onOpenDeveloperAccess,
}: SuitKeyProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 pb-2 text-shelf-paper/50">
      <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-shelf-paper/35">
        suits
      </span>
      {suitOrder.map((suit) => {
        const gameType = gameTypeForSuit(suit);
        const isSelected = selectedSuit === suit;
        return (
          <button
            key={suit}
            type="button"
            aria-pressed={isSelected}
            aria-label={`Filter by ${gameType}, ${suit}`}
            onClick={() => onSelect(isSelected ? null : suit)}
            className={`group inline-flex items-center gap-1 border-b pb-px font-display text-xs italic leading-none transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-shelf-brass sm:text-sm ${
              isSelected
                ? "border-shelf-brass text-shelf-paper"
                : "border-transparent hover:border-shelf-paper/25 hover:text-shelf-paper/85"
            }`}
          >
            <span className={`font-serif text-base not-italic leading-none ${suitColor[suit]}`} aria-hidden>
              {suitGlyph[suit]}
            </span>
            <span>{gameType}</span>
          </button>
        );
      })}
      {selectedSuit && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="font-mono text-[8px] uppercase tracking-wider text-shelf-paper/35 transition-colors hover:text-shelf-paper/80 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-shelf-brass"
        >
          all
        </button>
      )}
      <span className="ml-auto flex items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-shelf-paper/45">
          {isEditable ? "edit mode" : "read only"}
        </span>
        <button
          ref={developerAccessTriggerRef}
          type="button"
          onClick={onOpenDeveloperAccess}
          aria-label="Open developer controls"
          title="Developer controls"
          className="flex min-h-6 min-w-6 items-center justify-center rounded-full text-[10px] tracking-[0.2em] text-shelf-paper/20 transition-colors hover:text-shelf-brass focus-visible:text-shelf-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shelf-brass"
        >
          <span aria-hidden>•••</span>
        </button>
      </span>
    </div>
  );
}
