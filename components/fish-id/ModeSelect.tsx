import Link from "next/link";
import { QUIZ_MODES, quizHref } from "@/lib/fishId/modes";
import { SPECIES_SETS, type SpeciesSet } from "@/lib/fishId/sets";
import { SPECIES } from "@/lib/fishId/species";
import type { Fish } from "@/lib/fishId/types";
import BestStreak from "./BestStreak";
import Water from "./Water";

// The quiz's front page: a choice of species set, the set at a glance, and
// the four modes as a contents list.
export default function ModeSelect({ set, pool }: { set: SpeciesSet; pool: readonly Fish[] }) {
  const families = new Set(pool.map((fish) => fish.family).filter(Boolean)).size;
  const stats = [
    ["Species", pool.length],
    ["Families", families],
  ] as const;

  return (
    <>
      <Water />

      <nav aria-label="Species sets" className="flex flex-wrap gap-x-8 gap-y-2 border-b border-fid-foam/15">
        {SPECIES_SETS.map((s) => {
          const active = s.id === set.id;
          const count = SPECIES.filter((fish) => fish.sets.includes(s.id)).length;
          return (
            <Link
              key={s.id}
              href={quizHref(s)}
              aria-current={active ? "page" : undefined}
              className={`-mb-px border-b-2 pb-3 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
                active ? "border-fid-sand text-fid-sand" : "border-transparent text-fid-mist/70 hover:text-fid-white"
              }`}
            >
              {s.title} <span className={active ? "text-fid-sand/60" : "text-fid-mist/45"}>· {count.toLocaleString("en-US")}</span>
            </Link>
          );
        })}
      </nav>

      <section className="grid gap-8 border-b border-fid-foam/15 pb-10 pt-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fid-foam/80">A field guide in four parts</p>
          <p className="mt-4 max-w-2xl font-fidserif text-[clamp(1.55rem,3.2vw,2.2rem)] leading-[1.25] text-fid-white">
            {pool.length.toLocaleString("en-US")} fishes, {set.lede}
          </p>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-fid-mist">
            Name as many as you can in a row. One wrong answer ends the run.
          </p>
        </div>
        <dl className="flex gap-8 md:gap-10">
          {stats.map(([term, value]) => (
            <div key={term}>
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-fid-mist/70">{term}</dt>
              <dd className="m-0 mt-1 font-fidserif text-4xl tabular-nums text-fid-sand">{value.toLocaleString("en-US")}</dd>
            </div>
          ))}
        </dl>
      </section>

      <nav aria-label="Quiz modes" className="mt-2">
        <ol>
          {QUIZ_MODES.map((mode) => (
            <li key={mode.id} className="border-b border-fid-foam/15">
              <Link
                href={quizHref(set, mode)}
                className="group grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-baseline gap-x-4 px-1 py-6 transition-colors hover:bg-fid-foam/[0.05] sm:grid-cols-[4rem_minmax(0,1fr)_8rem_auto] sm:px-3"
              >
                <span className="font-fidserif text-2xl text-fid-foam/80 sm:text-3xl">{mode.numeral}</span>
                <span>
                  <span className="block font-fidserif text-[1.45rem] leading-tight text-fid-white sm:text-[1.65rem]">{mode.title}</span>
                  <span className="mt-1 block text-[14px] leading-relaxed text-fid-mist">{mode.summary}</span>
                  <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-fid-mist/65 empty:hidden sm:hidden">
                    <BestStreak setId={set.id} modeId={mode.id} />
                  </span>
                </span>
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-fid-mist/65 sm:block">
                  <BestStreak setId={set.id} modeId={mode.id} />
                </span>
                <span
                  aria-hidden
                  className="font-mono text-sm text-fid-sand/60 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-fid-sand motion-reduce:transition-none"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <p className="mt-14 max-w-2xl border-t border-fid-foam/15 pt-4 text-[13px] leading-relaxed text-fid-mist/75">
        Names, families and most photographs come from{" "}
        <a href="https://www.inaturalist.org" target="_blank" rel="noopener noreferrer" className="underline decoration-fid-foam/30 underline-offset-2 hover:text-fid-sand">
          iNaturalist
        </a>{" "}
        and its observers; species notes from Wikipedia. Every photograph is credited beneath it during the quiz and links
        to its source once the plate is answered.
      </p>
    </>
  );
}
