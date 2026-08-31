import Link from "next/link";
import type { DleGame } from "@/lib/dleGames";

const statusColor = {
  PLANNING: "text-pinGold",
  "IN DEVELOPMENT": "text-pinTeal",
  LIVE: "text-pinRed",
} as const;

export default function DleGameShell({ game }: { game: DleGame }) {
  const isLive = game.status === "LIVE";

  return (
    <div>
      <Link href="/dle" className="mb-6 inline-block font-mono text-xs uppercase tracking-widest text-cream/50 hover:text-pinGold">
        &larr; All DLE games
      </Link>

      <section className="mx-auto max-w-3xl" aria-labelledby="dle-game-heading">
        <div className="relative overflow-hidden rounded-lg border border-cream/15 bg-wall2/80 shadow-[0_18px_34px_-16px_rgba(0,0,0,0.75)]">
          <div className="h-1 bg-pinGold" aria-hidden />
          <div className="p-6 sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cream/45">{game.world} / daily character file</p>
                <h1 id="dle-game-heading" className="mt-2 font-display text-4xl italic text-cream sm:text-5xl">{game.title}</h1>
              </div>
              <span className={`font-mono text-[10px] uppercase tracking-widest ${statusColor[game.status]}`}>
                {game.status}
              </span>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              <div className="border border-cream/10 bg-wall/40 p-4">
                <p className="font-mono text-[9px] uppercase tracking-widest text-cream/45">Round</p>
                <p className="mt-2 font-display text-2xl text-cream">Daily #001</p>
              </div>
              <div className="border border-cream/10 bg-wall/40 p-4">
                <p className="font-mono text-[9px] uppercase tracking-widest text-cream/45">Clues</p>
                <p className="mt-2 font-display text-2xl text-cream">0 / 5</p>
              </div>
              <div className="border border-cream/10 bg-wall/40 p-4">
                <p className="font-mono text-[9px] uppercase tracking-widest text-cream/45">Streak</p>
                <p className="mt-2 font-display text-2xl text-cream">--</p>
              </div>
            </div>

            <div className="mt-6 border border-dashed border-pinGold/45 bg-pinGold/5 p-6 text-center sm:p-9">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-pinGold">
                {isLive ? "Today's case" : "Case file in preparation"}
              </p>
              <h2 className="mt-3 font-display text-3xl italic text-cream">
                {isLive ? "The first mystery is ready." : "The daily character game is coming soon."}
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-cream/65">
                {isLive
                  ? "Reveal clues, submit a character, and share your result with the group."
                  : "This shared shell is ready for the character pool, clue order, answer checking, and results history."}
              </p>
              <button
                type="button"
                disabled={!isLive}
                className="mt-6 min-h-11 rounded-full border border-pinGold/60 px-5 font-mono text-[10px] uppercase tracking-widest text-pinGold transition-colors hover:bg-pinGold/10 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isLive ? "Start today" : "Game not live yet"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="border-l-2 border-pinTeal/70 pl-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-pinTeal">Planned format</p>
            <p className="mt-2 text-sm leading-relaxed text-cream/65">Progressive clues, one daily answer, and a shareable result grid.</p>
          </div>
          <div className="border-l-2 border-pinGold/70 pl-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-pinGold">Built to grow</p>
            <p className="mt-2 text-sm leading-relaxed text-cream/65">Each universe has its own catalog entry while the game mechanics stay shared.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
