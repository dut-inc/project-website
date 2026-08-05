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
    <section className="paper-torn bg-cream p-5 text-ink shadow-[0_14px_28px_-8px_rgba(0,0,0,0.45)]">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink2">new entry</p>
      <h2 className="mt-1 font-display text-2xl italic">Put one on the table</h2>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block font-mono text-[10px] uppercase tracking-wider text-ink2" htmlFor="new-game-name">
          Game name
        </label>
        <input
          id="new-game-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Cascadia"
          className="w-full rounded-lg border border-ink/20 bg-white/40 px-3 py-2.5 text-sm text-ink placeholder:text-ink2/60"
        />
        <label className="block font-mono text-[10px] uppercase tracking-wider text-ink2" htmlFor="new-game-description">
          One-line take <span className="normal-case tracking-normal opacity-60">(optional)</span>
        </label>
        <textarea
          id="new-game-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          placeholder="Why does it belong here?"
          className="w-full resize-y rounded-lg border border-ink/20 bg-white/40 px-3 py-2.5 text-sm text-ink placeholder:text-ink2/60"
        />
        <button type="submit" className="min-h-11 w-full rounded-full bg-pinTeal px-4 font-mono text-[11px] uppercase tracking-widest text-cream transition-transform hover:-translate-y-0.5 hover:bg-[#3A9284]">
          Add unranked game
        </button>
      </form>
    </section>
  );
}
