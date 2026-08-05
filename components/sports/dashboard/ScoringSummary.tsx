"use client";

import type { ScoringEvent } from "@/lib/sports/types";

/** Chronological scoring summary for a live game. */
export default function ScoringSummary({ events }: { events: ScoringEvent[] }) {
  if (events.length === 0) return null;

  return (
    <div className="divide-y divide-white/5 rounded-xl border border-white/5 bg-white/[0.02]">
      {events.map((event, i) => (
        <div key={i} className="flex items-center justify-between gap-3 px-3.5 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                event.side === "seattle"
                  ? "bg-emerald-400/15 text-emerald-300"
                  : "bg-white/10 text-white/60"
              }`}
            >
              {event.period}
            </span>
            <span className="truncate text-[13px] text-white/75">{event.description}</span>
          </div>
          <span className="shrink-0 font-mono text-xs text-white/50 tabular-nums">{event.score}</span>
        </div>
      ))}
    </div>
  );
}
