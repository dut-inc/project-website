"use client";

import { PITCH_COLORS, PITCH_NAMES, type PitchType } from "@/lib/sports/pitchTypes.ts";

export type PredictionRow = { type: PitchType; prob: number };

function LoadingModel() {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
      <div className="size-8 animate-spin rounded-full border-2 border-sports-accent/30 border-t-sports-accent" />
      <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">
        loading pitch model…
      </p>
      <p className="max-w-xs text-xs text-white/30">
        The 6,000-tree model is ~14MB — first load takes a few seconds, then it&apos;s cached.
      </p>
    </div>
  );
}

function ModelError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
      <p className="font-mono text-[11px] uppercase tracking-widest text-red-400">
        model failed to load
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full border border-sports-accent/40 bg-sports-accent/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest text-sports-accent transition-colors hover:bg-sports-accent/20"
      >
        Retry
      </button>
    </div>
  );
}

export default function PredictionBoard({
  predictions,
  modelStatus,
  onRetry,
  note,
}: {
  predictions: PredictionRow[] | null;
  modelStatus: "loading" | "ready" | "error";
  onRetry: () => void;
  /** Short context line, e.g. "FF → ball", shown next to the call. */
  note?: string | null;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <header className="flex items-center justify-between border-b border-white/10 bg-black/30 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-sports-accent">
            Model&apos;s Call
          </span>
          <span className="hidden rounded-full border border-white/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-white/40 sm:inline">
            next pitch · xgb v1
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
          43.6% acc
        </span>
      </header>

      {modelStatus === "loading" && <LoadingModel />}
      {modelStatus === "error" && <ModelError onRetry={onRetry} />}

      {modelStatus === "ready" && !predictions && (
        <div className="flex h-40 items-center justify-center px-4 text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
            Select a pitcher and batter to see the model&apos;s call
          </p>
        </div>
      )}

      {modelStatus === "ready" && predictions && (
        <div className="p-4 sm:p-5">
          {/* The call — top pick */}
          {predictions[0] && (
            <div className="mb-4 flex items-center gap-4 rounded-xl border border-white/10 bg-black/40 p-4">
              <span
                className="flex size-14 shrink-0 items-center justify-center rounded-xl font-sign text-xl text-black"
                style={{ backgroundColor: PITCH_COLORS[predictions[0].type] }}
              >
                {predictions[0].type}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/40">
                    Predicted next pitch
                  </span>
                  {note && (
                    <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
                      after {note}
                    </span>
                  )}
                </div>
                <div className="truncate font-sign text-2xl uppercase tracking-wide text-white sm:text-3xl">
                  {PITCH_NAMES[predictions[0].type]}
                </div>
              </div>
              <div
                className="shrink-0 font-sign text-4xl leading-none"
                style={{ color: PITCH_COLORS[predictions[0].type] }}
              >
                {(predictions[0].prob * 100).toFixed(1)}
                <span className="text-xl">%</span>
              </div>
            </div>
          )}

          {/* Runner-up + third */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            {predictions.slice(1, 3).map((row, i) => (
              <div key={row.type} className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                <span className="font-mono text-[10px] text-white/35">#{i + 2}</span>
                <span
                  className="inline-flex size-7 items-center justify-center rounded-md font-sign text-xs text-black"
                  style={{ backgroundColor: PITCH_COLORS[row.type] }}
                >
                  {row.type}
                </span>
                <span className="truncate font-mono text-xs uppercase text-white/70">
                  {PITCH_NAMES[row.type]}
                </span>
                <span className="ml-auto shrink-0 font-mono text-xs text-white/60">
                  {(row.prob * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

          {/* Full ranked board */}
          <div className="flex flex-col gap-1.5">
            {predictions.map((row, i) => {
              const pct = row.prob * 100;
              const width = Math.max(2, (pct / (predictions[0]?.prob * 100 || 1)) * 100);
              return (
                <div key={row.type} className="flex items-center gap-2.5">
                  <span className="w-5 shrink-0 text-right font-mono text-[10px] text-white/30">
                    {i + 1}
                  </span>
                  <span
                    className="inline-flex w-9 shrink-0 items-center justify-center rounded font-mono text-[10px] font-medium text-black"
                    style={{ backgroundColor: PITCH_COLORS[row.type] }}
                  >
                    {row.type}
                  </span>
                  <span className="hidden w-28 shrink-0 truncate font-mono text-[11px] uppercase text-white/55 sm:block">
                    {PITCH_NAMES[row.type]}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${width}%`, backgroundColor: PITCH_COLORS[row.type] }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right font-mono text-[11px] text-white/70">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}