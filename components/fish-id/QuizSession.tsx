"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { parseCode, randomCode } from "@/lib/fishId/codes";
import { RUN_LENGTH, phaseOf, questionAt, runReducer, startRun, summarize, verdictOf } from "@/lib/fishId/engine";
import { quizHref, type QuizMode } from "@/lib/fishId/modes";
import type { SpeciesSet } from "@/lib/fishId/sets";
import type { Fish } from "@/lib/fishId/types";
import AnswerList, { ANSWER_KEYS } from "./AnswerList";
import FieldNote from "./FieldNote";
import Results from "./Results";
import SpecimenPlate from "./SpecimenPlate";
import Water from "./Water";
import { bestKey, recordBest, useBest } from "./streakStore";
import { buttonClass } from "./buttons";

// One run of any mode over one species set, dealt from a four-letter code.
// The engine (lib/fishId/engine.ts) owns the rules; this component renders
// its state and wires up input, focus, feedback and the stored best score.
// `shared` is true when the code came from the URL (a friend's link).
export default function QuizSession({
  set,
  mode,
  pool,
  code: initialCode,
  shared,
}: {
  set: SpeciesSet;
  mode: QuizMode;
  pool: readonly Fish[];
  code: string;
  shared: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [state, dispatch] = useReducer(runReducer, { mode, pool, seed: parseCode(initialCode)!.seed }, startRun);
  const [failedPhotos, setFailedPhotos] = useState<ReadonlySet<number>>(new Set());
  const phase = phaseOf(state);
  const { question, outcome, index } = state;
  const summary = summarize(state);
  const key = bestKey(set.id, mode.id);
  const best = useBest(key);

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
  const upcoming = useMemo(() => (index + 1 < RUN_LENGTH ? questionAt(state.run, index + 1) : null), [state.run, index]);
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
    if (choice === question.correctIndex) recordBest(key, summary.score + 1);
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
    // A friend's code stays in the URL until the player starts their own run;
    // leaving it remounts this session with a fresh code from the server.
    if (shared) {
      router.replace(quizHref(set, mode), { scroll: false });
      return;
    }
    const next = randomCode(set, mode);
    setFailedPhotos(new Set());
    setCode(next.code);
    dispatch({ type: "restart", seed: next.seed });
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
  const lastPlate = index + 1 >= RUN_LENGTH;
  const announcement =
    question && verdict
      ? verdict === "skipped"
        ? "Skipped."
        : verdict === "correct"
          ? `Correct. ${question.fish.commonName}, ${question.fish.scientificName}. Score ${summary.score}.`
          : `Incorrect. It was ${question.fish.commonName}, ${question.fish.scientificName}. Score ${summary.score}.`
      : "";

  return (
    <>
      <Water depth={summary.score / RUN_LENGTH} />

      {/* Pulled up to the page header's rule, so the text sits centred between the two lines. */}
      <div className="-mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-fid-foam/15 py-3">
        <p className="font-fidserif font-medium lining-nums text-[13px] uppercase tracking-[0.14em] text-fid-mist/75">
          {set.title}
          <span aria-hidden className="mx-2 text-fid-foam/40">/</span>
          {mode.title}
        </p>
        <p className="font-fidserif font-medium lining-nums text-[13px] uppercase tracking-[0.14em] text-fid-mist/75">
          Code <span className="text-fid-sand">{code}</span>
          <span aria-hidden className="mx-2 text-fid-foam/40">/</span>
          Score <span className="text-fid-sand">{summary.score}</span>
          {best !== null && best > 0 && (
            <>
              <span aria-hidden className="mx-2 text-fid-foam/40">/</span>
              Best <span className="text-fid-sand">{Math.max(best, summary.score)}</span>
            </>
          )}
        </p>
      </div>

      {phase === "over" || !question ? (
        <Results
          headingRef={resultsRef}
          set={set}
          mode={mode}
          code={code}
          log={state.log}
          summary={summary}
          onRestart={restart}
        />
      ) : (
        <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] lg:gap-12">
          <SpecimenPlate
            key={`${state.run.seed}-${index}`}
            fish={question.fish}
            prompt={question.prompt}
            revealed={phase === "feedback"}
            photoFailed={photoFailed}
            onPhotoError={() => setFailedPhotos((prev) => new Set(prev).add(index))}
          />

          <section aria-labelledby="fid-question">
            <p className="font-fidserif font-medium lining-nums text-[13px] uppercase tracking-[0.14em] text-fid-foam/80">
              Plate {plateNo} of {RUN_LENGTH}
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
                  {lastPlate ? "See results" : "Next plate"} <span aria-hidden>→</span>
                </button>
              </div>
            )}

          </section>
        </div>
      )}

    </>
  );
}
