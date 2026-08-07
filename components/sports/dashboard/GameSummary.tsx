"use client";

import { formatGameDate, formatGameNote, shortTeamName } from "@/lib/sports/leagues";
import type { GameSummary as GameSummaryData } from "@/lib/sports/types";

const outcomeStyles: Record<string, string> = {
  W: "bg-emerald-400/15 text-emerald-300",
  L: "bg-red-400/15 text-red-300",
  T: "bg-white/10 text-white/60",
  D: "bg-white/10 text-white/60",
};

/** Most recent completed game — one compact line for the team strip. */
export default function GameSummary({ game }: { game: GameSummaryData }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
      <span className="font-mono text-[10px] uppercase tracking-widest text-cream/40">Last game</span>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          outcomeStyles[game.outcome] ?? outcomeStyles.T
        }`}
      >
        {game.outcome}
      </span>
      <span className="truncate text-sm font-medium text-white/90">
        {game.at === "home" ? "vs" : "at"} {shortTeamName(game.opponent)}
      </span>
      {game.note && (
        <span className="font-mono text-[10px] uppercase tracking-wide text-cream/45">
          {formatGameNote(game.note)}
        </span>
      )}
      <span className="font-mono text-sm font-semibold text-white tabular-nums">
        {game.teamScore}–{game.opponentScore}
      </span>
      <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-cream/35">
        {formatGameDate(game.date)}
      </span>
    </div>
  );
}
