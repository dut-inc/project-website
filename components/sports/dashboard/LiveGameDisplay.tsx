"use client";

import { liveScoreboardLine } from "@/lib/sports/leagues";
import type { Team } from "@/lib/sports/types";
import LiveScoreboard from "./LiveScoreboard";
import { LiveDot } from "./icons";

/** Live score panel shown on the collapsed card while a game is in progress. */
export default function LiveGameDisplay({ team }: { team: Team }) {
  const game = team.currentGame;
  if (!game) return null;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-red-400">
          <LiveDot className="h-1.5 w-1.5" />
          Live
        </span>
        <span className="truncate text-right font-mono text-[10px] uppercase tracking-wider text-white/45">
          {liveScoreboardLine(team)}
        </span>
      </div>

      <div className="mt-4">
        <LiveScoreboard team={team} />
      </div>

      {/* Situational line, e.g. a basketball run. MLB's B-S-O widget already
          carries its own caption, so it doesn't repeat one here. */}
      {team.league !== "mlb" && game.detail && (
        <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-wider text-white/50">
          {game.detail}
        </p>
      )}
    </div>
  );
}
