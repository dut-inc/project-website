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
 * …). `horizontal` renders a slim one-line strip for the collapsed card;
 * the default is the tall centered layout for the expanded view. MLB
 * additionally gets a classic B-S-O (balls / strikes / outs) scorebug;
 * sport-specific extras render as small chips for other leagues.
 */
export default function LiveScoreboard({
  team,
  large = false,
  horizontal = false,
}: {
  team: Team;
  large?: boolean;
  horizontal?: boolean;
}) {
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

  const score = (
    <div
      className={`whitespace-nowrap font-display font-semibold leading-none text-white tabular-nums ${
        horizontal ? "text-3xl sm:text-4xl" : large ? "text-5xl" : "text-4xl"
      }`}
    >
      {awayScore}
      <span
        className={`align-middle font-normal text-white/25 ${
          large ? "mx-2 text-2xl" : "mx-1.5 text-lg"
        }`}
      >
        –
      </span>
      {homeScore}
    </div>
  );

  const widget = bso ? (
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
  ) : null;

  if (horizontal) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex w-full items-center justify-center gap-3 sm:gap-5">
          {/* Away (left) */}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-2.5">
            <div className="min-w-0 text-right">
              <p className="truncate font-mono text-[11px] font-semibold uppercase tracking-wider text-white/80">
                {away.shortName}
              </p>
              <div className="mt-1 flex justify-end">
                <StatusDots status={game.awayStatus} />
              </div>
            </div>
            <TeamLogo colors={away.colors} shortName={away.shortName} logoUrl={away.logoUrl} size={38} />
          </div>

          <div className="flex shrink-0 flex-col items-center gap-1 border-x border-white/10 px-3 sm:px-5">
            {score}
          </div>

          {/* Home (right) */}
          <div className="flex min-w-0 flex-1 items-center justify-start gap-2 sm:gap-2.5">
            <TeamLogo colors={home.colors} shortName={home.shortName} logoUrl={home.logoUrl} size={38} />
            <div className="min-w-0">
              <p className="truncate font-mono text-[11px] font-semibold uppercase tracking-wider text-white/80">
                {home.shortName}
              </p>
              <div className="mt-1">
                <StatusDots status={game.homeStatus} />
              </div>
            </div>
          </div>
        </div>
        {widget && <div className="flex justify-center">{widget}</div>}
      </div>
    );
  }

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
      <div className="flex min-w-0 flex-col items-center gap-2 px-1">{score}</div>

      {/* Home (right) */}
      <div className="flex min-w-0 flex-col items-center gap-1.5">
        <TeamLogo colors={home.colors} shortName={home.shortName} logoUrl={home.logoUrl} size={large ? 52 : 44} />
        <span className="w-full truncate text-center font-mono text-[11px] uppercase tracking-wider text-white/70">
          {home.shortName}
        </span>
        <StatusDots status={game.homeStatus} />
      </div>

      {widget && (
        <div className="col-span-3 flex justify-center">{widget}</div>
      )}
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

/** Classic baseball scorebug: balls, strikes, outs as bare circles in a
 *  row (ball → strike → out), no labels, no box. */
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
      <div className="flex items-center gap-2.5">
        <DotRow count={3} filled={balls} filledClass="bg-emerald-400" />
        <DotRow count={3} filled={strikes} filledClass="bg-red-400" />
        <DotRow count={3} filled={outs} filledClass="bg-white/80" />
      </div>
      {runnersOn && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/45">{runnersOn}</span>
      )}
    </div>
  );
}

function DotRow({
  count,
  filled,
  filledClass,
}: {
  count: number;
  filled: number;
  filledClass: string;
}) {
  return (
    <div className="flex items-center gap-[5px]">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={`h-[7px] w-[7px] rounded-full ${i < filled ? filledClass : "bg-white/15"}`} />
      ))}
    </div>
  );
}
