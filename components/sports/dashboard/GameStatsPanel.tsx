"use client";

import { liveStatusLine } from "@/lib/sports/leagues";
import type { Team } from "@/lib/sports/types";
import LeadersList from "./LeadersList";
import LiveScoreboard from "./LiveScoreboard";
import ScoringSummary from "./ScoringSummary";
import StatSections from "./StatSections";
import { LiveDot } from "./icons";

/** "Game" tab for the expanded view — only rendered while a game is live. */
export default function GameStatsPanel({ team }: { team: Team }) {
  const game = team.currentGame;
  if (!game) return null;

  const stats = team.gameStats;

  return (
    <div className="space-y-5">
      {/* Live score banner */}
      <div
        className="border border-ink/10 p-4 sm:p-5"
        style={{ background: `${team.colors.primary}1A` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="flex items-center gap-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-market-red">
            <LiveDot className="h-1.5 w-1.5" />
            {game.at === "home" ? "vs" : "at"} {game.opponent}
          </p>
          <p className="font-mono text-xs font-semibold text-ink">{liveStatusLine(team)}</p>
        </div>
        <div className="mt-4">
          <LiveScoreboard team={team} large />
        </div>
        {game.channel && (
          <p className="mt-3 text-center font-display text-[10px] font-medium uppercase tracking-[0.22em] text-ink2/70">
            {game.channel}
          </p>
        )}
      </div>

      {stats?.teamStats && stats.teamStats.length > 0 && (
        <StatSections sections={[{ title: "Team stats", stats: stats.teamStats }]} />
      )}

      {stats?.scoring && stats.scoring.length > 0 && (
        <section>
          <h4 className="mb-2 font-display text-[10px] font-medium uppercase tracking-[0.22em] text-ink2">
            Scoring summary
          </h4>
          <ScoringSummary events={stats.scoring} />
        </section>
      )}

      {stats?.leaders && stats.leaders.length > 0 && (
        <section>
          <h4 className="mb-2 font-display text-[10px] font-medium uppercase tracking-[0.22em] text-ink2">
            Player leaders
          </h4>
          <LeadersList leaders={stats.leaders} />
        </section>
      )}
    </div>
  );
}
