import Link from "next/link";
import CaseHeader from "@/components/CaseHeader";
import { DLE_GAMES } from "@/lib/dleGames";
import { getProject } from "@/lib/projects";

export default function DlePage() {
  const project = getProject("dle");

  return (
    <div>
      <CaseHeader
        caseNumber={project.case}
        title={project.title}
        status={project.status}
        pin={project.pin}
        paper={project.paper}
        rotation={project.rotation}
        description={project.summary}
      />
      <section className="mx-auto mt-10 max-w-3xl" aria-labelledby="dle-games-heading">
        <div className="mb-6">
          <h2 id="dle-games-heading" className="font-display text-3xl italic text-cream sm:text-4xl">
            Choose a dle
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {DLE_GAMES.map((game) => {
            const isLive = game.status === "LIVE";

            if (isLive) {
              return (
                <Link
                  key={game.slug}
                  href={`/dle/${game.slug}`}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-pinGreen/50 hover:bg-white/[0.06]"
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest text-pinGreen/80">
                    {game.world} · Live
                  </span>
                  <h2 className="mt-2 font-display text-xl text-cream transition-colors group-hover:text-white">
                    {game.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-cream/55">{game.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-cream/40 transition-colors group-hover:text-pinGreen">
                    Open <span aria-hidden>→</span>
                  </span>
                </Link>
              );
            }

            return (
              <div
                key={game.slug}
                aria-disabled="true"
                className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/[0.03] p-5 opacity-55"
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-pinGold/70">
                  {game.world} · Not started
                </span>
                <h2 className="mt-2 font-display text-xl text-cream/70">{game.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-cream/40">{game.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-cream/30">
                  Coming soon
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}