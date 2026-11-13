"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import { verdictOf, type Entry, type Summary } from "@/lib/fishId/engine";
import { quizHref, type QuizMode } from "@/lib/fishId/modes";
import type { SpeciesSet } from "@/lib/fishId/sets";
import { shareText } from "@/lib/fishId/share";
import FishName from "./FishName";
import { buttonClass } from "./buttons";
import { isRemote, thumbSrc } from "./photo";

// End of a run: the score, a way to send the run to friends (the code is in
// the run bar above), and a field log of every plate.
export default function Results({
  headingRef,
  set,
  mode,
  code,
  log,
  summary,
  onRestart,
}: {
  headingRef: RefObject<HTMLHeadingElement>;
  set: SpeciesSet;
  mode: QuizMode;
  code: string;
  log: Entry[];
  summary: Summary;
  onRestart: () => void;
}) {
  return (
    <section aria-labelledby="fid-results" className="mt-10">
      <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <h2 id="fid-results" ref={headingRef} tabIndex={-1} className="font-fidserif leading-none text-fid-white outline-none">
            <span className="text-[clamp(4rem,12vw,6.5rem)] tabular-nums">{summary.score}</span>
            <span className="ml-3 text-[clamp(1.5rem,4vw,2.25rem)] italic text-fid-mist">of {log.length}</span>
          </h2>
          {summary.skipped > 0 && (
            <p className="mt-3 text-[14px] text-fid-mist/80">
              {summary.skipped} {summary.skipped === 1 ? "plate was" : "plates were"} skipped because a photograph failed to
              load, and {summary.skipped === 1 ? "doesn’t" : "don’t"} score.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <CopyResults code={code} set={set} mode={mode} log={log} score={summary.score} />
          <button type="button" onClick={onRestart} className={buttonClass("quiet")}>
            New run
          </button>
          <Link href={quizHref(set)} className={buttonClass("quiet")}>
            Choose another mode
          </Link>
        </div>
      </div>

      <table className="mt-10 w-full border-collapse text-left">
        <caption className="sr-only">Field log</caption>
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
                <td className="w-12 py-4 pr-3 font-fidserif font-medium text-[13px] lining-nums tabular-nums tracking-[0.08em] text-fid-foam/70">
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
                    className={`font-fidserif font-medium lining-nums text-[12px] uppercase tracking-[0.14em] ${
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

// Copies the run as text: score, one square per plate, and a link to the same code.
// If the clipboard is unavailable, the text is shown to copy by hand.
function CopyResults(props: Omit<Parameters<typeof shareText>[0], "origin">) {
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");
  const [text, setText] = useState("");
  const manualRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (status === "manual") manualRef.current?.select();
    if (status !== "copied") return;
    const timer = window.setTimeout(() => setStatus("idle"), 2500);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function copy() {
    const value = shareText({ ...props, origin: window.location.origin });
    setText(value);
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("manual");
    }
  }

  return (
    <>
      <button type="button" onClick={copy} className={buttonClass("primary")}>
        {status === "copied" ? "Copied" : "Copy results"}
      </button>
      <span aria-live="polite" className="sr-only">
        {status === "copied" ? "Results copied to the clipboard." : ""}
      </span>
      {status === "manual" && (
        <label className="block basis-full">
          <span className="block text-[13px] text-fid-mist">Copying isn’t allowed here. Select the text and copy it:</span>
          <textarea
            ref={manualRef}
            readOnly
            value={text}
            rows={4}
            className="mt-2 w-full max-w-md rounded-[2px] border border-fid-foam/25 bg-fid-abyss/60 p-3 font-mono text-[13px] text-fid-white"
          />
        </label>
      )}
    </>
  );
}
