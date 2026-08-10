"use client";

import { useState } from "react";
import type { BoardGameEntry } from "@/lib/boardGames";

type NewGame = Omit<BoardGameEntry, "id">;

type AddGameFormProps = {
  onAdd: (game: NewGame) => Promise<void> | void;
  disabled?: boolean;
};

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
    <section className="relative overflow-hidden rounded-lg border border-shelf-paperDark/75 bg-shelf-paper p-5 text-shelf-ink shadow-[0_10px_20px_rgba(38,24,15,0.3)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-shelf-ochre" />
      <p className="font-mono text-[10px] uppercase tracking-widest text-shelf-ink/70">add to the shelf</p>
      <h2 className="mt-1 font-display text-2xl italic">Put one on the table</h2>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block font-mono text-[10px] uppercase tracking-wider text-shelf-ink/75" htmlFor="new-game-name">
          Game name
        </label>
        <input
          id="new-game-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Cascadia"
          disabled={disabled}
          className="w-full rounded-md border border-shelf-paperDark/70 bg-white/35 px-3 py-2.5 text-sm text-shelf-ink placeholder:text-shelf-ink/70 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <label className="block font-mono text-[10px] uppercase tracking-wider text-shelf-ink/75" htmlFor="new-game-description">
          One-line take <span className="normal-case tracking-normal opacity-60">(optional)</span>
        </label>
        <textarea
          id="new-game-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          placeholder="Why does it belong here?"
          disabled={disabled}
          className="w-full resize-y rounded-md border border-shelf-paperDark/70 bg-white/35 px-3 py-2.5 text-sm text-shelf-ink placeholder:text-shelf-ink/70 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button type="submit" disabled={disabled || isAdding} className="min-h-11 w-full rounded-full bg-shelf-walnut px-4 font-mono text-[11px] uppercase tracking-widest text-shelf-paper transition-transform hover:-translate-y-0.5 hover:bg-shelf-wood disabled:cursor-not-allowed disabled:opacity-60">
          {disabled ? "Unlock to add games" : isAdding ? "Adding…" : "Add Joker game"}
        </button>
      </form>
    </section>
  );
}
