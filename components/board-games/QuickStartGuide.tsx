"use client";

import { useState } from "react";

export default function QuickStartGuide() {
  const [showGuide, setShowGuide] = useState(true);

  return (
    <section className="rounded-2xl border border-shelf-brass/35 bg-shelf-wood/70 p-5 shadow-[0_12px_28px_rgba(38,24,15,0.25),inset_0_1px_rgba(232,220,196,0.08)] sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-shelf-brass">
            quick start / 01
          </p>
          <h2 className="mt-2 font-display text-3xl italic text-shelf-paper">Make your case.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-shelf-paper/75">
            A shared ranking for the games on the shelf. Everything saves in this browser, so
            rearrange freely and leave the next player a note.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowGuide((open) => !open)}
          aria-expanded={showGuide}
          className="min-h-11 shrink-0 rounded-full border border-shelf-brass/60 px-4 font-mono text-[11px] uppercase tracking-widest text-shelf-paper transition-colors hover:bg-shelf-brass/20"
        >
          {showGuide ? "Hide guide" : "Show guide"}
        </button>
      </div>

      {showGuide && (
        <ol className="mt-6 grid gap-3 border-t border-shelf-paper/15 pt-5 text-sm text-shelf-paper/75 sm:grid-cols-3">
          <li className="flex gap-3">
            <span className="font-mono text-shelf-brass">01</span>
            <span><strong className="font-medium text-shelf-paper">Add a game</strong> below, or start with the examples.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-shelf-brass">02</span>
            <span><strong className="font-medium text-shelf-paper">View the card</strong> to read its rules and notes, then edit from the popup.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-shelf-brass">03</span>
            <span><strong className="font-medium text-shelf-paper">Drag the right side</strong> of a card into a tier. Focus it and use the arrow keys for keyboard movement.</span>
          </li>
        </ol>
      )}
    </section>
  );
}
