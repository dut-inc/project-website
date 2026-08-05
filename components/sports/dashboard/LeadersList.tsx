"use client";

import type { PlayerLeader } from "@/lib/sports/types";

/** Generic player-leader rows (game or season). */
export default function LeadersList({ leaders }: { leaders: PlayerLeader[] }) {
  if (leaders.length === 0) return null;

  return (
    <div className="divide-y divide-white/5 rounded-xl border border-white/5 bg-white/[0.02]">
      {leaders.map((leader) => (
        <div key={leader.label + leader.player} className="flex items-baseline justify-between gap-3 px-3.5 py-2">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">{leader.label}</p>
            <p className="truncate text-[13px] font-medium text-white/90">{leader.player}</p>
          </div>
          <span className="shrink-0 font-mono text-sm font-semibold text-white tabular-nums">{leader.value}</span>
        </div>
      ))}
    </div>
  );
}
