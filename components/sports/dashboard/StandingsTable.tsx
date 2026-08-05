"use client";

import type { StandingsRow } from "@/lib/sports/types";

/** Compact league standings table. */
export default function StandingsTable({ rows }: { rows: StandingsRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-white/5">
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.03] px-3.5 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Pos</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Team</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
          {rows.some((r) => r.points !== undefined) ? "Pts" : "Record"}
        </span>
      </div>
      <div className="divide-y divide-white/5 bg-white/[0.02]">
        {rows.map((row) => (
          <div
            key={row.team}
            className="flex items-center justify-between gap-3 px-3.5 py-1.5"
          >
            <span className="w-6 shrink-0 font-mono text-xs text-white/40">{row.position}</span>
            <span
              className={`min-w-0 flex-1 truncate text-[13px] ${
                row.position <= 3 ? "font-medium text-white" : "text-white/65"
              }`}
            >
              {row.team}
            </span>
            <span className="shrink-0 font-mono text-xs font-semibold text-white tabular-nums">
              {row.points !== undefined ? row.points : row.record}
              {row.gamesBack && row.gamesBack !== "—" && (
                <span className="ml-1.5 font-normal text-white/35">{row.gamesBack} GB</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
