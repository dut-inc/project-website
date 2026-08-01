"use client";

import type { FieldIdResult, FieldSighting } from "@/lib/fieldWatch";
import { formatStamp, speciesById } from "@/lib/fieldWatch";

// FieldSpeciesPanel — green-on-black terminal "card" that shows the v0
// stub classification: the best guess, a confidence bar, the runners-up,
// and (after the user confirms) a confirmed sighting summary.

type Props = {
  state: "idle" | "analyzing" | "result";
  result: FieldIdResult | null;
  previewUrl: string | null;
  confirmed: FieldSighting | null;
  onReset: () => void;
};

export default function FieldSpeciesPanel({
  state,
  result,
  previewUrl,
  confirmed,
  onReset,
}: Props) {
  return (
    <div className="rounded-md border border-pinTeal/30 bg-black/40 font-mono text-sm text-pinTeal shadow-[0_0_0_1px_rgba(47,122,107,0.05),inset_0_0_40px_rgba(47,122,107,0.06)]">
      <header className="flex items-center justify-between border-b border-pinTeal/20 px-4 py-2 text-[10px] uppercase tracking-widest text-pinTeal/80">
        <span>species-id v0 · stub</span>
        <Blinker />
      </header>

      {state === "idle" && (
        <div className="space-y-1.5 p-4 text-[12px] leading-relaxed text-cream/55">
          <p>&gt; awaiting upload…</p>
          <p>&gt; model: hue-bias stub (handover to v2 planned)</p>
          <p>&gt; candidates: 9 PNW species</p>
        </div>
      )}

      {state === "analyzing" && (
        <div className="space-y-1.5 p-4 text-[12px] leading-relaxed">
          <p>&gt; decoding image…</p>
          <p>&gt; sampling 64×64 grid…</p>
          <p className="flex items-center gap-2">
            <span>&gt; scoring catalog</span>
            <Dots />
          </p>
        </div>
      )}

      {state === "result" && result && <Result result={result} />}

      {(state === "result" || confirmed) && (
        <div className="flex items-center justify-between gap-3 border-t border-pinTeal/20 px-4 py-3">
          {previewUrl && (
            <img
              src={previewUrl}
              alt=""
              className="h-10 w-10 rounded-sm border border-pinTeal/40 object-cover"
            />
          )}
          {confirmed ? (
            <div className="flex-1 text-[11px] uppercase tracking-widest text-pinTeal/80">
              <p>
                log: {speciesById(confirmed.speciesId)?.common ?? "—"} ·
                {" "}
                {Math.round(confirmed.confidence * 100)}% ·{" "}
                {formatStamp(confirmed.createdAt)}
              </p>
            </div>
          ) : (
            <p className="flex-1 text-[11px] uppercase tracking-widest text-pinTeal/50">
              confirm to drop a pin on the map
            </p>
          )}
          <button
            onClick={onReset}
            className="rounded-sm border border-pinTeal/40 px-2 py-1 text-[10px] uppercase tracking-widest text-pinTeal hover:border-pinTeal hover:bg-pinTeal/10"
          >
            reset
          </button>
        </div>
      )}
    </div>
  );
}

function Result({ result }: { result: FieldIdResult }) {
  const pct = Math.round(result.confidence * 100);
  return (
    <div className="space-y-4 p-4 text-[12px] text-cream/85">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-pinTeal/70">
          best guess
        </p>
        <p className="mt-1 text-lg font-semibold text-pinTeal">
          {result.best.common}
        </p>
        <p className="text-[11px] italic text-cream/55">
          {result.best.scientific}
        </p>
      </div>
      <div>
        <div className="mb-1 flex items-baseline justify-between text-[10px] uppercase tracking-widest text-pinTeal/70">
          <span>confidence</span>
          <span className="text-cream/70">{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-sm bg-pinTeal/15">
          <div
            className="h-full rounded-sm bg-pinTeal"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-pinTeal/70">
          other candidates
        </p>
        <ul className="mt-1 space-y-0.5 text-[11px] text-cream/65">
          {result.alternatives.map((sp) => (
            <li key={sp.id} className="flex justify-between gap-3">
              <span>{sp.common}</span>
              <span className="text-cream/40">{sp.category}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-[10px] leading-relaxed text-pinTeal/40">
        v0 stub: dominant-hue bucketing. Honest because the real classifier is
        still planned.
      </p>
    </div>
  );
}

function Blinker() {
  return (
    <span className="flex items-center gap-1.5">
      <span className="block h-1.5 w-1.5 rounded-full bg-pinTeal animate-pulse" />
      <span>live</span>
    </span>
  );
}

function Dots() {
  return (
    <span className="inline-flex gap-1" aria-hidden>
      <span className="h-1 w-1 animate-pulse rounded-full bg-pinTeal [animation-delay:0ms]" />
      <span className="h-1 w-1 animate-pulse rounded-full bg-pinTeal [animation-delay:150ms]" />
      <span className="h-1 w-1 animate-pulse rounded-full bg-pinTeal [animation-delay:300ms]" />
    </span>
  );
}
