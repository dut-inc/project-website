"use client";

import Link from "next/link";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { newSeed, phaseOf, questionAt, runReducer, startRun, summarize, verdictOf } from "@/lib/fishId/engine";
import { FIELD_LABEL, quizHref, type QuizMode } from "@/lib/fishId/modes";
import type { SpeciesSet } from "@/lib/fishId/sets";
import type { Fish } from "@/lib/fishId/types";
import AnswerList, { ANSWER_KEYS } from "./AnswerList";
import FieldNote from "./FieldNote";
import Results from "./Results";
import SpecimenPlate from "./SpecimenPlate";
import Water from "./Water";
import { bestKey, recordStreak, useBestStreak } from "./streakStore";
import { buttonClass } from "./buttons";

// The streak at which the water reaches its darkest.
const FULL_DEPTH_STREAK = 30;

// One run of any mode over one species set. The engine (lib/fishId/engine.ts)
// owns the rules; this component renders its state and wires up input, focus,
// feedback and the stored best streak.
export default function QuizSession({
  set,
  mode,
  pool,
  seed,
}: {
  set: SpeciesSet;
  mode: QuizMode;
  pool: readonly Fish[];
  seed: number;
}) {
  const [state, dispatch] = useReducer(runReducer, { mode, pool, seed }, startRun);
  const [failedPhotos, setFailedPhotos] = useState<ReadonlySet<number>>(new Set());
  const [newBest, setNewBest] = useState(false);
  const phase = phaseOf(state);
  const { question, outcome, index } = state;
  const summary = summarize(state);
  const key = bestKey(set.id, mode.id);
  const best = useBestStreak(key);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const resultsRef = useRef<HTMLHeadingElement>(null);
  const position = `${state.run.seed}:${phase}:${index}`;
  const shown = useRef(position);

  // Focus follows the run: the new question, the continue button after an
  // answer, the score at the end. Not on first load, so the page isn't hijacked.
  useEffect(() => {
    if (shown.current === position) return;
    shown.current = position;
    if (phase === "answering") headingRef.current?.focus();
    else if (phase === "feedback") nextRef.current?.focus();
    else resultsRef.current?.focus();
  }, [phase, position]);

  // Fetch the next plate's photograph while this one is being answered, so
  // the run doesn't stall on the network.
  const upcoming = useMemo(() => questionAt(state.run, index + 1), [state.run, index]);
  const upcomingSrc = upcoming?.fish.image?.src;
  useEffect(() => {
    if (!upcomingSrc) return;
    const img = new window.Image();
    img.src = upcomingSrc;
  }, [upcomingSrc]);

  function choose(choice: number) {
    if (phase !== "answering" || !question) return;
    dispatch({ type: "answer", choice });
    // Saved as it happens, so leaving mid-run still keeps a record.
    if (choice === question.correctIndex && recordStreak(key, summary.streak + 1)) setNewBest(true);
  }

  // A–D or 1–4 answer the current question.
  const chooseRef = useRef(choose);
  useEffect(() => {
    chooseRef.current = choose;
  });
  useEffect(() => {
    if (phase !== "answering") return;
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      const key = event.key.toUpperCase();
      const choice = /^[1-4]$/.test(key) ? Number(key) - 1 : ANSWER_KEYS.indexOf(key);
      if (choice < 0) return;
      event.preventDefault();
      chooseRef.current(choice);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  function restart() {
    setFailedPhotos(new Set());
    setNewBest(false);
    dispatch({ type: "restart", seed: newSeed() });
  }

  if (!question && state.log.length === 0) {
    return (
      <>
        <Water />
        <p className="max-w-xl text-fid-mist">
          There are not enough species with photographs to run this mode yet.{" "}
          <Link href={quizHref(set)} className="text-fid-sand underline underline-offset-4">
            Choose another mode
          </Link>
          .
        </p>
      </>
    );
  }

  const verdict = question ? verdictOf(question, outcome) : null;
  const photoFailed = failedPhotos.has(index);
  const plateNo = String(index + 1).padStart(2, "0");
  const announcement =
    question && verdict
      ? verdict === "skipped"
        ? "Skipped."
        : verdict === "correct"
          ? `Correct. ${question.fish.commonName}, ${question.fish.scientificName}. Streak ${summary.streak}.`
          : `Incorrect. It was ${question.fish.commonName}, ${question.fish.scientificName}. The run ends at ${summary.streak}.`
      : "";

  return (
    <>
      <Water depth={summary.streak / FULL_DEPTH_STREAK} />

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-fid-foam/15 pb-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-fid-mist/75">
          {set.title}
          <span aria-hidden className="mx-2 text-fid-foam/40">/</span>
          <span className="text-fid-foam">{mode.numeral}</span> {mode.title}
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-fid-mist/75">
          Streak <span className="text-fid-sand">{summary.streak}</span>
          {best !== null && (
            <>
              <span aria-hidden className="mx-2 text-fid-foam/40">/</span>
              Best <span className="text-fid-sand">{Math.max(best, summary.streak)}</span>
            </>
          )}
        </p>
      </div>

      {phase === "over" || !question ? (
        <Results
          headingRef={resultsRef}
          set={set}
          mode={mode}
          log={state.log}
          summary={summary}
          best={best}
          newBest={newBest}
          onRestart={restart}
        />
      ) : (
        <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] lg:gap-12">
          <SpecimenPlate
            key={`${state.run.seed}-${index}`}
            fish={question.fish}
            number={index + 1}
            prompt={question.prompt}
            revealed={phase === "feedback"}
            photoFailed={photoFailed}
            onPhotoError={() => setFailedPhotos((prev) => new Set(prev).add(index))}
          />

          <section aria-labelledby="fid-question">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-fid-foam/80">
              Plate {plateNo} <span aria-hidden className="mx-1.5 text-fid-foam/40">·</span> Answer with the {FIELD_LABEL[question.answer].toLowerCase()}
            </p>
            <h2
              id="fid-question"
              ref={headingRef}
              tabIndex={-1}
              className="mb-5 mt-2 font-fidserif text-[1.85rem] leading-tight text-fid-white outline-none sm:text-[2.1rem]"
            >
              {mode.question}
              {question.prompt !== "photo" && <span className="sr-only"> {question.fish[question.prompt]}</span>}
            </h2>

            <AnswerList
              question={question}
              chosen={typeof outcome === "number" ? outcome : null}
              locked={phase !== "answering"}
              onChoose={choose}
            />

            {photoFailed && question.prompt === "photo" && phase === "answering" && (
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-fid-mist">
                <span>Without its photograph this plate can’t be answered fairly.</span>
                <button type="button" onClick={() => dispatch({ type: "skip" })} className={buttonClass("quiet")}>
                  Skip this plate
                </button>
              </div>
            )}

            <p aria-live="polite" className="sr-only">
              {announcement}
            </p>

            {phase === "feedback" && verdict && (
              <div className="mt-6 border-t border-fid-foam/15 pt-5">
                <FieldNote fish={question.fish} verdict={verdict} />
                <button ref={nextRef} type="button" onClick={() => dispatch({ type: "next" })} className={`mt-6 ${buttonClass("primary")}`}>
                  {verdict === "wrong" ? "End of the run" : "Next plate"} <span aria-hidden>→</span>
                </button>
              </div>
            )}

            {phase === "answering" && (
              <p className="fid-keyhint mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-fid-mist/45">
                Keys A–D or 1–4 to answer
              </p>
            )}
          </section>
        </div>
      )}

      <div className="mt-12 border-t border-fid-foam/10 pt-4">
        <Link href={quizHref(set)} className="font-mono text-[11px] uppercase tracking-[0.18em] text-fid-mist/70 transition-colors hover:text-fid-sand">
          <span aria-hidden>←</span> All quiz modes
        </Link>
      </div>
    </>
  );
}
