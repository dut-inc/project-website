"use client";

import { formatShortDate, shortTeamName } from "@/lib/sports/leagues";
import type { ScheduledGame } from "@/lib/sports/types";

/** The next few scheduled games as compact inline chips. */
export default function ScheduleList({ games }: { games: ScheduledGame[] }) {
  if (games.length === 0) {
    return (
      <p className="font-display text-[10px] font-medium uppercase tracking-[0.22em] text-ink2/70">
        No games scheduled
      </p>
    );
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5">
      <span className="font-display text-[10px] font-medium uppercase tracking-[0.22em] text-ink2/80">
        Next
      </span>
      {games.map((game, i) => (
        <span key={i} className="flex items-center gap-1.5 whitespace-nowrap text-[13px]">
          <span className="font-mono text-[11px] text-ink2 tabular-nums">
            {formatShortDate(game.date)}
          </span>
          <span className="font-medium text-ink">
            {game.at === "home" ? "vs" : "at"} {shortTeamName(game.opponent)}
          </span>
          <span className="font-mono text-[11px] text-ink2/80 tabular-nums">{game.time}</span>
          {game.note && (
            <span className="rounded-full bg-market-brickLight px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-market-brick">
              {game.note}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
