"use client";

import { formatGameDate, formatGameNote, shortTeamName } from "@/lib/sports/leagues";
import type { GameSummary as GameSummaryData } from "@/lib/sports/types";

const outcomeStyles: Record<string, string> = {
  W: "bg-market-oliveLight text-market-olive",
  L: "bg-[#F3DAD2] text-[#8A3B28]",
  T: "bg-ink/5 text-ink2",
  D: "bg-ink/5 text-ink2",
};

/** Most recent completed game — one compact line for the team strip. */
export default function GameSummary({ game }: { game: GameSummaryData }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
      <span className="font-display text-[10px] font-medium uppercase tracking-[0.22em] text-ink2/80">
        Last game
      </span>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          outcomeStyles[game.outcome] ?? outcomeStyles.T
        }`}
      >
        {game.outcome}
      </span>
      <span className="truncate text-sm font-medium text-ink">
        {game.at === "home" ? "vs" : "at"} {shortTeamName(game.opponent)}
      </span>
      {game.note && (
        <span className="font-mono text-[10px] uppercase tracking-wide text-ink2/70">
          {formatGameNote(game.note)}
        </span>
      )}
      <span className="font-mono text-sm font-semibold text-ink tabular-nums">
        {game.teamScore}–{game.opponentScore}
      </span>
      <span className="ml-auto font-display text-[10px] font-medium uppercase tracking-[0.18em] text-ink2/70">
        {formatGameDate(game.date)}
      </span>
    </div>
  );
}
