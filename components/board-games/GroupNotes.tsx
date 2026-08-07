"use client";

export default function GroupNotes({ notes, onChange }: { notes: string; onChange: (notes: string) => void }) {
  return (
    <section className="relative overflow-hidden rounded-lg border border-shelf-woodLight/70 bg-shelf-wood p-5 text-shelf-paper shadow-[0_10px_20px_rgba(38,24,15,0.3),inset_0_1px_rgba(232,220,196,0.12)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-shelf-brass/60" />
      <label htmlFor="board-game-notes" className="font-mono text-[10px] uppercase tracking-widest text-shelf-brass">
        shelf notes
      </label>
      <h2 className="mt-1 font-display text-2xl italic text-shelf-paper">Leave a note</h2>
      <textarea
        id="board-game-notes"
        value={notes}
        onChange={(event) => onChange(event.target.value)}
        rows={7}
        placeholder="Next game night... house rules... controversial opinions..."
        className="mt-3 w-full resize-y rounded-md border border-shelf-paper/20 bg-shelf-walnut/55 px-3 py-3 text-sm leading-relaxed text-shelf-paper placeholder:text-shelf-paper/55 focus:border-shelf-brass"
      />
      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-shelf-paper/60">saved locally on this shelf</p>
    </section>
  );
}
