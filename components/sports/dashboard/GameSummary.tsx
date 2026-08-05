"use client";

import { formatGameDate } from "@/lib/sports/leagues";
import type { GameSummary as GameSummaryData } from "@/lib/sports/types";

const outcomeStyles: Record<string, string> = {
  W: "bg-emerald-400/15 text-emerald-300",
  L: "bg-red-400/15 text-red-300",
  T: "bg-white/10 text-white/60",
  D: "bg-white/10 text-white/60",
};

/** Most recent completed game — shown when the team is not playing. */
export default function GameSummary({ game }: { game: GameSummaryData }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Last game</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/35">
          {formatGameDate(game.date)}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                outcomeStyles[game.outcome] ?? outcomeStyles.T
              }`}
            >
              {game.outcome}
            </span>
            <span className="truncate text-sm font-medium text-white/90">
              {game.at === "home" ? "vs" : "at"} {game.opponent}
            </span>
          </div>
          {game.note && (
            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-white/40">{game.note}</p>
          )}
        </div>
        <span className="shrink-0 font-mono text-base font-semibold text-white tabular-nums">
          {game.teamScore}–{game.opponentScore}
        </span>
      </div>
    </div>
  );
}
