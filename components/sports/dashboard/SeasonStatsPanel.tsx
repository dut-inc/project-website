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
      <div className="border border-dashed border-ink/20 bg-ink/[0.03] px-6 py-10 text-center">
        <p className="font-display text-xs font-medium uppercase tracking-[0.22em] text-ink2">
          Season data unavailable
        </p>
        {team.note && <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink/70">{team.note}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {stats.standings && stats.standings.length > 0 && (
        <section>
          <h4 className="mb-2 font-display text-[10px] font-medium uppercase tracking-[0.22em] text-ink2">
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
          <h4 className="mb-2 font-display text-[10px] font-medium uppercase tracking-[0.22em] text-ink2">
            Season leaders
          </h4>
          <LeadersList leaders={stats.leaders} />
        </section>
      )}
    </div>
  );
}
