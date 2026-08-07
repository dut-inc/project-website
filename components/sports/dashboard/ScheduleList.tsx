"use client";

import { formatShortDate, shortTeamName } from "@/lib/sports/leagues";
import type { ScheduledGame } from "@/lib/sports/types";

/** The next few scheduled games as compact inline chips. */
export default function ScheduleList({ games }: { games: ScheduledGame[] }) {
  if (games.length === 0) {
    return (
      <p className="font-mono text-[10px] uppercase tracking-widest text-cream/35">
        No games scheduled
      </p>
    );
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-cream/40">Next</span>
      {games.map((game, i) => (
        <span key={i} className="flex items-center gap-1.5 whitespace-nowrap text-[13px]">
          <span className="font-mono text-[11px] text-cream/45 tabular-nums">
            {formatShortDate(game.date)}
          </span>
          <span className="font-medium text-white/90">
            {game.at === "home" ? "vs" : "at"} {shortTeamName(game.opponent)}
          </span>
          <span className="font-mono text-[11px] text-cream/50 tabular-nums">{game.time}</span>
          {game.note && (
            <span className="rounded-full bg-market-red/20 px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-red-300">
              {game.note}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
