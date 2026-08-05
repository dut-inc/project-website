"use client";

import { LEAGUES, formatRecord, formatStreak } from "@/lib/sports/leagues";
import type { Team } from "@/lib/sports/types";
import TeamLogo from "./TeamLogo";
import { TrophyIcon } from "./icons";

const streakStyles: Record<string, string> = {
  W: "bg-emerald-400/15 text-emerald-300",
  L: "bg-red-400/15 text-red-300",
  T: "bg-white/10 text-white/60",
  D: "bg-white/10 text-white/60",
};

export default function TeamCardHeader({ team }: { team: Team }) {
  const cfg = LEAGUES[team.league];
  const streak = formatStreak(team.streak);
  // Inactive teams (e.g. the SuperSonics placeholder) carry no real data, so
  // the header shows just the identity: logo + name.
  const inactive = team.status === "inactive";

  return (
    <div className="flex items-center gap-3.5">
      <TeamLogo colors={team.colors} shortName={team.shortName} logoUrl={team.logoUrl} size={52} />

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-lg font-semibold leading-tight text-white">
          {team.name}
        </h3>
        {!inactive && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px] uppercase tracking-wider text-white/45">
            <span>{cfg.shortName}</span>
            <span className="text-white/20">·</span>
            <span>{formatRecord(team)}</span>
            {team.record.label && (
              <>
                <span className="text-white/20">·</span>
                <span>{team.record.label}</span>
              </>
            )}
          </div>
        )}
      </div>

      {!inactive && (
        <div className="flex shrink-0 flex-col items-end gap-2">
          {streak !== "—" ? (
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums ${
                streakStyles[team.streak.type] ?? streakStyles.T
              }`}
              title={`${team.streak.type === "W" ? "Won" : team.streak.type === "L" ? "Lost" : "Drawn"} ${team.streak.count} straight`}
            >
              {streak}
            </span>
          ) : (
            <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[11px] text-white/35">—</span>
          )}
          {team.championships > 0 && (
            <span
              className="flex items-center gap-1 font-mono text-[11px] font-semibold text-pinGold"
              title={`${team.championships} championship${team.championships === 1 ? "" : "s"}`}
            >
              <TrophyIcon className="h-3.5 w-3.5" />
              {team.championships}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
