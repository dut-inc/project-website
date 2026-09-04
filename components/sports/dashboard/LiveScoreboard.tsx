"use client";

import { shortTeamName } from "@/lib/sports/leagues";
import type { LiveTeamStatus, Team, TeamColors } from "@/lib/sports/types";
import TeamLogo from "./TeamLogo";

/** Neutral placeholder color for the opponent side (no real logo yet) —
 *  a warm gray that keeps the white initials readable on the white widget. */
const NEUTRAL_LOGO: TeamColors = {
  primary: "#6E6559",
  secondary: "#58514a",
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

  // MLB batter / pitcher — the batting side's batter (with their day's
  // hits/at-bats) and the defending side's pitcher (with pitch count),
  // rendered on the same row as the B-S-O count circles: batter under the
  // away team, pitcher under the home team.
  const battingSide = typeof sp?.Batting === "string" ? sp.Batting : undefined;
  const awayBats = battingSide === "away";
  const homeBats = battingSide === "home";
  const batterName = typeof sp?.Batter === "string" ? sp.Batter : undefined;
  const batterH = typeof sp?.["Batter H"] === "number" ? sp["Batter H"] : undefined;
  const batterAB = typeof sp?.["Batter AB"] === "number" ? sp["Batter AB"] : undefined;
  const pitcherName = typeof sp?.Pitcher === "string" ? sp.Pitcher : undefined;
  const pitches = typeof sp?.Pitches === "number" ? sp.Pitches : undefined;

  const playerLine = (side: "away" | "home"): string | null => {
    const isBatter = (side === "away" && awayBats) || (side === "home" && homeBats);
    if (isBatter) {
      if (!batterName) return null;
      // Name-only fallback when the day's H/AB isn't in the box roster yet.
      if (batterH === undefined || batterAB === undefined) return shortPlayerName(batterName);
      return `${shortPlayerName(batterName)} · ${batterH}/${batterAB}`;
    }
    if (!pitcherName) return null;
    if (pitches === undefined) return shortPlayerName(pitcherName);
    return `${shortPlayerName(pitcherName)} · ${pitches} ${pitches === 1 ? "pitch" : "pitches"}`;
  };
  const awayLine = playerLine("away");
  const homeLine = playerLine("home");

  const score = (
    <div
      className={`whitespace-nowrap font-display font-semibold leading-none text-ink tabular-nums ${
        horizontal ? "text-3xl sm:text-4xl" : large ? "text-5xl" : "text-4xl"
      }`}
    >
      {awayScore}
      <span
        className={`align-middle font-normal text-ink/25 ${
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
          className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-[10px] text-ink2 tabular-nums"
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
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ink/80">
                {away.shortName}
              </p>
              <div className="mt-1 flex justify-end">
                <StatusDots status={game.awayStatus} />
              </div>
            </div>
            <TeamLogo colors={away.colors} shortName={away.shortName} logoUrl={away.logoUrl} size={44} />
          </div>

          <div className="flex shrink-0 flex-col items-center gap-1 border-x border-ink/15 px-3 sm:px-5">
            {score}
          </div>

          {/* Home (right) */}
          <div className="flex min-w-0 flex-1 items-center justify-start gap-2 sm:gap-2.5">
            <TeamLogo colors={home.colors} shortName={home.shortName} logoUrl={home.logoUrl} size={44} />
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ink/80">
                {home.shortName}
              </p>
              <div className="mt-1">
                <StatusDots status={game.homeStatus} />
              </div>
            </div>
          </div>
        </div>

        {/* Second row: away batter | B-S-O | home pitcher — the player
            names sit on the same level as the count circles. */}
        {(widget || awayLine || homeLine) && (
          <div className="flex w-full items-center justify-center gap-3 sm:gap-5">
            <div className="flex min-w-0 flex-1 justify-end">
              {awayLine && (
                <p className="font-mono text-[10px] font-semibold leading-tight tabular-nums text-ink2">
                  {awayLine}
                </p>
              )}
            </div>
            <div className="flex shrink-0 justify-center">{widget}</div>
            <div className="flex min-w-0 flex-1 justify-start">
              {homeLine && (
                <p className="font-mono text-[10px] font-semibold leading-tight tabular-nums text-ink2">
                  {homeLine}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      {/* Away (left) */}
      <div className="flex min-w-0 flex-col items-center gap-1.5">
        <TeamLogo colors={away.colors} shortName={away.shortName} logoUrl={away.logoUrl} size={large ? 60 : 52} />
        <span className="w-full text-center font-mono text-[11px] uppercase tracking-wider text-ink/80">
          {away.shortName}
        </span>
        <StatusDots status={game.awayStatus} />
      </div>

      {/* Score (centered) */}
      <div className="flex min-w-0 flex-col items-center gap-2 px-1">{score}</div>

      {/* Home (right) */}
      <div className="flex min-w-0 flex-col items-center gap-1.5">
        <TeamLogo colors={home.colors} shortName={home.shortName} logoUrl={home.logoUrl} size={large ? 60 : 52} />
        <span className="w-full text-center font-mono text-[11px] uppercase tracking-wider text-ink/80">
          {home.shortName}
        </span>
        <StatusDots status={game.homeStatus} />
      </div>

      {/* Second row: away batter | B-S-O | home pitcher — the player names
          sit on the same level as the count circles. */}
      {(widget || awayLine || homeLine) && (
        <>
          <div className="flex items-center justify-center">
            {awayLine && (
              <p className="font-mono text-[10px] font-semibold leading-tight tabular-nums text-ink2">
                {awayLine}
              </p>
            )}
          </div>
          <div className="flex justify-center">{widget}</div>
          <div className="flex items-center justify-center">
            {homeLine && (
              <p className="font-mono text-[10px] font-semibold leading-tight tabular-nums text-ink2">
                {homeLine}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** "Cal Raleigh" → "C. Raleigh" — compact scorebug style for the card. */
function shortPlayerName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return fullName;
  return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
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
          className={`h-[5px] w-[5px] rounded-full ${i < remaining ? "bg-ink/70" : "bg-ink/20"}`}
        />
      ))}
    </div>
  );
}

/** Classic baseball scorebug: balls, strikes, outs as bare circles stacked
 *  in vertical columns — 3 balls, 2 strikes, 2 outs (the real max count
 *  for each) — bottom-aligned so each column fills upward. No labels. */
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
      <div className="flex items-end gap-2.5">
        <DotColumn count={3} filled={balls} filledClass="bg-market-olive" />
        <DotColumn count={2} filled={strikes} filledClass="bg-[#C0392B]" />
        <DotColumn count={2} filled={outs} filledClass="bg-ink/70" />
      </div>
      {runnersOn && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink2/80">{runnersOn}</span>
      )}
    </div>
  );
}

function DotColumn({
  count,
  filled,
  filledClass,
}: {
  count: number;
  filled: number;
  filledClass: string;
}) {
  return (
    <div className="flex flex-col items-center gap-[5px]">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={`h-[7px] w-[7px] rounded-full ${i < filled ? filledClass : "bg-ink/15"}`} />
      ))}
    </div>
  );
}
