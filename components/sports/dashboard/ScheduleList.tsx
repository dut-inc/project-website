"use client";

import { formatGameDate } from "@/lib/sports/leagues";
import type { ScheduledGame } from "@/lib/sports/types";

/** The next few scheduled games, glanceable: date · opponent · time. */
export default function ScheduleList({ games }: { games: ScheduledGame[] }) {
  if (games.length === 0) {
    return (
      <p className="rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3 text-center font-mono text-[11px] uppercase tracking-widest text-white/35">
        No games scheduled
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {games.map((game, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="shrink-0 font-mono text-[11px] text-white/45 tabular-nums">
              {formatGameDate(game.date)}
            </span>
            <span className="truncate text-[13px] font-medium text-white/85">
              {game.at === "home" ? "vs" : "at"} {game.opponent}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {game.note && (
              <span className="hidden rounded-full bg-[#FF9552]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#FF9552]/90 sm:inline">
                {game.note}
              </span>
            )}
            <span className="font-mono text-xs text-white/55 tabular-nums">{game.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
