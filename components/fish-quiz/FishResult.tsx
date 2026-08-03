import FishCard from "./FishCard";
import FishIcon from "./FishIcon";
import type { QuizResult, Scores } from "@/lib/fishQuiz";

export default function FishResult({
  result,
  scores,
  copied,
  onRestart,
  onCopy,
}: {
  result: QuizResult;
  scores: Scores;
  copied: boolean;
  onRestart: () => void;
  onCopy: () => void;
}) {
  const maxScore = Math.max(...Object.values(scores), 1);

  return (
    <FishCard ariaLive="polite">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink2">
        Your result
      </p>

      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-pinTeal/10 ring-2 ring-pinTeal/30">
          <FishIcon variant={result.fish.id} className="animate-floaty h-16 w-24" />
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
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10"
                  role="progressbar"
                  aria-label={`${f.name} score`}
                  aria-valuemin={0}
                  aria-valuemax={maxScore}
                  aria-valuenow={score}
                >
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
          onClick={onRestart}
          className="min-h-11 rounded-full bg-pinTeal px-6 py-3 font-mono text-xs uppercase tracking-widest text-cream transition-all hover:-translate-y-0.5 hover:bg-[#3A9284] hover:shadow-lg"
        >
          Take it again
        </button>
        <button
          onClick={onCopy}
          className="min-h-11 rounded-full border border-ink/20 px-6 py-3 font-mono text-xs uppercase tracking-widest text-ink transition-all hover:-translate-y-0.5 hover:border-pinTeal hover:text-pinTeal"
        >
          {copied ? "Copied!" : "Copy result"}
        </button>
      </div>
    </FishCard>
  );
}
