"use client";

import type { Team } from "@/lib/sports/types";
import LeadersList from "./LeadersList";
import StandingsTable from "./StandingsTable";
import StatSections from "./StatSections";

/** "Season" tab for the expanded view. Also used as the default view when
 *  there's no live game. Gracefully handles placeholder teams with no data. */
export default function SeasonStatsPanel({ team }: { team: Team }) {
  const stats = team.seasonStats;

  if (!stats) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-white/40">Season data unavailable</p>
        {team.note && <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55">{team.note}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {stats.standings && stats.standings.length > 0 && (
        <section>
          <h4 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-white/40">
            League standings
          </h4>
          <StandingsTable rows={stats.standings} />
        </section>
      )}

      <StatSections
        sections={[
          { title: "Offense", stats: stats.offense ?? [] },
          { title: "Defense", stats: stats.defense ?? [] },
          { title: "Misc", stats: stats.misc ?? [] },
        ]}
      />

      {stats.leaders && stats.leaders.length > 0 && (
        <section>
          <h4 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-white/40">
            Season leaders
          </h4>
          <LeadersList leaders={stats.leaders} />
        </section>
      )}
    </div>
  );
}
