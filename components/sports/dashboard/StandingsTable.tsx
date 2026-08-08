"use client";

import { displayName } from "@/lib/sports/leagues";
import type { StandingsRow } from "@/lib/sports/types";

/** Compact league standings table. */
export default function StandingsTable({ rows }: { rows: StandingsRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div className="overflow-hidden border border-ink/15">
      <div className="flex items-center justify-between border-b border-ink/10 bg-ink/5 px-3.5 py-2">
        <span className="font-display text-[10px] font-medium uppercase tracking-[0.22em] text-ink2">Pos</span>
        <span className="font-display text-[10px] font-medium uppercase tracking-[0.22em] text-ink2">Team</span>
        <span className="font-display text-[10px] font-medium uppercase tracking-[0.22em] text-ink2">
          {rows.some((r) => r.points !== undefined) ? "Pts" : "Record"}
        </span>
      </div>
      <div className="divide-y divide-ink/10 bg-white">
        {rows.map((row) => (
          <div
            key={row.team}
            className="flex items-center justify-between gap-3 px-3.5 py-1.5"
          >
            <span className="w-6 shrink-0 font-mono text-xs text-ink2">{row.position}</span>
            <span
              className={`min-w-0 flex-1 truncate text-[13px] ${
                row.position <= 3 ? "font-medium text-ink" : "text-ink/70"
              }`}
            >
              {displayName(row.team)}
            </span>
            <span className="shrink-0 font-mono text-xs font-semibold text-ink tabular-nums">
              {row.points !== undefined ? row.points : row.record}
              {row.gamesBack && row.gamesBack !== "—" && (
                <span className="ml-1.5 font-normal text-ink2/70">{row.gamesBack} GB</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
