import FishCard from "./FishCard";
import type { QuizQuestion } from "@/lib/fishQuiz";

function optionLetter(i: number) {
  return String.fromCharCode(65 + i);
}

export default function FishQuestion({
  question,
  qIndex,
  total,
  answers,
  onChoose,
  onBack,
  onRestart,
}: {
  question: QuizQuestion;
  qIndex: number;
  total: number;
  answers: (number | undefined)[];
  onChoose: (optIdx: number) => void;
  onBack: () => void;
  onRestart: () => void;
}) {
  return (
    <FishCard>
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-ink2">
        <span>
          Question {qIndex + 1} of {total}
        </span>
        <span>{Math.round(((qIndex + 1) / total) * 100)}% through</span>
      </div>
      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink/10"
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={qIndex + 1}
      >
        <div
          className="h-full rounded-full bg-pinTeal transition-all duration-500"
          style={{ width: `${((qIndex + 1) / total) * 100}%` }}
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
              onClick={() => onChoose(i)}
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
          onClick={onBack}
          disabled={qIndex === 0}
          className="min-h-11 rounded-sm font-mono text-[11px] uppercase tracking-widest text-ink2 transition-colors hover:text-pinTeal disabled:cursor-not-allowed disabled:opacity-40"
        >
          &larr; Back
        </button>
        <button
          onClick={onRestart}
          className="min-h-11 rounded-sm px-2 font-mono text-[11px] uppercase tracking-widest text-ink2 transition-colors hover:text-pinTeal"
        >
          Restart
        </button>
      </div>
    </FishCard>
  );
}
