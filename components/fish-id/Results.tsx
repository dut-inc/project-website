"use client";

import Image from "next/image";
import Link from "next/link";
import type { RefObject } from "react";
import { verdictOf, type Entry, type Summary } from "@/lib/fishId/engine";
import { quizHref, type QuizMode } from "@/lib/fishId/modes";
import type { SpeciesSet } from "@/lib/fishId/sets";
import FishName from "./FishName";
import { buttonClass } from "./buttons";
import { isRemote, thumbSrc } from "./photo";

// End of a run: the streak, how it compares with this browser's best, what
// ended it, and a field log of every plate to learn from.
export default function Results({
  headingRef,
  set,
  mode,
  log,
  summary,
  best,
  newBest,
  onRestart,
}: {
  headingRef: RefObject<HTMLHeadingElement>;
  set: SpeciesSet;
  mode: QuizMode;
  log: Entry[];
  summary: Summary;
  best: number | null;
  newBest: boolean;
  onRestart: () => void;
}) {
  const last = log[log.length - 1];
  const missed = last && verdictOf(last.question, last.outcome) === "wrong" ? last : null;

  return (
    <section aria-labelledby="fid-results" className="mt-10">
      <div className="grid gap-8 border-b border-fid-foam/15 pb-10 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fid-foam/80">
            {newBest ? <span className="text-fid-sand">New best</span> : "Run over"}
            {!newBest && best ? <span className="text-fid-mist/60"> · Your best is {best}</span> : null}
          </p>
          <h2 id="fid-results" ref={headingRef} tabIndex={-1} className="mt-3 font-fidserif leading-none text-fid-white outline-none">
            <span className="text-[clamp(4rem,12vw,6.5rem)] tabular-nums">{summary.streak}</span>
            <span className="ml-3 text-[clamp(1.5rem,4vw,2.25rem)] italic text-fid-mist">in a row</span>
          </h2>
          {missed && typeof missed.outcome === "number" && (
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-fid-mist">
              Ended on plate {log.length}: <span className="text-fid-white">{missed.question.fish.commonName}</span>{" "}
              <FishName field="scientificName" className="font-fidserif text-fid-sand">
                {missed.question.fish.scientificName}
              </FishName>
              , answered as{" "}
              <FishName field={missed.question.answer} className="font-fidserif text-fid-coral">
                {missed.question.choices[missed.outcome].label}
              </FishName>
              .
            </p>
          )}
          {summary.skipped > 0 && (
            <p className="mt-3 text-[14px] text-fid-mist/80">
              {summary.skipped} {summary.skipped === 1 ? "plate was" : "plates were"} skipped because a photograph failed to
              load, and {summary.skipped === 1 ? "doesn’t" : "don’t"} count.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onRestart} className={buttonClass("primary")}>
            New run
          </button>
          <Link href={quizHref(set)} className={buttonClass("quiet")}>
            Choose another mode
          </Link>
        </div>
      </div>

      <table className="mt-8 w-full border-collapse text-left">
        <caption className="mb-3 text-left font-mono text-[11px] uppercase tracking-[0.2em] text-fid-foam/80">
          Field log <span className="text-fid-mist/50">· {set.title} · {mode.title}</span>
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Plate</th>
            <th scope="col">Species</th>
            <th scope="col">Your answer</th>
          </tr>
        </thead>
        <tbody>
          {log.map(({ question: q, outcome }, i) => {
            const verdict = verdictOf(q, outcome);
            const given = typeof outcome === "number" ? q.choices[outcome].label : null;
            const image = q.fish.image;
            return (
              <tr key={i} className="border-t border-fid-foam/12 align-top">
                <td className="w-12 py-4 pr-3 font-mono text-[11px] tracking-[0.12em] text-fid-foam/70">
                  {String(i + 1).padStart(2, "0")}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-start gap-4">
                    <div className="relative hidden aspect-[3/2] w-20 shrink-0 border border-fid-foam/15 bg-fid-abyss/70 sm:block">
                      {image ? (
                        <Image src={thumbSrc(image)} unoptimized={isRemote(image.src)} alt="" fill sizes="80px" className="object-cover" />
                      ) : (
                        <div className="fid-vacant absolute inset-0" />
                      )}
                    </div>
                    <div>
                      <p className="font-fidserif text-lg leading-snug text-fid-white">{q.fish.commonName}</p>
                      <FishName field="scientificName" className="font-fidserif text-[15px] text-fid-sand/85">
                        {q.fish.scientificName}
                      </FishName>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-right sm:text-left">
                  <p
                    className={`font-mono text-[10px] uppercase tracking-[0.16em] ${
                      verdict === "correct" ? "text-fid-foam" : verdict === "wrong" ? "text-fid-coral" : "text-fid-mist/70"
                    }`}
                  >
                    {verdict === "correct" ? "Correct" : verdict === "wrong" ? "Incorrect" : "Skipped"}
                  </p>
                  {verdict === "wrong" && given && (
                    <FishName field={q.answer} className="mt-1 block font-fidserif text-[15px] text-fid-mist">
                      {given}
                    </FishName>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
