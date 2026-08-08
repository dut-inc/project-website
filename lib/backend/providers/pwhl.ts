// lib/backend/providers/pwhl.ts
//
// PWHL provider — Seattle Torrent via the public HockeyTech (LeagueStat)
// feed that powers thepwhl.com. No key needed: the site's own public client
// key is embedded in the query strings below. ESPN does not cover the PWHL,
// so this league gets its own adapter.
//
// Endpoints used:
//   GET /feed/index.php?feed=modulekit&view=scorebar&numberofdaysback=1000
//       &numberofdaysahead=1000&key=..&client_code=pwhl      (all games)
//   GET /feed/index.php?feed=modulekit&view=statviewtype&stat=conference
//       &type=standings&season_id={n}&key=..&client_code=pwhl (standings)
//   GET /feed/index.php?feed=gc&tab=gamesummary&game_id={n}&key=..
//       &client_code=pwhl                                     (live box)
//
// The parse* functions are exported so tests can exercise normalization
// against captured fixtures without hitting the network.

import type {
  GameStats,
  GameSummary,
  HomeAway,
  LiveGame,
  Outcome,
  ScheduledGame,
  SeasonStats,
  StatLine,
  StandingsRow,
  Streak,
  TeamRecord,
} from "../../sports/types.ts";
import { fetchJson } from "../http.ts";
import { streakFromOutcomes } from "../normalize.ts";
import type { ProviderData, ProviderResult, TeamProvider } from "./types.ts";

const FEED = "https://lscluster.hockeytech.com/feed/index.php";
const KEY = "446521baf8c38984"; // public client key used by thepwhl.com

// GameStatus codes from the scorebar feed (verified live):
//   "1" = scheduled   "2" = in progress   "3" = intermission   "4" = final
const STATUS_FINAL = "4";
const STATUS_SCHEDULED = "1";

export interface PwhlScorebarRow {
  ID: string;
  Date: string;
  GameDateISO8601?: string;
  ScheduledFormattedTime?: string;
  SeasonID?: string;
  HomeID: string;
  HomeCode: string;
  HomeLongName: string;
  HomeGoals: string;
  VisitorID: string;
  VisitorCode: string;
  VisitorLongName: string;
  VisitorGoals: string;
  Period?: string;
  PeriodNameShort?: string;
  GameClock?: string;
  GameStatus: string;
  GameStatusString?: string;
  Intermission?: string;
  venue_name?: string;
}

export interface ParsedPwhlGame {
  id: string;
  date: string;
  opponent: string;
  at: HomeAway;
  teamScore: number;
  opponentScore: number;
  state: "post" | "in" | "pre" | "postponed";
  period?: string;
  clock?: string;
  intermission?: boolean;
  seasonId: string;
  note?: string;
  time?: string;
}

function num(v: string | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

const PERIOD_LABELS: Record<string, string> = {
  "1": "1st",
  "2": "2nd",
  "3": "3rd",
  OT1: "OT",
  SO: "SO",
};

function normalizeTime(t: string | undefined): string {
  if (!t) return "";
  return t
    .replace(/\s*(am|pm)\s*$/i, (m) => ` ${m.trim().toUpperCase()}`)
    .replace(/^0(\d)/, "$1");
}

/** Normalize one scorebar row for the team that matches `teamName`. */
export function parsePwhlRow(row: PwhlScorebarRow, teamName: string): ParsedPwhlGame | null {
  const isHome = row.HomeLongName.toLowerCase().includes(teamName.toLowerCase());
  const isAway = row.VisitorLongName.toLowerCase().includes(teamName.toLowerCase());
  if (!isHome && !isAway) return null;

  const gameStatus = row.GameStatus;
  let state: ParsedPwhlGame["state"];
  if (gameStatus === STATUS_FINAL) state = "post";
  else if (gameStatus === STATUS_SCHEDULED) state = "pre";
  else if ((row.GameStatusString ?? "").match(/postponed|delayed/i)) state = "postponed";
  else state = "in";

  const teamScore = isHome ? num(row.HomeGoals) : num(row.VisitorGoals);
  const opponentScore = isHome ? num(row.VisitorGoals) : num(row.HomeGoals);

  let note: string | undefined;
  if (state === "post") {
    const p = row.PeriodNameShort ?? "3";
    note = p === "3" ? "F" : p === "OT1" ? "OT" : p;
  }

  return {
    id: row.ID,
    date: row.Date,
    opponent: (isHome ? row.VisitorLongName : row.HomeLongName).replace(/^PWHL\s+/i, ""),
    at: isHome ? "home" : "away",
    teamScore,
    opponentScore,
    state,
    period: state === "in" ? PERIOD_LABELS[row.PeriodNameShort ?? "1"] ?? row.PeriodNameShort : undefined,
    clock: state === "in" ? row.GameClock : undefined,
    intermission: state === "in" && row.Intermission === "1",
    seasonId: row.SeasonID ?? "",
    note,
    time: normalizeTime(row.ScheduledFormattedTime),
  };
}

/** Split the scorebar into completed / live / upcoming games for our team. */
export function parseScorebar(
  json: { SiteKit?: { Scorebar?: PwhlScorebarRow[] } },
  teamName: string,
): { completed: ParsedPwhlGame[]; live: ParsedPwhlGame | null; upcoming: ParsedPwhlGame[] } {
  const rows = json.SiteKit?.Scorebar ?? [];
  const games = rows.map((r) => parsePwhlRow(r, teamName)).filter((g): g is ParsedPwhlGame => g !== null);

  const completed = games
    .filter((g) => g.state === "post")
    .sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = games
    .filter((g) => g.state === "pre")
    .sort((a, b) => a.date.localeCompare(b.date));
  const live = games.find((g) => g.state === "in") ?? null;

  return { completed, live, upcoming };
}

// ---------------------------------------------------------------------------
// Standings
// ---------------------------------------------------------------------------

export interface PwhlStandingRow {
  team_id?: string;
  team_code?: string;
  name?: string;
  wins?: string;
  losses?: string;
  ot_losses?: string;
  points?: string;
  goals_for?: string;
  goals_against?: string;
  regulation_wins?: string;
  row?: string;
}

/** Normalize a standings table for our team (matched by name fragment). */
export function parsePwhlStandings(
  json: { SiteKit?: { Statviewtype?: Array<PwhlStandingRow | { repeatheader?: number }> } },
  teamName: string,
): { rows: StandingsRow[]; ours?: { wins: number; losses: number; otLosses: number; position: number; seasonLabel: string } } {
  const table = (json.SiteKit?.Statviewtype ?? []).filter(
    (r): r is PwhlStandingRow => typeof (r as PwhlStandingRow).wins === "string",
  );
  if (table.length === 0) return { rows: [] };

  const idx = table.findIndex((r) => (r.name ?? "").toLowerCase().includes(teamName.toLowerCase()));
  if (idx === -1) return { rows: [] };

  const rows: StandingsRow[] = table.slice(0, 8).map((r, i) => ({
    position: i + 1,
    team: (r.name ?? "").replace(/^[xXyYzZ -]+\s*/i, "").replace(/^[xXyYzZ]\s*-\s*/, ""),
    record: `${r.wins ?? 0}-${r.losses ?? 0}-${r.ot_losses ?? 0}`,
    points: num(r.points),
  }));

  const ours = table[idx];
  return {
    rows,
    ours: {
      wins: num(ours.wins),
      losses: num(ours.losses),
      otLosses: num(ours.ot_losses),
      position: idx + 1,
      seasonLabel: `${new Date().getFullYear() - 1}-${String(new Date().getFullYear()).slice(2)}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Live box score (best-effort)
// ---------------------------------------------------------------------------

interface PwhlSummary {
  GameSummary?: Record<string, unknown>;
  GameSummaryData?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Extract team stat lines from a live game summary. The HockeyTech summary
 * structure varies by game, so this is deliberately defensive — any parse
 * failure drops the stats, never the live game itself.
 */
export function parsePwhlSummary(summary: PwhlSummary): { teamStats?: StatLine[] } {
  const root = (summary.GameSummary ?? summary.GameSummaryData ?? {}) as Record<string, unknown>;
  const home = root.HomeTeam as Record<string, unknown> | undefined;
  const away = root.VisitorTeam as Record<string, unknown> | undefined;
  if (!home || !away) return {};

  const lines: Array<[string, keyof typeof home]> = [
    ["Shots", "Shots"],
    ["Penalty minutes", "PenaltyMinutes"],
    ["Power plays", "PowerPlays"],
  ];
  const teamStats: StatLine[] = [];
  for (const [label, key] of lines) {
    const h = home[key];
    const a = away[key];
    if (h !== undefined && a !== undefined) teamStats.push({ label, value: `${h} – ${a}` });
  }
  return { teamStats: teamStats.length > 0 ? teamStats : undefined };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function buildPwhlProvider(teamName: string): TeamProvider {
  return {
    league: "pwhl",

    fetch: async (): Promise<ProviderResult> => {
      try {
        const scorebar = await fetchJson<{ SiteKit?: { Scorebar?: PwhlScorebarRow[] } }>(
          `${FEED}?feed=modulekit&view=scorebar&numberofdaysback=1000&numberofdaysahead=1000&key=${KEY}&client_code=pwhl`,
        );
        const { completed, live, upcoming } = parseScorebar(scorebar, teamName);
        const lastCompleted = completed[completed.length - 1];
        const streak: Streak = streakFromOutcomes(
          completed.slice(-10).map((g): Outcome => (g.teamScore > g.opponentScore ? "W" : "L")),
        );

        // Standings for the most recent season that has final games.
        const latestSeason = [...completed].reverse().find((g) => g.seasonId)?.seasonId;
        let standings: { rows: StandingsRow[]; ours?: { wins: number; losses: number; otLosses: number; position: number; seasonLabel: string } } = { rows: [] };
        if (latestSeason) {
          const json = await fetchJson<{ SiteKit?: { Statviewtype?: Array<PwhlStandingRow | { repeatheader?: number }> } }>(
            `${FEED}?feed=modulekit&view=statviewtype&stat=conference&type=standings&season_id=${latestSeason}&key=${KEY}&client_code=pwhl`,
          );
          standings = parsePwhlStandings(json, teamName);
        }

        const record: TeamRecord | undefined = standings.ours
          ? {
              wins: standings.ours.wins,
              losses: standings.ours.losses,
              otLosses: standings.ours.otLosses,
              position: standings.ours.position,
              label: standings.ours.seasonLabel,
            }
          : undefined;

        const previousGame: GameSummary | undefined = lastCompleted
          ? {
              date: lastCompleted.date,
              opponent: lastCompleted.opponent,
              at: lastCompleted.at,
              outcome: lastCompleted.teamScore > lastCompleted.opponentScore ? "W" : "L",
              teamScore: lastCompleted.teamScore,
              opponentScore: lastCompleted.opponentScore,
              note: lastCompleted.note,
            }
          : undefined;

        let currentGame: LiveGame | undefined;
        let gameStats: GameStats | undefined;
        if (live) {
          currentGame = {
            opponent: live.opponent,
            at: live.at,
            teamScore: live.teamScore,
            opponentScore: live.opponentScore,
            period: live.period ?? "In progress",
            clock: live.clock,
            detail: live.intermission ? "Intermission" : undefined,
          };
          try {
            const summary = await fetchJson<PwhlSummary>(
              `${FEED}?feed=gc&tab=gamesummary&game_id=${live.id}&key=${KEY}&client_code=pwhl`,
            );
            const s = parsePwhlSummary(summary);
            if (s.teamStats) gameStats = { teamStats: s.teamStats };
          } catch {
            gameStats = undefined;
          }
        }

        const nextGames: ScheduledGame[] = upcoming.slice(0, 3).map((g) => ({
          date: g.date,
          time: g.time || "TBD",
          opponent: g.opponent,
          at: g.at,
        }));

        const seasonStats: SeasonStats | undefined = standings.rows.length ? { standings: standings.rows } : undefined;

        return {
          ok: true,
          data: { record, streak, previousGame, currentGame, nextGames, seasonStats, gameStats },
        };
      } catch (err) {
        return {
          ok: false,
          error: `PWHL provider unavailable: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    },
  };
}
