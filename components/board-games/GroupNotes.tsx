"use client";

export default function GroupNotes({ notes, onChange }: { notes: string; onChange: (notes: string) => void }) {
  return (
    <section className="rounded-2xl border border-shelf-brass/40 bg-shelf-walnut/70 p-5 shadow-[0_10px_20px_rgba(38,24,15,0.25)]">
      <label htmlFor="board-game-notes" className="font-mono text-[10px] uppercase tracking-widest text-shelf-brass">
        group notes
      </label>
      <textarea
        id="board-game-notes"
        value={notes}
        onChange={(event) => onChange(event.target.value)}
        rows={7}
        placeholder="Next game night... house rules... controversial opinions..."
        className="mt-3 w-full resize-y rounded-lg border border-shelf-paper/15 bg-shelf-wood/60 px-3 py-3 text-sm leading-relaxed text-shelf-paper placeholder:text-shelf-paper/60"
      />
      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-shelf-paper/65">saved locally</p>
    </section>
  );
}
