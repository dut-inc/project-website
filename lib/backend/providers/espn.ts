// lib/backend/providers/espn.ts
//
// ESPN provider — covers five leagues through one config-driven adapter:
// NFL (Seahawks), NHL (Kraken), WNBA (Storm), MLS (Sounders), NWSL (Reign).
//
// ESPN's public `site.api.espn.com` v2 API is undocumented but stable and
// keyless, and it is the only free source we found that covers all five
// leagues in one consistent shape. Official-league APIs were checked first:
// MLB has one (see mlb.ts); NHL's official feed exists but the ESPN shape
// is identical to the other four leagues here, so they all share this
// adapter for consistency.
//
// Endpoints used:
//   GET /apis/site/v2/sports/{sport}/{league}/teams/{id}/schedule
//   GET /apis/site/v2/sports/{sport}/{league}/summary?event={eventId}
//   GET /apis/v2/sports/{sport}/{league}/standings (site.web.api.espn.com)
//
// The parse* functions are exported so tests can exercise normalization
// against captured fixtures without hitting the network.

import type {
  GameStats,
  GameSummary,
  HomeAway,
  LeagueId,
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
import { dateKey, espnGameNote, formatTimePT, parseEspnPeriodClock, streakFromOutcomes, todayKey, type EspnLiveSport } from "../normalize.ts";
import type { ProviderData, ProviderResult, TeamProvider } from "./types.ts";

const API = "https://site.api.espn.com/apis/site/v2/sports";
const WEB_API = "https://site.web.api.espn.com/apis/v2/sports";

// ---------------------------------------------------------------------------
// League config
// ---------------------------------------------------------------------------

export interface EspnLeagueConfig {
  leagueId: LeagueId;
  sport: EspnLiveSport;
  league: string;
  teamId: number;
  /** Frontend record format for standings composition. */
  recordFormat: "wl" | "wlot" | "wld";
  /** Seasons whose schedule/standings start in the fall of the calendar year. */
  fallStart?: boolean;
}

// ---------------------------------------------------------------------------
// Parsed game shape (shared across states)
// ---------------------------------------------------------------------------

export interface ParsedEspnGame {
  eventId: string;
  date: string; // yyyy-mm-dd
  iso: string;
  opponent: string;
  at: HomeAway;
  teamScore?: number;
  opponentScore?: number;
  outcome?: Outcome;
  note?: string;
  state: "pre" | "in" | "post";
  shortDetail?: string;
  channel?: string;
  ourAbbr: string;
  oppAbbr: string;
  timeouts: { ours?: number; theirs?: number };
}

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v !== "" && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

interface EspnCompetitor {
  homeAway?: string;
  score?: { displayValue?: string };
  winner?: boolean;
  timeoutsRemaining?: number;
  team?: { id?: string | number; displayName?: string; shortDisplayName?: string; abbreviation?: string };
}

interface EspnCompetition {
  status?: { type?: { state?: string; shortDetail?: string } };
  competitors?: EspnCompetitor[];
  broadcasts?: Array<{ names?: string[] }>;
}

interface EspnEvent {
  id?: string;
  date?: string;
  competitions?: EspnCompetition[];
}

/** Normalize one ESPN event into the shared parsed shape. */
export function parseEspnEvent(event: unknown, teamId: number): ParsedEspnGame | null {
  const e = event as EspnEvent;
  const competition = e.competitions?.[0];
  if (!competition) return null;

  const type = competition.status?.type;
  const state = type?.state === "post" ? "post" : type?.state === "in" ? "in" : "pre";
  const competitors = competition.competitors ?? [];
  const ours = competitors.find((c) => String(c.team?.id) === String(teamId));
  const theirs = competitors.find((c) => c !== ours);
  if (!ours || !theirs) return null;

  const at: HomeAway = ours.homeAway === "home" ? "home" : "away";
  const teamScore = num(ours.score?.displayValue);
  const opponentScore = num(theirs.score?.displayValue);
  const shortDetail = type?.shortDetail;

  let outcome: Outcome | undefined;
  if (state === "post" && teamScore !== undefined && opponentScore !== undefined) {
    outcome = ours.winner === true ? "W" : theirs.winner === true ? "L" : "D";
  }

  return {
    eventId: e.id ?? "",
    date: dateKey(e.date ?? ""),
    iso: e.date ?? "",
    opponent: theirs.team?.displayName ?? theirs.team?.shortDisplayName ?? "Unknown",
    at,
    teamScore,
    opponentScore,
    outcome,
    note: state === "post" ? espnGameNote(shortDetail ?? "") : undefined,
    state,
    shortDetail,
    channel: competition.broadcasts?.[0]?.names?.[0],
    ourAbbr: ours.team?.abbreviation ?? "",
    oppAbbr: theirs.team?.abbreviation ?? "",
    timeouts: {
      ours: typeof ours.timeoutsRemaining === "number" ? ours.timeoutsRemaining : undefined,
      theirs: typeof theirs.timeoutsRemaining === "number" ? theirs.timeoutsRemaining : undefined,
    },
  };
}

/**
 * Split an ESPN schedule response into completed / live / upcoming games.
 * Postponed / delayed / cancelled games are excluded from every bucket, and
 * "upcoming" is guarded to future dates so a stale pre-game can never
 * surface as a next fixture.
 */
export function parseScheduleEvents(
  schedule: { events?: unknown[] },
  teamId: number,
): { completed: ParsedEspnGame[]; live: ParsedEspnGame | null; upcoming: ParsedEspnGame[] } {
  const today = todayKey();
  const games = (schedule.events ?? [])
    .map((e) => parseEspnEvent(e, teamId))
    .filter((g): g is ParsedEspnGame => g !== null)
    .filter((g) => !/postponed|delayed|cancelled/i.test(g.shortDetail ?? ""));

  const completed = games.filter((g) => g.state === "post").sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = games
    .filter((g) => g.state === "pre" && g.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.iso.localeCompare(b.iso));
  const live = games.find((g) => g.state === "in") ?? null;

  return { completed, live, upcoming };
}

// ---------------------------------------------------------------------------
// GameStats from the live summary endpoint
// ---------------------------------------------------------------------------

/** Display-name whitelist of team statistics we surface, per sport. */
const TEAM_STAT_WHITELIST: Record<EspnLiveSport, Array<{ name: string; label: string }>> = {
  basketball: [
    { name: "fieldGoalPct", label: "Field goal %" },
    { name: "threePointFieldGoalsMade-threePointFieldGoalsAttempted", label: "3-pointers" },
    { name: "freeThrowsMade-freeThrowsAttempted", label: "Free throws" },
    { name: "totalRebounds", label: "Rebounds" },
    { name: "assists", label: "Assists" },
    { name: "turnovers", label: "Turnovers" },
    { name: "steals", label: "Steals" },
    { name: "blocks", label: "Blocks" },
  ],
  football: [
    { name: "totalYards", label: "Total yards" },
    { name: "passingYards", label: "Passing yards" },
    { name: "rushingYards", label: "Rushing yards" },
    { name: "turnovers", label: "Turnovers" },
    { name: "thirdDownConversions-thirdDownAttempts", label: "3rd downs" },
    { name: "penaltyYards", label: "Penalty yards" },
  ],
  hockey: [
    { name: "shotsOnGoal", label: "Shots on goal" },
    { name: "powerPlayGoals-powerPlayOpportunities", label: "Power play" },
    { name: "penaltyMinutes", label: "Penalty minutes" },
    { name: "blockedShots", label: "Blocked shots" },
    { name: "takeaways", label: "Takeaways" },
  ],
  soccer: [
    { name: "possessionPct", label: "Possession" },
    { name: "shotsOnTarget", label: "Shots on target" },
    { name: "shots", label: "Shots" },
    { name: "foulsCommitted", label: "Fouls" },
    { name: "cornerKicks", label: "Corners" },
    { name: "yellowCards", label: "Yellow cards" },
    { name: "redCards", label: "Red cards" },
  ],
};

interface LiveSummary {
  boxscore?: {
    teams?: Array<{
      homeAway?: string;
      statistics?: Array<{ name?: string; displayValue?: string }>;
    }>;
  };
  leaders?: Array<{
    team?: { id?: string | number };
    leaders?: Array<{
      displayName?: string;
      leaders?: Array<{ athlete?: { displayName?: string }; displayValue?: string }>;
    }>;
  }>;
  plays?: Array<{
    scoringPlay?: boolean;
    period?: { number?: number; displayValue?: string };
    homeScore?: number;
    awayScore?: number;
  }>;
}

/**
 * Normalize a live-game summary into frontend GameStats. `live` is the
 * parsed game from the schedule (needed for home/away + abbreviations).
 */
export function parseSummary(
  summary: LiveSummary,
  teamId: number,
  sport: EspnLiveSport,
  live: ParsedEspnGame,
): { teamStats?: StatLine[]; leaders?: PlayerLeader[]; scoring?: ScoringEvent[] } {
  const { at } = live;

  // Team stat lines, ours first: "44.1% – 47.6%".
  const teamStats: StatLine[] = [];
  const teams = summary.boxscore?.teams ?? [];
  const oursT = teams.find((t) => t.homeAway === at);
  const theirsT = teams.find((t) => t.homeAway !== at && t.homeAway !== undefined);
  const oursStats = new Map((oursT?.statistics ?? []).map((s) => [s.name, s.displayValue]));
  const theirsStats = new Map((theirsT?.statistics ?? []).map((s) => [s.name, s.displayValue]));
  for (const { name, label } of TEAM_STAT_WHITELIST[sport]) {
    const ours = oursStats.get(name);
    const theirs = theirsStats.get(name);
    if (ours !== undefined && theirs !== undefined) teamStats.push({ label, value: `${ours} – ${theirs}` });
  }

  // Player leaders for OUR team only.
  const leaders: PlayerLeader[] = [];
  for (const group of summary.leaders ?? []) {
    if (String(group.team?.id) !== String(teamId)) continue;
    for (const category of group.leaders ?? []) {
      const top = category.leaders?.[0];
      if (!top?.athlete?.displayName || !top.displayValue) continue;
      leaders.push({ label: category.displayName ?? "", player: top.athlete.displayName, value: top.displayValue });
    }
  }

  // Scoring summary: one line per period, from the last scoring play of each
  // (matches the frontend's per-period scoring list). Basketball only — the
  // other sports don't expose the same clean play feed.
  const scoring: ScoringEvent[] = [];
  if (sport === "basketball") {
    const plays = (summary.plays ?? []).filter((p) => p.scoringPlay);
    if (plays.length > 0) {
      const byPeriod = new Map<number, (typeof plays)[number]>();
      for (const p of plays) {
        if (p.period?.number !== undefined) byPeriod.set(p.period.number, p);
      }
      // Track which side scored on each play by watching the score change.
      const sideByPlay: Array<"seattle" | "opponent"> = [];
      let prevHome = 0;
      let prevAway = 0;
      for (const p of plays) {
        const homeDelta = (p.homeScore ?? prevHome) - prevHome;
        const awayDelta = (p.awayScore ?? prevAway) - prevAway;
        prevHome = p.homeScore ?? prevHome;
        prevAway = p.awayScore ?? prevAway;
        sideByPlay.push(at === "home" ? (homeDelta > 0 ? "seattle" : "opponent") : awayDelta > 0 ? "seattle" : "opponent");
      }
      const playIndex = new Map<number, number>();
      plays.forEach((p, i) => {
        if (p.period?.number !== undefined) playIndex.set(p.period.number, i);
      });

      for (const [n, idx] of [...playIndex.entries()].sort((a, b) => a[0] - b[0])) {
        const p = plays[idx];
        const home = p.homeScore ?? 0;
        const away = p.awayScore ?? 0;
        const ourScore = at === "home" ? home : away;
        const oppScore = at === "home" ? away : home;
        scoring.push({
          period: `Q${n}`,
          side: sideByPlay[idx],
          description: p.period?.displayValue ?? `Q${n}`,
          score: `${live.ourAbbr || "SEA"} ${ourScore} – ${oppScore} ${live.oppAbbr || "OPP"}`,
        });
      }
    }
  }

  return {
    teamStats: teamStats.length > 0 ? teamStats : undefined,
    leaders: leaders.length > 0 ? leaders.slice(0, 4) : undefined,
    scoring: scoring.length > 0 ? scoring : undefined,
  };
}

// ---------------------------------------------------------------------------
// Standings (v2 endpoint on site.web.api.espn.com)
// ---------------------------------------------------------------------------

interface StandingsEntry {
  team?: { id?: string | number; displayName?: string; shortDisplayName?: string };
  overall?: string;
  stats?: Array<{ name?: string; displayValue?: string }>;
}

export interface ParsedStandings {
  rows: StandingsRow[];
  ours?: {
    wins: number;
    losses: number;
    otLosses?: number;
    draws?: number;
    position?: number;
    stats: Map<string, string>;
    seasonLabel: string;
  };
}

/** "2026-08-08" style key -> "20260808" for ESPN date params. */
function dateParam(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function statOf(entry: StandingsEntry, names: string[]): string | undefined {
  for (const name of names) {
    const found = (entry.stats ?? []).find((s) => s.name === name);
    if (found?.displayValue !== undefined && found.displayValue !== "") return found.displayValue;
  }
  return undefined;
}

function recordFor(entry: StandingsEntry, format: "wl" | "wlot" | "wld"): string {
  if (entry.overall) return entry.overall;
  const w = statOf(entry, ["wins"]) ?? "0";
  const l = statOf(entry, ["losses"]) ?? "0";
  if (format === "wlot") return `${w}-${l}-${statOf(entry, ["otLosses", "ot"]) ?? 0}`;
  if (format === "wld") return `${w}-${l}-${statOf(entry, ["ties", "draws"]) ?? 0}`;
  return `${w}-${l}`;
}

/** Normalize the v2 standings response. Returns the league table + our team's row. */
export function parseStandingsV2(
  json: { children?: Array<{ name?: string; standings?: { entries?: StandingsEntry[] } }> },
  teamId: number,
  format: "wl" | "wlot" | "wld",
  seasonLabel: string,
): ParsedStandings {
  for (const child of json.children ?? []) {
    const entries = child.standings?.entries ?? [];
    const index = entries.findIndex((e) => String(e.team?.id) === String(teamId));
    if (index === -1) continue;

    const rows: StandingsRow[] = entries.slice(0, 8).map((e, i) => ({
      position: i + 1,
      team: e.team?.displayName ?? e.team?.shortDisplayName ?? "Unknown",
      record: recordFor(e, format),
      points: num(statOf(e, ["points"])),
      gamesBack: statOf(e, ["gamesBehind"]),
    }));

    const ours = entries[index];
    const position = num(statOf(ours, ["playoffSeed"])) ?? index + 1;
    // Only surface the extra columns the league's record format actually uses.
    const draws = format === "wld" ? num(statOf(ours, ["ties", "draws"])) : undefined;
    const otLosses = format === "wlot" ? num(statOf(ours, ["otLosses", "ot"])) : undefined;

    return {
      rows,
      ours: {
        wins: num(statOf(ours, ["wins"])) ?? 0,
        losses: num(statOf(ours, ["losses"])) ?? 0,
        otLosses,
        draws,
        position,
        stats: new Map((ours.stats ?? []).map((s) => [s.name ?? "", s.displayValue ?? ""])),
        seasonLabel,
      },
    };
  }
  return { rows: [] };
}

/** Season stat lines we can honestly derive from standings stats, per league. */
function seasonLinesFromStats(
  stats: Map<string, string>,
  sport: EspnLiveSport,
): { offense?: StatLine[]; defense?: StatLine[]; misc?: StatLine[] } {
  const lines: { offense?: StatLine[]; defense?: StatLine[]; misc?: StatLine[] } = {};
  const pick = (names: string[]): string | undefined => names.map((n) => stats.get(n)).find((v) => v !== undefined && v !== "");

  if (sport === "basketball") {
    const ppg = pick(["avgPointsFor"]);
    const papg = pick(["avgPointsAgainst"]);
    const diff = pick(["differential"]);
    const home = pick(["Home"]);
    const road = pick(["Road"]);
    const last10 = pick(["Last Ten Games"]);
    if (ppg) lines.offense = [{ label: "Points / gm", value: ppg }];
    if (papg) lines.defense = [{ label: "Points allowed / gm", value: papg }];
    const misc: StatLine[] = [];
    if (diff) misc.push({ label: "Differential", value: diff });
    if (home) misc.push({ label: "Home", value: home });
    if (road) misc.push({ label: "Road", value: road });
    if (last10) misc.push({ label: "Last 10", value: last10 });
    if (misc.length > 0) lines.misc = misc;
  }

  if (sport === "hockey") {
    const gf = pick(["goalsFor", "avgGoalsFor"]);
    const ga = pick(["goalsAgainst", "avgGoalsAgainst"]);
    const pp = pick(["powerPlayPct"]);
    const pk = pick(["penaltyKillPct"]);
    const home = pick(["Home"]);
    const road = pick(["Road"]);
    if (gf) lines.offense = [{ label: "Goals / gm", value: gf }];
    const def: StatLine[] = [];
    if (ga) def.push({ label: "Goals against / gm", value: ga });
    if (pk) def.push({ label: "Penalty kill", value: pk });
    if (pp) def.push({ label: "Power play", value: pp });
    if (def.length > 0) lines.defense = def;
    const misc: StatLine[] = [];
    if (home) misc.push({ label: "Home", value: home });
    if (road) misc.push({ label: "Road", value: road });
    if (misc.length > 0) lines.misc = misc;
  }

  if (sport === "football") {
    const yd = pick(["yardsFor", "totalYards", "offensiveYards"]);
    const ya = pick(["yardsAgainst"]);
    const pf = pick(["pointsFor", "pointsPerGameFor"]);
    const pa = pick(["pointsAgainst", "pointsPerGameAgainst"]);
    const misc: StatLine[] = [];
    if (yd) lines.offense = [{ label: "Yards", value: yd }];
    if (ya) lines.defense = [{ label: "Yards allowed", value: ya }];
    if (pf) misc.push({ label: "Points", value: pf });
    if (pa) misc.push({ label: "Points allowed", value: pa });
    if (misc.length > 0) lines.misc = misc;
  }

  if (sport === "soccer") {
    const gf = pick(["goalsFor"]);
    const ga = pick(["goalsAgainst"]);
    const diff = pick(["differential", "goalDifference"]);
    const misc: StatLine[] = [];
    if (gf) lines.offense = [{ label: "Goals", value: gf }];
    if (ga) lines.defense = [{ label: "Goals against", value: ga }];
    if (diff) misc.push({ label: "Goal difference", value: diff });
    if (misc.length > 0) lines.misc = misc;
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function buildEspnProvider(config: EspnLeagueConfig): TeamProvider {
  const { leagueId, sport, league, teamId, recordFormat } = config;
  const seasonLabel = (year: number) => (config.fallStart ? `${year}-${String(year + 1).slice(2)}` : String(year));

  async function fetchSchedule(season?: number, seasonType?: number): Promise<{ events?: unknown[] }> {
    const params = new URLSearchParams();
    if (season !== undefined) params.set("season", String(season));
    if (seasonType !== undefined) params.set("seasonType", String(seasonType));
    const qs = params.toString();
    return fetchJson(`${API}/${sport}/${league}/teams/${teamId}/schedule${qs ? `?${qs}` : ""}`);
  }

  async function fetchStandings(year: number): Promise<{ children?: Array<{ name?: string; standings?: { entries?: StandingsEntry[] } }> }> {
    return fetchJson(`${WEB_API}/${sport}/${league}/standings?region=us&lang=en&contentorigin=espn&season=${year}`);
  }

  return {
    league: leagueId,

    fetch: async (): Promise<ProviderResult> => {
      const nowYear = new Date().getFullYear();

      try {
        // 1) Schedule — current season, plus the regular-season slice for
        //    football (ESPN splits preseason / regular / playoffs by
        //    seasonType and the default response only carries preseason).
        let schedule = await fetchSchedule();
        const events = schedule.events ?? [];
        const hasRegular = events.some((e) => (e as { seasonType?: { id?: string } }).seasonType?.id === "2");
        if (!hasRegular && sport === "football") {
          const regular = await fetchSchedule(undefined, 2);
          const seen = new Set(events.map((e) => (e as { id?: string }).id));
          schedule = { events: [...events, ...(regular.events ?? []).filter((e) => !seen.has((e as { id?: string }).id))] };
        }

        // 2) Off-season (e.g. hockey/football in August): the current
        //    season's schedule has no completed games yet, so pull the
        //    previous season and use its tail for the last game + streak.
        //    Note ESPN's season param semantics differ per sport — for
        //    fall-start leagues (NHL) `season=2026` is the 2025-26 season,
        //    while for calendar leagues (NFL) `season=2025` is 2025.
        let parsed = parseScheduleEvents(schedule, teamId);
        if (parsed.completed.length === 0) {
          const prevSeasonYear = config.fallStart ? nowYear : nowYear - 1;
          const prevSeason = await fetchSchedule(prevSeasonYear);
          parsed = parseScheduleEvents({ events: [...(schedule.events ?? []), ...(prevSeason.events ?? [])] }, teamId);
        }

        // 3) Soccer quirk: ESPN's team-schedule endpoint only returns past
        //    fixtures, so pull upcoming games from the league scoreboard for
        //    the next ~5 weeks instead.
        let { completed, live, upcoming } = parsed;
        if (upcoming.length < 3 && sport === "soccer") {
          const from = new Date();
          const to = new Date(from.getTime() + 35 * 24 * 60 * 60 * 1000);
          try {
            const board = await fetchJson<{ events?: unknown[] }>(
              `${API}/${sport}/${league}/scoreboard?dates=${dateParam(from)}-${dateParam(to)}`,
            );
            const boardUpcoming = parseScheduleEvents(board, teamId).upcoming;
            const seen = new Set(upcoming.map((g) => g.eventId));
            for (const g of boardUpcoming) {
              if (!seen.has(g.eventId)) {
                seen.add(g.eventId);
                upcoming.push(g);
              }
            }
            upcoming.sort((a, b) => a.date.localeCompare(b.date) || a.iso.localeCompare(b.iso));
          } catch {
            // Scoreboard is best-effort — the schedule still works.
          }
        }

        const lastCompleted = completed[completed.length - 1];
        const streak: Streak = streakFromOutcomes(completed.slice(-10).map((g) => g.outcome ?? "W"));

        // 3) Standings with a zero-fallback: during preseason / off-season
        //    the "current" season table is all zeros — fall back to the
        //    last completed season instead of showing 0-0.
        let standingsParsed = parseStandingsV2(await fetchStandings(nowYear), teamId, recordFormat, seasonLabel(nowYear));
        const oursRow = standingsParsed.ours;
        const isBlank =
          oursRow !== undefined && oursRow.wins === 0 && oursRow.losses === 0 && (oursRow.otLosses ?? 0) === 0;
        if (isBlank && nowYear - 1 >= 2020) {
          standingsParsed = parseStandingsV2(
            await fetchStandings(nowYear - 1),
            teamId,
            recordFormat,
            seasonLabel(nowYear - 1),
          );
        }

        const record: TeamRecord | undefined = standingsParsed.ours
          ? {
              wins: standingsParsed.ours.wins,
              losses: standingsParsed.ours.losses,
              otLosses: standingsParsed.ours.otLosses,
              draws: standingsParsed.ours.draws,
              position: standingsParsed.ours.position,
              label: standingsParsed.ours.seasonLabel,
            }
          : undefined;

        // 4) Previous game.
        const previousGame: GameSummary | undefined = lastCompleted
          ? {
              date: lastCompleted.date,
              opponent: lastCompleted.opponent,
              at: lastCompleted.at,
              outcome: lastCompleted.outcome ?? "W",
              teamScore: lastCompleted.teamScore ?? 0,
              opponentScore: lastCompleted.opponentScore ?? 0,
              note: lastCompleted.note,
              channel: lastCompleted.channel,
            }
          : undefined;

        // 5) Live game + best-effort live stats.
        let currentGame: LiveGame | undefined;
        let gameStats: GameStats | undefined;
        if (live) {
          const { period, clock } = parseEspnPeriodClock(live.shortDetail ?? "", sport);
          currentGame = {
            opponent: live.opponent,
            at: live.at,
            teamScore: live.teamScore ?? 0,
            opponentScore: live.opponentScore ?? 0,
            period,
            clock,
            channel: live.channel,
          };
          if (live.timeouts.ours !== undefined || live.timeouts.theirs !== undefined) {
            const total = sport === "basketball" ? 6 : sport === "football" ? 3 : undefined;
            if (total) {
              const [oursTimeout, theirsTimeout] =
                live.at === "home"
                  ? [live.timeouts.ours, live.timeouts.theirs]
                  : [live.timeouts.theirs, live.timeouts.ours];
              currentGame.homeStatus =
                oursTimeout !== undefined ? { remaining: oursTimeout, total, label: "Timeouts" } : undefined;
              currentGame.awayStatus =
                theirsTimeout !== undefined ? { remaining: theirsTimeout, total, label: "Timeouts" } : undefined;
            }
          }

          try {
            const summary = await fetchJson<LiveSummary>(`${API}/${sport}/${league}/summary?event=${live.eventId}`);
            const s = parseSummary(summary, teamId, sport, live);
            if (s.teamStats || s.leaders || s.scoring) {
              gameStats = { teamStats: s.teamStats, leaders: s.leaders, scoring: s.scoring };
            }
          } catch {
            gameStats = undefined; // live stats are best-effort
          }
        }

        // 6) Next three scheduled games.
        const nextGames: ScheduledGame[] = upcoming.slice(0, 3).map((g) => ({
          date: g.date,
          time: formatTimePT(g.iso),
          opponent: g.opponent,
          at: g.at,
          channel: g.channel,
        }));

        // 7) Season stats: standings table + honest stat lines.
        const seasonStats: SeasonStats | undefined = standingsParsed.rows.length
          ? {
              standings: standingsParsed.rows,
              ...(standingsParsed.ours ? seasonLinesFromStats(standingsParsed.ours.stats, sport) : {}),
            }
          : undefined;

        return {
          ok: true,
          data: { record, streak, previousGame, currentGame, nextGames, seasonStats, gameStats },
        };
      } catch (err) {
        return {
          ok: false,
          error: `${sport}/${league} provider unavailable: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    },
  };
}
