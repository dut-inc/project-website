import Form from "next/form";
import Link from "next/link";
import { CODE_LENGTH } from "@/lib/fishId/codes";
import { QUIZ_HREF, QUIZ_MODES, quizHref } from "@/lib/fishId/modes";
import { SPECIES_SETS, type SpeciesSet } from "@/lib/fishId/sets";
import { SPECIES } from "@/lib/fishId/species";
import BestStreak from "./BestStreak";
import { buttonClass } from "./buttons";
import Water from "./Water";

// The quiz's front page: a choice of species set, the four modes as a
// contents list, and a box for a friend's four-letter code.
export default function ModeSelect({ set, badCode }: { set: SpeciesSet; badCode?: string }) {
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
              className={`-mb-px border-b-2 pb-3 font-fidserif font-medium lining-nums text-[13px] uppercase tracking-[0.14em] transition-colors ${
                active ? "border-fid-sand text-fid-sand" : "border-transparent text-fid-mist/70 hover:text-fid-white"
              }`}
            >
              {s.title} <span className={active ? "text-fid-sand/60" : "text-fid-mist/45"}>· {count.toLocaleString("en-US")}</span>
            </Link>
          );
        })}
      </nav>


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
                  <span className="mt-2 block font-fidserif font-medium lining-nums text-[12px] uppercase tracking-[0.14em] text-fid-mist/65 empty:hidden sm:hidden">
                    <BestStreak setId={set.id} modeId={mode.id} />
                  </span>
                </span>
                <span className="hidden self-center font-fidserif font-medium lining-nums text-[12px] uppercase tracking-[0.14em] text-fid-mist/65 sm:block">
                  <BestStreak setId={set.id} modeId={mode.id} />
                </span>
                <span
                  aria-hidden
                  className="self-center font-mono text-sm text-fid-sand/60 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-fid-sand motion-reduce:transition-none"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <Form action={QUIZ_HREF} className="mt-10 flex flex-wrap items-end gap-x-4 gap-y-3">
        <label className="block">
          <span className="block font-fidserif font-medium lining-nums text-[13px] uppercase tracking-[0.14em] text-fid-foam/80">Play a friend’s code</span>
          <input
            name="code"
            required
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={CODE_LENGTH}
            placeholder="KQZT"
            aria-describedby={badCode ? "fid-bad-code" : undefined}
            className="mt-2 h-11 w-32 rounded-[2px] border border-fid-foam/25 bg-fid-abyss/60 px-3 font-fidserif font-medium lining-nums text-xl uppercase tracking-[0.22em] text-fid-white placeholder:text-fid-mist/30 focus:border-fid-sand focus:outline-none"
          />
        </label>
        <button type="submit" className={`h-11 ${buttonClass("quiet")}`}>
          Play <span aria-hidden>→</span>
        </button>
        {badCode && (
          <p id="fid-bad-code" role="alert" className="basis-full text-[14px] text-fid-coral">
            “{badCode}” isn’t a quiz code. Codes are {CODE_LENGTH} letters.
          </p>
        )}
      </Form>

      <p className="mt-14 max-w-2xl border-t border-fid-foam/15 pt-4 text-[13px] leading-relaxed text-fid-mist/75">
        Names, families and most photographs come from{" "}
        <a href="https://www.inaturalist.org" target="_blank" rel="noopener noreferrer" className="underline decoration-fid-foam/30 underline-offset-2 hover:text-fid-sand">
          iNaturalist
        </a>{" "}
        and its observers; species notes from Wikipedia.
      </p>
    </>
  );
}
