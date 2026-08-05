"use client";

import { shortTeamName } from "@/lib/sports/leagues";
import type { LiveTeamStatus, Team, TeamColors } from "@/lib/sports/types";
import TeamLogo from "./TeamLogo";

/** Neutral placeholder colors for the opponent side (no real logo yet). */
const NEUTRAL_LOGO: TeamColors = {
  primary: "rgba(255,255,255,0.14)",
  secondary: "rgba(255,255,255,0.06)",
};

/**
 * Scoreboard used by both the collapsed live card and the expanded Game
 * tab: away team on the left, home team on the right, score centered,
 * and a row of small status dots under each logo (timeouts, challenges,
 * …). MLB additionally gets a classic B-S-O (balls / strikes / outs)
 * scorebug. Sport-specific extras render as small chips for other leagues.
 */
export default function LiveScoreboard({ team, large = false }: { team: Team; large?: boolean }) {
  const game = team.currentGame;
  if (!game) return null;

  const isHome = game.at === "home";
  const away = isHome
    ? { shortName: shortTeamName(game.opponent), colors: NEUTRAL_LOGO, logoUrl: undefined }
    : { shortName: team.shortName, colors: team.colors, logoUrl: team.logoUrl };
  const home = isHome
    ? { shortName: team.shortName, colors: team.colors, logoUrl: team.logoUrl }
    : { shortName: shortTeamName(game.opponent), colors: NEUTRAL_LOGO, logoUrl: undefined };
  const awayScore = isHome ? game.opponentScore : game.teamScore;
  const homeScore = isHome ? game.teamScore : game.opponentScore;

  const sp = game.sportSpecific;
  const isMlb = team.league === "mlb";
  const balls = typeof sp?.Balls === "number" ? sp.Balls : undefined;
  const strikes = typeof sp?.Strikes === "number" ? sp.Strikes : undefined;
  const outs = typeof sp?.Outs === "number" ? sp.Outs : undefined;
  const bso = isMlb && balls !== undefined && strikes !== undefined && outs !== undefined;
  const runnersOn = typeof sp?.["Runners on"] === "string" ? sp["Runners on"] : undefined;
  const chips = !bso && sp ? Object.entries(sp) : [];

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      {/* Away (left) */}
      <div className="flex min-w-0 flex-col items-center gap-1.5">
        <TeamLogo colors={away.colors} shortName={away.shortName} logoUrl={away.logoUrl} size={large ? 52 : 44} />
        <span className="w-full truncate text-center font-mono text-[11px] uppercase tracking-wider text-white/70">
          {away.shortName}
        </span>
        <StatusDots status={game.awayStatus} />
      </div>

      {/* Score + sport-specific widget (centered) */}
      <div className="flex min-w-0 flex-col items-center gap-2 px-1">
        <div
          className={`whitespace-nowrap font-display font-semibold leading-none text-white tabular-nums ${
            large ? "text-5xl" : "text-4xl"
          }`}
        >
          {awayScore}
          <span className={`align-middle font-normal text-white/25 ${large ? "mx-2 text-2xl" : "mx-1.5 text-lg"}`}>
            –
          </span>
          {homeScore}
        </div>
        {bso ? (
          <BaseballBso balls={balls} strikes={strikes} outs={outs} runnersOn={runnersOn} />
        ) : chips.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-1">
            {chips.map(([label, value]) => (
              <span
                key={label}
                title={label}
                className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/50 tabular-nums"
              >
                {label} {value}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Home (right) */}
      <div className="flex min-w-0 flex-col items-center gap-1.5">
        <TeamLogo colors={home.colors} shortName={home.shortName} logoUrl={home.logoUrl} size={large ? 52 : 44} />
        <span className="w-full truncate text-center font-mono text-[11px] uppercase tracking-wider text-white/70">
          {home.shortName}
        </span>
        <StatusDots status={game.homeStatus} />
      </div>
    </div>
  );
}

/** Small dots under a team logo: filled = remaining timeouts/challenges. */
function StatusDots({ status }: { status?: LiveTeamStatus }) {
  const remaining = status?.remaining ?? 0;
  const count = Math.max(status?.total ?? remaining, remaining);
  if (count <= 0) return null;
  return (
    <div
      className="flex items-center justify-center gap-[3px]"
      role="img"
      aria-label={status?.label ?? "Team status"}
    >
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={`h-[5px] w-[5px] rounded-full ${i < remaining ? "bg-white/70" : "bg-white/15"}`}
        />
      ))}
    </div>
  );
}

/** Classic baseball scorebug: B-S-O with filled dots. */
function BaseballBso({
  balls,
  strikes,
  outs,
  runnersOn,
}: {
  balls: number;
  strikes: number;
  outs: number;
  runnersOn?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-black/30 px-2.5 py-1.5">
        <DotCluster label="B" count={3} filled={balls} filledClass="bg-emerald-400" />
        <DotCluster label="S" count={3} filled={strikes} filledClass="bg-red-400" />
        <DotCluster label="O" count={3} filled={outs} filledClass="bg-white/80" />
      </div>
      {runnersOn && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/45">{runnersOn}</span>
      )}
    </div>
  );
}

function DotCluster({
  label,
  count,
  filled,
  filledClass,
}: {
  label: string;
  count: number;
  filled: number;
  filledClass: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-white/40">{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: count }).map((_, i) => (
          <span key={i} className={`h-[5px] w-[5px] rounded-full ${i < filled ? filledClass : "bg-white/15"}`} />
        ))}
      </div>
    </div>
  );
}
