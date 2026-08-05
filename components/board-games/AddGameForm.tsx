"use client";

import { useState } from "react";
import { makeBoardGameId } from "@/lib/boardGameStorage";
import type { BoardGameEntry } from "@/lib/boardGames";

export default function AddGameForm({ onAdd }: { onAdd: (game: BoardGameEntry) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    onAdd({
      id: makeBoardGameId(),
      name: trimmedName,
      description: description.trim() || "Add a memorable detail later.",
      houseRules: "",
      fullRules: "",
      quickNotes: "",
      tier: "Unranked",
    });
    setName("");
    setDescription("");
  }

  return (
    <section className="paper-torn bg-shelf-paper p-5 text-shelf-ink shadow-[0_10px_20px_rgba(38,24,15,0.25)]">
      <p className="font-mono text-[10px] uppercase tracking-widest text-shelf-ink/75">new entry</p>
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
          className="w-full rounded-lg border border-shelf-paperDark/60 bg-white/35 px-3 py-2.5 text-sm text-shelf-ink placeholder:text-shelf-ink/70"
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
          className="w-full resize-y rounded-lg border border-shelf-paperDark/60 bg-white/35 px-3 py-2.5 text-sm text-shelf-ink placeholder:text-shelf-ink/70"
        />
        <button type="submit" className="min-h-11 w-full rounded-full bg-shelf-walnut px-4 font-mono text-[11px] uppercase tracking-widest text-shelf-paper transition-transform hover:-translate-y-0.5 hover:bg-shelf-wood">
          Add unranked game
        </button>
      </form>
    </section>
  );
}
