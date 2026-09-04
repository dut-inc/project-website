"use client";

import type { PlayerLeader } from "@/lib/sports/types";

/** Generic player-leader rows (game or season). */
export default function LeadersList({ leaders }: { leaders: PlayerLeader[] }) {
  if (leaders.length === 0) return null;

  return (
    <div className="divide-y divide-ink/10 border border-ink/15 bg-white">
      {leaders.map((leader) => (
        <div key={leader.label + leader.player} className="flex items-baseline justify-between gap-3 px-3.5 py-2">
          <div className="min-w-0">
            <p className="font-display text-[10px] font-medium uppercase tracking-[0.22em] text-ink2">
              {leader.label}
            </p>
            <p className="truncate text-[13px] font-medium text-ink">{leader.player}</p>
          </div>
          <span className="shrink-0 font-mono text-sm font-semibold text-ink tabular-nums">{leader.value}</span>
        </div>
      ))}
    </div>
  );
}
