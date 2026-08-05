"use client";

export default function GroupNotes({ notes, onChange }: { notes: string; onChange: (notes: string) => void }) {
  return (
    <section className="rounded-2xl border border-pinGold/25 bg-pinGold/[0.08] p-5">
      <label htmlFor="board-game-notes" className="font-mono text-[10px] uppercase tracking-widest text-pinGold">
        group notes
      </label>
      <textarea
        id="board-game-notes"
        value={notes}
        onChange={(event) => onChange(event.target.value)}
        rows={7}
        placeholder="Next game night... house rules... controversial opinions..."
        className="mt-3 w-full resize-y rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm leading-relaxed text-cream placeholder:text-cream/35"
      />
      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-cream/40">saved locally</p>
    </section>
  );
}
