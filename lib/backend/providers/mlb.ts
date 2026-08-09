// lib/backend/providers/mlb.ts
//
// MLB provider — Seattle Mariners via MLB's official, keyless Stats API
// (statsapi.mlb.com). This is the one league with a complete official free
// API, so it gets its own provider rather than the ESPN adapter.
//
// Endpoints used:
//   GET /api/v1/schedule?sportId=1&teamId=136&startDate=..&endDate=..
//   GET /api/v1.1/game/{gamePk}/feed/live          (live game detail)
//   GET /api/v1/teams/136/stats?group=hitting&group=pitching&stats=season
//   GET /api/v1/standings?leagueId=103&season=..
//   GET /api/v1/teams/136/leaders?leaderCategories=..
//
// The parse* functions are exported so tests can exercise normalization
// against captured fixtures without hitting the network.

import type {
  GameStats,
  GameSummary,
  HomeAway,
  LiveGame,
  Outcome,
  PlayerLeader,
  ScoringEvent,
  ScheduledGame,
  SeasonStats,
  StatLine,
  StandingsRow,
  Streak,
  TeamRecord,
} from "../../sports/types.ts";
import { fetchJson } from "../http.ts";
import { formatTimePT, ordinal, streakFromOutcomes } from "../normalize.ts";
import type { ProviderData, ProviderResult, TeamProvider } from "./types.ts";

const API = "https://statsapi.mlb.com/api/v1";

// ---------------------------------------------------------------------------
// Schedule parsing
// ---------------------------------------------------------------------------

interface MlbGame {
  gamePk: number;
  gameDate: string;
  officialDate: string;
  /** "R" = regular season, "S" = spring training, "F"/"D" = postseason. */
  gameType?: string;
  status: { abstractGameState: string; detailedState: string };
  teams: {
    away: { team: { id: number; name: string }; score?: number; isWinner?: boolean; leagueRecord?: { wins: number; losses: number } };
    home: { team: { id: number; name: string }; score?: number; isWinner?: boolean; leagueRecord?: { wins: number; losses: number } };
  };
}

interface MlbSchedule {
  dates?: Array<{ games?: MlbGame[] }>;
}

export interface ParsedMlbGame {
  gamePk: number;
  date: string;
  iso: string;
  opponent: string;
  at: HomeAway;
  teamScore?: number;
  opponentScore?: number;
  outcome?: Outcome;
  state: "post" | "in" | "pre" | "postponed";
  record?: { wins: number; losses: number };
  gameType?: string;
}

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v !== "" && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

/** Normalize one MLB schedule game for our team id. */
export function parseMlbGame(game: MlbGame, teamId: number): ParsedMlbGame | null {
  const away = game.teams.away;
  const home = game.teams.home;
  const isHome = home.team.id === teamId;
  const isAway = away.team.id === teamId;
  if (!isHome && !isAway) return null;

  const ours = isHome ? home : away;
  const theirs = isHome ? away : home;
  const state = game.status.abstractGameState;
  const mappedState: ParsedMlbGame["state"] =
    state === "Final" ? "post" : state === "Live" ? "in" : state === "Postponed" ? "postponed" : "pre";

  return {
    gamePk: game.gamePk,
    date: game.officialDate,
    iso: game.gameDate,
    opponent: theirs.team.name,
    at: isHome ? "home" : "away",
    teamScore: num(ours.score),
    opponentScore: num(theirs.score),
    outcome: mappedState === "post" ? (ours.isWinner ? "W" : "L") : undefined,
    state: mappedState,
    record: ours.leagueRecord ? { wins: ours.leagueRecord.wins, losses: ours.leagueRecord.losses } : undefined,
    gameType: game.gameType,
  };
}

/** Split an MLB schedule into completed / live / upcoming games. */
/**
 * Split an MLB schedule into completed / live / upcoming games. Spring
 * training games (gameType "S") are excluded from completed + streak so a
 * preseason blowout never skews the dashboard's record or streak.
 */
export function parseMlbSchedule(
  schedule: MlbSchedule,
  teamId: number,
): { completed: ParsedMlbGame[]; live: ParsedMlbGame | null; upcoming: ParsedMlbGame[] } {
  const games = (schedule.dates ?? []).flatMap((d) => d.games ?? []);
  const parsed = games.map((g) => parseMlbGame(g, teamId)).filter((g): g is ParsedMlbGame => g !== null);

  const completed = parsed
    .filter((g) => g.state === "post" && (g as ParsedMlbGame & { gameType?: string }).gameType !== "S")
    .sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = parsed
    .filter((g) => g.state === "pre" && (g as ParsedMlbGame & { gameType?: string }).gameType !== "S")
    .sort((a, b) => a.date.localeCompare(b.date) || a.iso.localeCompare(b.iso));
  const live = parsed.find((g) => g.state === "in") ?? null;

  return { completed, live, upcoming };
}

// ---------------------------------------------------------------------------
// Live feed (balls / strikes / outs / inning + box stats)
// ---------------------------------------------------------------------------

interface MlbBoxTeam {
  teamStats?: {
    batting?: Record<string, number | string>;
    pitching?: Record<string, number | string>;
    fielding?: Record<string, number | string>;
  };
  /** Per-player stat map, keyed by `ID{personId}`. The live feed's box
   *  `batters`/`pitchers` arrays hold bare ids, so the current batter's day
   *  stats (hits / at-bats) and the current pitcher's pitch count come from
   *  here. */
  players?: Record<
    string,
    {
      person?: { id?: number; fullName?: string };
      stats?: {
        batting?: { atBats?: number; hits?: number; summary?: string };
        pitching?: { numberOfPitches?: number; summary?: string };
      };
    }
  >;
}

interface MlbLiveFeed {
  liveData?: {
    linescore?: {
      currentInning?: number;
      isTopInning?: boolean;
      outs?: number;
      balls?: number;
      strikes?: number;
      runnersOnBase?: unknown[];
      innings?: Array<{
        num?: number;
        ordinalNum?: string;
        home?: { runs?: number };
        away?: { runs?: number };
      }>;
      teams?: { home?: { runs?: number }; away?: { runs?: number } };
      /** Who's at the plate this half-inning. NOTE: the offense object's own
       *  `pitcher` field is the BATTING team's pitcher (e.g. the one who
       *  pitched the previous half-inning), so the current pitcher always
       *  comes from `defense`. */
      offense?: {
        batter?: { id?: number; fullName?: string };
      };
      /** Who's on the mound this half-inning (the defending team). */
      defense?: {
        pitcher?: { id?: number; fullName?: string };
      };
    };
    boxscore?: {
      teams?: {
        home?: MlbBoxTeam;
        away?: MlbBoxTeam;
      };
    };
  };
}

/** Build a live-game view from the MLB live feed. */
export function parseMlbLiveFeed(
  feed: MlbLiveFeed,
  game: ParsedMlbGame,
): { currentGame: LiveGame; gameStats?: GameStats } {
  const ls = feed.liveData?.linescore;
  const inning = ls?.currentInning ?? 0;
  const top = ls?.isTopInning ?? true;
  const outs = ls?.outs ?? 0;
  const balls = ls?.balls ?? 0;
  const strikes = ls?.strikes ?? 0;

  const baseNames = ["1st", "2nd", "3rd"];
  const runnerDetail = (ls?.runnersOnBase ?? [])
    .map((r) => baseNames[(r as { base?: string }).base === "1B" ? 0 : (r as { base?: string }).base === "2B" ? 1 : 2])
    .filter(Boolean);
  // Outs are already rendered as the B-S-O circles on the live widget, so
  // the status line only carries runner detail ("runners on 1st & 2nd").
  const detailParts: string[] = [];
  if (runnerDetail.length > 0) detailParts.push(`runners on ${runnerDetail.join(" & ")}`);

  // Current batter / pitcher. The batting side's batter and the defending
  // side's pitcher come from the linescore; their day stats (batter
  // hits/at-bats, pitcher pitch count) are matched by id against the box
  // `players` map, keyed "ID{personId}".
  const box = feed.liveData?.boxscore?.teams;
  const battingSide: "away" | "home" = top ? "away" : "home";
  const battingBox = battingSide === "away" ? box?.away : box?.home;
  const pitchingBox = battingSide === "away" ? box?.home : box?.away;
  const batter = ls?.offense?.batter;
  // `linescore.offense.pitcher` is the BATTING team's pitcher (e.g. the one
  // who pitched the previous half-inning) — the actual current pitcher is
  // on the defense side of the linescore.
  const pitcher = ls?.defense?.pitcher;
  const batterStats =
    batter?.id !== undefined ? battingBox?.players?.[`ID${batter.id}`]?.stats?.batting : undefined;
  const pitcherStats =
    pitcher?.id !== undefined ? pitchingBox?.players?.[`ID${pitcher.id}`]?.stats?.pitching : undefined;

  const homeRuns = ls?.teams?.home?.runs;
  const awayRuns = ls?.teams?.away?.runs;
  const teamScore = game.at === "home" ? homeRuns ?? game.teamScore ?? 0 : awayRuns ?? game.teamScore ?? 0;
  const opponentScore = game.at === "home" ? awayRuns ?? game.opponentScore ?? 0 : homeRuns ?? game.opponentScore ?? 0;

  const currentGame: LiveGame = {
    opponent: game.opponent,
    at: game.at,
    teamScore,
    opponentScore,
    period: `${top ? "Top" : "Bottom"} ${ordinal(inning)}`,
    detail: detailParts.length > 0 ? detailParts.join(" · ") : undefined,
    sportSpecific: {
      Balls: balls,
      Strikes: strikes,
      Outs: outs,
      Batting: battingSide,
      ...(batter?.fullName ? { Batter: batter.fullName } : {}),
      ...(batterStats?.hits !== undefined && batterStats?.atBats !== undefined
        ? { "Batter H": batterStats.hits, "Batter AB": batterStats.atBats }
        : {}),
      ...(pitcher?.fullName ? { Pitcher: pitcher.fullName } : {}),
      ...(pitcherStats?.numberOfPitches !== undefined
        ? { Pitches: pitcherStats.numberOfPitches }
        : {}),
    },
  };

  // Team stat lines from the boxscore ("9 – 6" style, ours first).
  const oursBox = game.at === "home" ? box?.home : box?.away;
  const theirsBox = game.at === "home" ? box?.away : box?.home;
  const statOf = (rec: Record<string, string | number> | undefined, key: string): string | number | undefined => rec?.[key];
  const teamStats: StatLine[] = [];
  const batPairs: Array<[string, string]> = [
    ["hits", "Hits"],
    ["homeRuns", "Home runs"],
    ["leftOnBase", "Left on base"],
    ["strikeOuts", "Strikeouts"],
  ];
  for (const [key, label] of batPairs) {
    const ours = statOf(oursBox?.teamStats?.batting, key);
    const theirs = statOf(theirsBox?.teamStats?.batting, key);
    if (ours !== undefined && theirs !== undefined) teamStats.push({ label, value: `${ours} – ${theirs}` });
  }
  const oursErr = statOf(oursBox?.teamStats?.fielding, "errors");
  const theirsErr = statOf(theirsBox?.teamStats?.fielding, "errors");
  if (oursErr !== undefined && theirsErr !== undefined) {
    teamStats.push({ label: "Errors", value: `${oursErr} – ${theirsErr}` });
  }

  // Scoring summary: one line per inning with runs, from the linescore.
  // Home runs land in the "B" (bottom) half, away runs in the "T" (top) —
  // and "seattle" only when the scoring side is ours.
  const scoring: ScoringEvent[] = [];
  if (ls?.innings) {
    let homeTotal = 0;
    let awayTotal = 0;
    const oppAbbr = game.opponent.split(" ").slice(-1)[0].toUpperCase().slice(0, 3) || "OPP";
    for (const inn of ls.innings) {
      const n = inn.num ?? 0;
      const homeRunsInn = inn.home?.runs ?? 0;
      const awayRunsInn = inn.away?.runs ?? 0;
      homeTotal += homeRunsInn;
      awayTotal += awayRunsInn;
      const emit = (runs: number, period: string, side: "seattle" | "opponent") => {
        if (runs <= 0) return;
        scoring.push({
          period,
          side,
          description: `${runs} run${runs > 1 ? "s" : ""} scored`,
          score: `SEA ${homeTotal} – ${awayTotal} ${oppAbbr}`,
        });
      };
      emit(homeRunsInn, `B${n}`, game.at === "home" ? "seattle" : "opponent");
      emit(awayRunsInn, `T${n}`, game.at === "home" ? "opponent" : "seattle");
    }
  }

  const gameStats: GameStats | undefined =
    teamStats.length > 0 || scoring.length > 0
      ? { teamStats: teamStats.length > 0 ? teamStats : undefined, scoring: scoring.length > 0 ? scoring : undefined }
      : undefined;

  return { currentGame, gameStats };
}

// ---------------------------------------------------------------------------
// Team stats + standings + leaders (season view)
// ---------------------------------------------------------------------------

interface MlbTeamStatsResponse {
  stats?: Array<{
    group?: { displayName?: string };
    splits?: Array<{ stat?: Record<string, string | number> }>;
  }>;
}

/** Season stat lines from the team hitting/pitching groups. */
export function parseMlbTeamStats(json: MlbTeamStatsResponse): { offense?: StatLine[]; defense?: StatLine[] } {
  const groups = new Map<string, Record<string, string | number>>();
  for (const g of json.stats ?? []) {
    const split = g.splits?.[0]?.stat;
    const name = g.group?.displayName?.toLowerCase();
    if (split && name) groups.set(name, split);
  }
  const hitting = groups.get("hitting");
  const pitching = groups.get("pitching");

  const offense: StatLine[] = [];
  if (hitting) {
    const lines: Array<[keyof typeof hitting, string, string?]> = [
      ["avg", "Batting average"],
      ["runs", "Runs"],
      ["homeRuns", "Home runs"],
      ["ops", "OPS"],
    ];
    for (const [key, label] of lines) {
      const v = hitting[key];
      if (v !== undefined) offense.push({ label, value: String(v) });
    }
  }
  const defense: StatLine[] = [];
  if (pitching) {
    const lines: Array<[keyof typeof pitching, string]> = [
      ["era", "Team ERA"],
      ["whip", "WHIP"],
      ["strikeOuts", "Strikeouts"],
    ];
    for (const [key, label] of lines) {
      const v = pitching[key];
      if (v !== undefined) defense.push({ label, value: String(v) });
    }
  }

  return {
    offense: offense.length > 0 ? offense : undefined,
    defense: defense.length > 0 ? defense : undefined,
  };
}

interface MlbStandingsResponse {
  records?: Array<{
    division?: { id?: number; name?: string };
    teamRecords?: Array<{
      team?: { id?: number; name?: string };
      wins?: number;
      losses?: number;
      gamesBack?: string;
      divisionRank?: string;
    }>;
  }>;
}

/** Division standings table (top 6 rows around our team). */
export function parseMlbStandings(
  json: MlbStandingsResponse,
  teamId: number,
): { rows: StandingsRow[]; position?: number } {
  for (const group of json.records ?? []) {
    const records = group.teamRecords ?? [];
    const idx = records.findIndex((r) => r.team?.id === teamId);
    if (idx === -1) continue;
    const sorted = [...records].sort((a, b) => Number(a.divisionRank ?? 999) - Number(b.divisionRank ?? 999));
    const rows: StandingsRow[] = sorted.map((r, i) => ({
      position: i + 1,
      team: r.team?.name ?? "Unknown",
      record: `${r.wins ?? 0}-${r.losses ?? 0}`,
      gamesBack: r.gamesBack === "-" ? undefined : r.gamesBack,
    }));
    return { rows: rows.slice(0, 6), position: (Number(sorted[idx].divisionRank) || idx + 1) };
  }
  return { rows: [] };
}

interface MlbLeadersResponse {
  teamLeaders?: Array<{
    leaderCategory?: string;
    leaders?: Array<{ person?: { fullName?: string }; value?: string | number }>;
  }>;
}

/** Team leaders from the team-leaders endpoint (best-effort). */
export function parseMlbTeamLeaders(json: MlbLeadersResponse): PlayerLeader[] {
  const leaders: PlayerLeader[] = [];
  const seen = new Set<string>();
  for (const cat of json.teamLeaders ?? []) {
    const top = cat.leaders?.[0];
    if (!top?.person?.fullName || top.value === undefined) continue;
    const label = (cat.leaderCategory ?? "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (c) => c.toUpperCase());
    // The team-leaders endpoint can repeat a category (e.g. stolenBases
    // under both hitting and pitching), which previously produced duplicate
    // React list keys. Keep one row per category + player.
    const key = `${label}|${top.person.fullName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    leaders.push({ label, player: top.person.fullName, value: String(top.value) });
  }
  return leaders;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function buildMlbProvider(teamId: number): TeamProvider {
  return {
    league: "mlb",

    fetch: async (): Promise<ProviderResult> => {
      try {
        const now = new Date();
        const year = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
        const start = `${year}-02-20`;
        const end = `${year}-11-30`;

        const schedule = await fetchJson<MlbSchedule>(
          `${API}/schedule?sportId=1&teamId=${teamId}&startDate=${start}&endDate=${end}`,
        );
        const { completed, live, upcoming } = parseMlbSchedule(schedule, teamId);
        const lastCompleted = completed[completed.length - 1];

        const streak: Streak = streakFromOutcomes(completed.slice(-10).map((g) => g.outcome ?? "W"));
        const record: TeamRecord | undefined = lastCompleted?.record
          ? { wins: lastCompleted.record.wins, losses: lastCompleted.record.losses, label: String(year) }
          : undefined;

        const previousGame: GameSummary | undefined = lastCompleted
          ? {
              date: lastCompleted.date,
              opponent: lastCompleted.opponent,
              at: lastCompleted.at,
              outcome: lastCompleted.outcome ?? "W",
              teamScore: lastCompleted.teamScore ?? 0,
              opponentScore: lastCompleted.opponentScore ?? 0,
              note: "F",
            }
          : undefined;

        let currentGame: LiveGame | undefined;
        let gameStats: GameStats | undefined;
        if (live) {
          try {
            const feed = await fetchJson<MlbLiveFeed>(`https://statsapi.mlb.com/api/v1.1/game/${live.gamePk}/feed/live`);
            const parsed = parseMlbLiveFeed(feed, live);
            currentGame = parsed.currentGame;
            gameStats = parsed.gameStats;
          } catch {
            currentGame = {
              opponent: live.opponent,
              at: live.at,
              teamScore: live.teamScore ?? 0,
              opponentScore: live.opponentScore ?? 0,
              period: "In progress",
            };
          }
        }

        const nextGames: ScheduledGame[] = upcoming.slice(0, 3).map((g) => ({
          date: g.date,
          time: formatTimePT(g.iso),
          opponent: g.opponent,
          at: g.at,
        }));

        // Season view: team stats, standings, leaders (each best-effort).
        let seasonStats: SeasonStats | undefined;
        try {
          const teamStatsJson = await fetchJson<MlbTeamStatsResponse>(
            `${API}/teams/${teamId}/stats?season=${year}&group=hitting&group=pitching&sportIds=1&stats=season`,
          );
          const standingsJson = await fetchJson<MlbStandingsResponse>(
            `${API}/standings?leagueId=103&season=${year}&standingsTypes=regularSeason`,
          );
          const statLines = parseMlbTeamStats(teamStatsJson);
          const { rows, position } = parseMlbStandings(standingsJson, teamId);
          if (record && position !== undefined) record.position = position;
          seasonStats = { ...statLines, standings: rows.length ? rows : undefined };
        } catch {
          seasonStats = undefined;
        }

        let leaders: PlayerLeader[] | undefined;
        try {
          const leadersJson = await fetchJson<MlbLeadersResponse>(
            `${API}/teams/${teamId}/leaders?leaderCategories=homeRuns,rbi,era,wins,stolenBases&season=${year}&sportId=1&limit=1`,
          );
          leaders = parseMlbTeamLeaders(leadersJson);
        } catch {
          leaders = undefined;
        }
        if (leaders && seasonStats) seasonStats = { ...seasonStats, leaders };

        return {
          ok: true,
          data: { record, streak, previousGame, currentGame, nextGames, seasonStats, gameStats },
        };
      } catch (err) {
        return {
          ok: false,
          error: `MLB provider unavailable: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    },
  };
}
