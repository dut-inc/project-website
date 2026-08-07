"use client";

import { LEAGUES, formatRecord, formatStreak } from "@/lib/sports/leagues";
import type { Team } from "@/lib/sports/types";
import TeamLogo from "./TeamLogo";

const streakStyles: Record<string, string> = {
  W: "bg-emerald-400/15 text-emerald-300",
  L: "bg-red-400/15 text-red-300",
  T: "bg-white/10 text-white/60",
  D: "bg-white/10 text-white/60",
};

/**
 * Identity block for a team strip: logo + team name + league/record meta.
 * Names render without the "Seattle" prefix (this is the Seattle board —
 * the sign above already says it). Inactive teams (e.g. the SuperSonics
 * placeholder) carry no real data, so only the identity shows.
 */
export default function TeamCardHeader({ team }: { team: Team }) {
  const cfg = LEAGUES[team.league];
  const streak = formatStreak(team.streak);
  const inactive = team.status === "inactive";

  return (
    <div className="flex items-center gap-3">
      <TeamLogo colors={team.colors} shortName={team.shortName} logoUrl={team.logoUrl} size={46} />

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-xl font-semibold leading-tight text-white">
          {team.shortName}
        </h3>
        {!inactive && (
          <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-widest text-cream/50">
            {cfg.shortName}
            <span className="mx-1.5 text-cream/25">·</span>
            {formatRecord(team)}
            {team.record.label && (
              <>
                <span className="mx-1.5 text-cream/25">·</span>
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
