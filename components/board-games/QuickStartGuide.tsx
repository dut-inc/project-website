"use client";

import { useState } from "react";

export default function QuickStartGuide() {
  const [showGuide, setShowGuide] = useState(true);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)] sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-pinGold">
            quick start / 01
          </p>
          <h2 className="mt-2 font-display text-3xl italic text-cream">Make your case.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream/70">
            A shared ranking for the games on the shelf. Everything saves in this browser, so
            rearrange freely and leave the next player a note.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowGuide((open) => !open)}
          aria-expanded={showGuide}
          className="min-h-11 shrink-0 rounded-full border border-pinGold/50 px-4 font-mono text-[11px] uppercase tracking-widest text-pinGold transition-colors hover:bg-pinGold/10"
        >
          {showGuide ? "Hide guide" : "Show guide"}
        </button>
      </div>

      {showGuide && (
        <ol className="mt-6 grid gap-3 border-t border-white/10 pt-5 text-sm text-cream/75 sm:grid-cols-3">
          <li className="flex gap-3">
            <span className="font-mono text-pinGold">01</span>
            <span><strong className="font-medium text-cream">Add a game</strong> below, or start with the examples.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-pinGold">02</span>
            <span><strong className="font-medium text-cream">Edit the card</strong> to capture your very specific opinion.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-pinGold">03</span>
            <span><strong className="font-medium text-cream">Drag the right side</strong> of a card into a tier. Focus that area and use the arrow keys for keyboard movement. Your changes save automatically.</span>
          </li>
        </ol>
      )}
    </section>
  );
}
