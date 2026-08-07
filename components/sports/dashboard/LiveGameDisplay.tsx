"use client";

import { liveStatusLine } from "@/lib/sports/leagues";
import type { Team } from "@/lib/sports/types";
import LiveScoreboard from "./LiveScoreboard";
import { LiveDot } from "./icons";

/** Live score strip shown on the collapsed card while a game is in progress. */
export default function LiveGameDisplay({ team }: { team: Team }) {
  const game = team.currentGame;
  if (!game) return null;

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Status line sits above the score so the score itself is the visual
          middle of the box. Includes the period/clock and sport-specific
          situational text like a basketball run (game.detail). */}
      <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5">
        <span className="neon-soft flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest">
          <LiveDot className="h-1.5 w-1.5" />
          Live
        </span>
        <span className="font-mono text-[11px] uppercase tracking-wider text-cream/55">
          {liveStatusLine(team)}
        </span>
      </div>

      <LiveScoreboard team={team} horizontal />
    </div>
  );
}
