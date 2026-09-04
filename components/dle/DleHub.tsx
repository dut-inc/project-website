import Link from "next/link";
import { DLE_GAMES } from "@/lib/dleGames";

const statusColor = {
  PLANNING: "text-pinGold",
  "IN DEVELOPMENT": "text-pinTeal",
  LIVE: "text-pinGreen",
} as const;

export default function DleHub() {
  return (
    <section className="mx-auto mt-10 max-w-5xl" aria-labelledby="dle-games-heading">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-pinGold">daily dle games</p>
          <h2 id="dle-games-heading" className="mt-1 font-display text-3xl italic text-cream sm:text-4xl">
            Choose a dle
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream/70">
            themed dle games.
          </p>
        </div>
        <span className="border-b border-pinGold/60 pb-1 font-mono text-[10px] uppercase tracking-widest text-cream/55">
          {DLE_GAMES.length} dle games
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {DLE_GAMES.map((game) => (
          <Link
            key={game.slug}
            href={`/dle/${game.slug}`}
            className="group relative flex flex-col overflow-hidden rounded-lg border border-cream/15 bg-wall2/80 p-6 shadow-[0_12px_24px_-12px_rgba(0,0,0,0.7)] transition-transform hover:-translate-y-1"
          >
            <span
              className={`absolute inset-y-0 left-0 w-1 ${game.accent === "teal" ? "bg-pinTeal" : "bg-pinGold"}`}
              aria-hidden
            />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/45">{game.world}</p>
                <h3 className="mt-2 font-display text-2xl text-cream transition-colors group-hover:text-pinGold">
                  {game.title}
                </h3>
              </div>
              <span className={`shrink-0 font-mono text-[10px] uppercase tracking-widest ${statusColor[game.status]}`}>
                {game.status}
              </span>
            </div>
            <p className="mt-5 max-w-md flex-1 text-sm leading-relaxed text-cream/70">{game.description}</p>
            <div className="mt-7 flex items-center justify-between border-t border-cream/10 pt-4 font-mono text-[10px] uppercase tracking-widest text-cream/50">
              <span>{game.status === "LIVE" ? "Play today" : "Open case file"}</span>
              <span aria-hidden className="text-base text-pinGold transition-transform group-hover:translate-x-1">&rarr;</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 border-l-2 border-pinGold/60 pl-4 text-sm text-cream/60">
        <p className="font-mono text-[10px] uppercase tracking-widest text-pinGold">let&apos;s do the genshindle</p>
        <p className="mt-1">or the wuwadle.</p>
      </div>
    </section>
  );
}
