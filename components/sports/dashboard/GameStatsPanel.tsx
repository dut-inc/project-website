"use client";

import { liveStatusLine, scoreLine } from "@/lib/sports/leagues";
import type { Team } from "@/lib/sports/types";
import LeadersList from "./LeadersList";
import ScoringSummary from "./ScoringSummary";
import StatSections from "./StatSections";

/** "Game" tab for the expanded view — only rendered while a game is live. */
export default function GameStatsPanel({ team }: { team: Team }) {
  const game = team.currentGame;
  if (!game) return null;

  const stats = team.gameStats;
  const sportSpecific = game.sportSpecific ? Object.entries(game.sportSpecific) : [];

  return (
    <div className="space-y-5">
      {/* Live score banner */}
      <div
        className="rounded-2xl border border-white/5 p-4"
        style={{
          background: `linear-gradient(135deg, ${team.colors.primary}33 0%, rgba(22,23,27,0.6) 55%, ${team.colors.secondary}26 100%)`,
        }}
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-red-400">
              {game.at === "home" ? "vs" : "at"} {game.opponent} · Live
            </p>
            <p className="mt-2 font-display text-4xl font-semibold text-white tabular-nums">
              {game.teamScore}
              <span className="mx-2 text-xl font-normal text-white/30">–</span>
              {game.opponentScore}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-semibold text-white/90">{liveStatusLine(team)}</p>
            {game.channel && (
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-white/40">
                {game.channel}
              </p>
            )}
          </div>
        </div>
        {sportSpecific.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sportSpecific.map(([label, value]) => (
              <span
                key={label}
                className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/60 tabular-nums"
              >
                {label}: <span className="font-semibold text-white/85">{value}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {stats?.teamStats && stats.teamStats.length > 0 && (
        <StatSections sections={[{ title: "Team stats", stats: stats.teamStats }]} />
      )}

      {stats?.scoring && stats.scoring.length > 0 && (
        <section>
          <h4 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-white/40">
            Scoring summary
          </h4>
          <ScoringSummary events={stats.scoring} />
        </section>
      )}

      {stats?.leaders && stats.leaders.length > 0 && (
        <section>
          <h4 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-white/40">
            Player leaders
          </h4>
          <LeadersList leaders={stats.leaders} />
        </section>
      )}
    </div>
  );
}
