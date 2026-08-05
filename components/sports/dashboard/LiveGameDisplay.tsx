"use client";

import { formatShortDate, liveStatusLine } from "@/lib/sports/leagues";
import type { Team } from "@/lib/sports/types";
import { LiveDot } from "./icons";

/** Live score panel shown on the collapsed card while a game is in progress. */
export default function LiveGameDisplay({ team }: { team: Team }) {
  const game = team.currentGame;
  if (!game) return null;

  const next = team.nextGames[0];
  const sportSpecific = game.sportSpecific ? Object.entries(game.sportSpecific) : [];

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-red-400">
          <LiveDot className="h-1.5 w-1.5" />
          Live
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/35">
          {game.channel ?? "In progress"}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <div className="font-display text-3xl font-semibold leading-none text-white tabular-nums">
            {game.teamScore}
            <span className="mx-1.5 text-lg font-normal text-white/30">–</span>
            {game.opponentScore}
          </div>
          <p className="mt-1.5 text-sm font-medium text-white/70">
            {game.at === "home" ? "vs" : "at"} {game.opponent}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-xs font-semibold text-white/90">{liveStatusLine(team)}</p>
          {sportSpecific.length > 0 && (
            <div className="mt-1.5 flex flex-wrap justify-end gap-1">
              {sportSpecific.map(([label, value]) => (
                <span
                  key={label}
                  className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/50 tabular-nums"
                  title={label}
                >
                  {label} {value}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {next && (
        <p className="mt-3 border-t border-white/5 pt-2.5 font-mono text-[11px] text-white/45">
          Next: {next.at === "home" ? "vs" : "at"} {next.opponent} · {formatShortDate(next.date)} ·{" "}
          {next.time}
        </p>
      )}
    </div>
  );
}
