"use client";

import { useState } from "react";
import type { BoardGameEntry } from "@/lib/boardGames";

type NewGame = Omit<BoardGameEntry, "id">;

type AddGameFormProps = {
  onAdd: (game: NewGame) => Promise<void> | void;
  disabled?: boolean;
};

const deckCards = [
  { label: "draw", color: "navy" },
  { label: "deal", color: "red" },
  { label: "play", color: "navy" },
] as const;

export default function AddGameForm({ onAdd, disabled = false }: AddGameFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || isAdding || disabled) return;

    setIsAdding(true);
    try {
      await onAdd({
        name: trimmedName,
        description: description.trim(),
        houseRules: "",
        fullRules: "",
        quickNotes: "",
        tier: "Unranked",
      });
      setName("");
      setDescription("");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <section aria-labelledby="add-to-shelf-title" className="relative isolate overflow-visible pb-2">
      {deckCards.map((card, index) => (
        <div
          key={card.label}
          aria-hidden
          className={`pointer-events-none absolute inset-x-2 inset-y-2 rounded-[1.1rem] bg-[#f4ead6] p-2 shadow-[0_8px_16px_rgba(38,24,15,0.32),inset_0_0_0_1px_rgba(38,24,15,0.15)] ${
            index === 0
              ? "-rotate-6 translate-x-1"
              : index === 1
                ? "rotate-4 translate-x-1"
                : "rotate-1"
          }`}
        >
          <div
            className={`flex h-full w-full items-center justify-center rounded-lg border border-black/20 ${
              card.color === "navy" ? "bg-[#1e2b45]" : "bg-[#7d1f1f]"
            } bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(255,255,255,0.08)_6px,rgba(255,255,255,0.08)_7px),repeating-linear-gradient(-45deg,transparent,transparent_6px,rgba(255,255,255,0.08)_6px,rgba(255,255,255,0.08)_7px)]`}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-[1.5px] border-white/15 bg-black/10">
              <div className="h-8 w-8 rotate-45 border-[1.5px] border-white/15" />
            </div>
          </div>
        </div>
      ))}

      <div className="relative z-10 overflow-hidden rounded-[1.1rem] border-2 border-[#8d765a]/70 bg-[#f4ead6] p-5 text-[#29201c] shadow-[0_8px_0_-3px_rgba(38,24,15,0.8),0_14px_24px_rgba(38,24,15,0.38),inset_0_0_0_1px_rgba(255,255,255,0.75)] sm:p-5.5">
        <span className="pointer-events-none absolute inset-x-3 top-3 h-px bg-[#8d765a]/45" aria-hidden />
        <span className="pointer-events-none absolute bottom-3 left-3 font-serif text-xl leading-none text-[#29201c]" aria-hidden>
          ♣
        </span>
        <span className="pointer-events-none absolute right-3 top-3 rotate-180 font-serif text-xl leading-none text-[#9f302f]" aria-hidden>
          ♥
        </span>

        <div className="relative flex items-start justify-between gap-3 pr-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#5f5142]">the game deck</p>
            <h2 id="add-to-shelf-title" className="mt-1 font-display text-2xl italic leading-none text-[#29201c]">
              Deal a new game
            </h2>
          </div>
          <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#8d765a]">new card</span>
        </div>

        <form onSubmit={submit} className="relative mt-5 space-y-3">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#5f5142]" htmlFor="new-game-name">
              Game name
            </label>
            <input
              id="new-game-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Cascadia"
              disabled={disabled}
              className="mt-1.5 w-full rounded-lg border border-[#8d765a]/60 bg-white/45 px-3 py-2.5 text-sm text-[#29201c] outline-none transition-shadow placeholder:text-[#5f5142]/70 focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#5f5142]" htmlFor="new-game-description">
              One-line take <span className="normal-case tracking-normal opacity-60">(optional)</span>
            </label>
            <textarea
              id="new-game-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Why does it belong here?"
              disabled={disabled}
              className="mt-1.5 w-full resize-y rounded-lg border border-[#8d765a]/60 bg-white/45 px-3 py-2.5 text-sm text-[#29201c] outline-none transition-shadow placeholder:text-[#5f5142]/70 focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={disabled || isAdding}
            className="min-h-11 w-full rounded-full bg-[#29201c] px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[#f4ead6] transition-all hover:-translate-y-0.5 hover:bg-[#5f5142] hover:shadow-[0_5px_10px_rgba(38,24,15,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a227] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {disabled ? "Unlock to add games" : isAdding ? "Dealing…" : "Deal Joker game"}
          </button>
        </form>
      </div>
    </section>
  );
}
