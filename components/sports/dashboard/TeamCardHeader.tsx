"use client";

import { LEAGUES, formatRecord, formatStreak } from "@/lib/sports/leagues";
import type { Team } from "@/lib/sports/types";
import TeamLogo from "./TeamLogo";

const streakStyles: Record<string, string> = {
  W: "bg-market-oliveLight text-market-olive",
  L: "bg-[#F3DAD2] text-[#8A3B28]",
  T: "bg-ink/5 text-ink2",
  D: "bg-ink/5 text-ink2",
};

/**
 * Identity block for a team strip: big logo + team name + league/record
 * meta, styled for the white storefront widgets (ink text). Names render
 * without the "Seattle" prefix (this is the Seattle board — the sign above
 * already says it). Inactive teams (e.g. the SuperSonics placeholder)
 * carry no real data, so only the identity shows.
 */
export default function TeamCardHeader({ team }: { team: Team }) {
  const cfg = LEAGUES[team.league];
  const streak = formatStreak(team.streak);
  const inactive = team.status === "inactive";

  return (
    <div className="flex items-center gap-3.5">
      <TeamLogo colors={team.colors} shortName={team.shortName} logoUrl={team.logoUrl} size={60} />

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-2xl font-semibold leading-tight text-ink">
          {team.shortName}
        </h3>
        {!inactive && (
          <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-widest text-ink2">
            {cfg.shortName}
            <span className="mx-1.5 text-ink/30">·</span>
            {formatRecord(team)}
            {team.record.label && (
              <>
                <span className="mx-1.5 text-ink/30">·</span>
                {team.record.label}
              </>
            )}
          </p>
        )}
      </div>

      {!inactive && streak !== "—" && (
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums ${
            streakStyles[team.streak.type] ?? streakStyles.T
          }`}
          title={`${team.streak.type === "W" ? "Won" : team.streak.type === "L" ? "Lost" : "Drawn"} ${team.streak.count} straight`}
        >
          {streak}
        </span>
      )}
    </div>
  );
}
