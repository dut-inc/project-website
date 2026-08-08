"use client";

import type { ScoringEvent } from "@/lib/sports/types";

/** Chronological scoring summary for a live game. */
export default function ScoringSummary({ events }: { events: ScoringEvent[] }) {
  if (events.length === 0) return null;

  return (
    <div className="divide-y divide-ink/10 border border-ink/15 bg-white">
      {events.map((event, i) => (
        <div key={i} className="flex items-center justify-between gap-3 px-3.5 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                event.side === "seattle"
                  ? "bg-market-oliveLight text-market-olive"
                  : "bg-ink/5 text-ink2"
              }`}
            >
              {event.period}
            </span>
            <span className="truncate text-[13px] text-ink/80">{event.description}</span>
          </div>
          <span className="shrink-0 font-mono text-xs text-ink tabular-nums">{event.score}</span>
        </div>
      ))}
    </div>
  );
}
