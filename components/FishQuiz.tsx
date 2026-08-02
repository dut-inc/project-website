"use client";

import { useMemo, useState } from "react";
import Pin from "./Pin";
import FishIcon from "./FishIcon";
import {
  FISHES,
  QUIZ_QUESTIONS,
  applyAnswer,
  emptyScores,
  scoreToResult,
  type Scores,
} from "@/lib/fishQuiz";

type Step = "intro" | "quiz" | "result";

function optionLetter(i: number) {
  return String.fromCharCode(65 + i);
}

export default function FishQuiz() {
  const [step, setStep] = useState<Step>("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | undefined)[]>([]);
  const [copied, setCopied] = useState(false);

  const total = QUIZ_QUESTIONS.length;
  const question = QUIZ_QUESTIONS[qIndex];

  // Scores derive from the answer history, so Back / Restart always stay consistent.
  const scores: Scores = useMemo(() => {
    let acc = emptyScores();
    answers.forEach((optIdx, qi) => {
      if (optIdx === undefined) return;
      acc = applyAnswer(acc, qi, optIdx);
    });
    return acc;
  }, [answers]);

  const result = step === "result" ? scoreToResult(scores) : null;
  const maxScore = Math.max(...Object.values(scores), 1);

  function choose(optIdx: number) {
    // Overwrite in place so going Back can show the previously picked option.
    const next = [...answers];
    next[qIndex] = optIdx;
    if (qIndex + 1 < total) {
      setAnswers(next);
      setQIndex(qIndex + 1);
    } else {
      setAnswers(next);
      setStep("result");
    }
  }

  function goBack() {
    if (qIndex === 0) return;
    setQIndex(qIndex - 1);
  }

  function restart() {
    setStep("intro");
    setQIndex(0);
    setAnswers([]);
    setCopied(false);
  }

  async function copyResult() {
    if (!result) return;
    const text = `I'm a ${result.fish.name} — "${result.fish.tagline}" 🐟\nTake the quiz at The Board: https://ibisboard.vercel.app/fish-quiz`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      {step === "intro" && (
        <section className="relative mx-auto max-w-2xl">
          <Pin color="teal" />
          <div className="paper-torn animate-fade-up bg-cream p-8 text-ink shadow-[0_14px_28px_-8px_rgba(0,0,0,0.55)] sm:p-10">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink2">
              Case 001 · personality profile
            </p>
            <h2 className="mt-2 font-display text-3xl italic text-ink sm:text-4xl">
              Which Pacific Northwest fish are you?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/80">
              Six questions, one very important answer. The water&apos;s fine —
              and there&apos;s no wrong way to be a fish.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2" aria-hidden>
              {FISHES.map((f) => (
                <span
                  key={f.id}
                  title={f.name}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 ring-1 ring-ink/10"
                >
                  <FishIcon variant={f.id} className="h-5 w-8" />
                </span>
              ))}
            </div>
            <button
              onClick={() => setStep("quiz")}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-pinTeal px-6 py-3 font-mono text-xs uppercase tracking-widest text-cream transition-all hover:-translate-y-0.5 hover:bg-[#3A9284] hover:shadow-lg"
            >
              Take the quiz &rarr;
            </button>
          </div>
        </section>
      )}

      {step === "quiz" && question && (
        <section className="relative mx-auto max-w-2xl">
          <Pin color="teal" />
          <div className="paper-torn bg-cream p-8 text-ink shadow-[0_14px_28px_-8px_rgba(0,0,0,0.55)] sm:p-10">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-ink2">
              <span>
                Question {qIndex + 1} of {total}
              </span>
              <span>{Math.round((qIndex / total) * 100)}% done</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full rounded-full bg-pinTeal transition-all duration-500"
                style={{ width: `${(qIndex / total) * 100}%` }}
              />
            </div>

            <h2
              key={qIndex}
              className="animate-fade-up mt-6 font-display text-2xl italic text-ink sm:text-3xl"
            >
              {question.prompt}
            </h2>

            <div className="mt-6 space-y-3">
              {question.options.map((opt, i) => {
                const isSelected = answers[qIndex] === i;
                return (
                  <button
                    key={i}
                    onClick={() => choose(i)}
                    aria-pressed={isSelected}
                    className={`animate-fade-up group flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_16px_-6px_rgba(0,0,0,0.35)] ${
                      isSelected
                        ? "border-pinTeal/70 bg-kraft/70 ring-1 ring-pinTeal/40"
                        : "border-ink/10 bg-kraft/40 hover:border-pinTeal/60 hover:bg-kraft/70"
                    }`}
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    <span
                      className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] transition-colors ${
                        isSelected
                          ? "border-pinTeal bg-pinTeal text-cream"
                          : "border-ink/25 text-ink2 group-hover:border-pinTeal group-hover:text-pinTeal"
                      }`}
                    >
                      {optionLetter(i)}
                    </span>
                    <span className="text-sm leading-relaxed text-ink/90">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={goBack}
                disabled={qIndex === 0}
                className="font-mono text-[11px] uppercase tracking-widest text-ink2 transition-colors hover:text-pinTeal disabled:cursor-not-allowed disabled:opacity-40"
              >
                &larr; Back
              </button>
              <button
                onClick={restart}
                className="font-mono text-[11px] uppercase tracking-widest text-ink2 transition-colors hover:text-pinTeal"
              >
                Restart
              </button>
            </div>
          </div>
        </section>
      )}

      {step === "result" && result && (
        <section className="relative mx-auto max-w-2xl" aria-live="polite">
          <Pin color="teal" />
          <div className="paper-torn animate-fade-up bg-cream p-8 text-ink shadow-[0_14px_28px_-8px_rgba(0,0,0,0.55)] sm:p-10">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink2">
              Your result
            </p>

            <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-pinTeal/10 ring-2 ring-pinTeal/30">
                <FishIcon
                  variant={result.fish.id}
                  className="animate-floaty h-16 w-24"
                />
              </div>
              <div className="text-center sm:text-left">
                <span
                  className="inline-block rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-cream"
                  style={{ background: result.fish.color }}
                >
                  {result.fish.tagline}
                </span>
                <h2 className="mt-2 font-display text-3xl italic text-ink sm:text-4xl">
                  {result.fish.name}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink/80">
                  {result.fish.description}
                </p>
              </div>
            </div>

            <ul className="mt-6 space-y-2">
              {result.fish.traits.map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm text-ink/90">
                  <span className="text-pinTeal">&#10003;</span>
                  {t}
                </li>
              ))}
            </ul>

            <p className="mt-5 rounded-lg bg-ink/5 px-4 py-3 font-mono text-xs leading-relaxed text-ink2">
              <span className="uppercase tracking-widest text-ink/60">
                Did you know &middot;{" "}
              </span>
              {result.fish.fact}
            </p>

            <div className="mt-6">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink2">
                How you scored
              </p>
              <div className="space-y-2.5">
                {result.ranked.map((f, i) => {
                  const score = scores[f.id];
                  const isWinner = i === 0;
                  return (
                    <div
                      key={f.id}
                      className={`flex items-center gap-3 ${isWinner ? "" : "opacity-80"}`}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: f.color }}
                      />
                      <span
                        className={`w-36 shrink-0 truncate font-mono text-[11px] uppercase tracking-wider ${
                          isWinner ? "font-medium text-ink" : "text-ink2"
                        }`}
                      >
                        {f.tagline}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${(score / maxScore) * 100}%`,
                            background: f.color,
                          }}
                        />
                      </div>
                      <span className="w-6 shrink-0 text-right font-mono text-[11px] text-ink2">
                        {score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {result.ranked[1] && scores[result.ranked[1].id] > 0 && (
              <p className="mt-5 text-sm text-ink/70">
                A little{" "}
                <span className="font-medium text-ink">
                  {result.ranked[1].shortName}
                </span>{" "}
                in you, too.
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={restart}
                className="rounded-full bg-pinTeal px-6 py-3 font-mono text-xs uppercase tracking-widest text-cream transition-all hover:-translate-y-0.5 hover:bg-[#3A9284] hover:shadow-lg"
              >
                Take it again
              </button>
              <button
                onClick={copyResult}
                className="rounded-full border border-ink/20 px-6 py-3 font-mono text-xs uppercase tracking-widest text-ink transition-all hover:-translate-y-0.5 hover:border-pinTeal hover:text-pinTeal"
              >
                {copied ? "Copied!" : "Copy result"}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
