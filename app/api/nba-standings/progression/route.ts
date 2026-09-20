import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { fetchJson } from "@/lib/backend/http";
import {
  CURRENT_PROGRESSION_SEASON,
  buildProgression,
  weeklyCheckpoints,
  type ProgressionInput,
} from "@/lib/sports/nbaProgression";
import {
  PARTICIPANTS,
  hydratePicks,
  isParticipant,
} from "@/lib/sports/nbaStandingsPicks";
import { teamFromEspnAbbr } from "@/lib/sports/nbaTeams";

type ScoreboardEvent = {
  date?: string;
  competitions?: Array<{
    status?: { type?: { completed?: boolean } };
    competitors?: Array<{
      homeAway?: "home" | "away";
      winner?: boolean;
      team?: { abbreviation?: string };
    }>;
  }>;
};

type ScoreboardResponse = { events?: ScoreboardEvent[] };

type Game = { date: string; winner: string; loser: string };

function datePart(iso: string): string {
  return iso.slice(0, 10).replaceAll("-", "");
}

function parseGames(events: ScoreboardEvent[]): Game[] {
  const games: Game[] = [];
  for (const event of events) {
    const competition = event.competitions?.[0];
    if (!competition?.status?.type?.completed || competition.competitors?.length !== 2) continue;
    const teams = competition.competitors.flatMap((competitor) => {
      const id = teamFromEspnAbbr(competitor.team?.abbreviation)?.id;
      return id && competitor.winner !== undefined ? [{ id, winner: competitor.winner }] : [];
    });
    if (teams.length !== 2 || !event.date) continue;
    const winner = teams.find((team) => team.winner)?.id;
    const loser = teams.find((team) => !team.winner)?.id;
    if (winner && loser) games.push({ date: event.date.slice(0, 10), winner, loser });
  }
  return games;
}

function standingsAt(games: Game[], date: string) {
  const records = new Map<string, { wins: number; losses: number }>();
  for (const game of games) {
    if (game.date > date) continue;
    for (const team of [game.winner, game.loser]) {
      if (!records.has(team)) records.set(team, { wins: 0, losses: 0 });
    }
    records.get(game.winner)!.wins += 1;
    records.get(game.loser)!.losses += 1;
  }

  const sort = (conference: "West" | "East") =>
    [...records.entries()]
      .filter(([teamId]) => teamFromEspnAbbr(teamId)?.conference === conference)
      .sort(([, a], [, b]) => {
        const aPct = a.wins / Math.max(1, a.wins + a.losses);
        const bPct = b.wins / Math.max(1, b.wins + b.losses);
        return bPct - aPct || b.wins - a.wins;
      })
      .map(([teamId]) => teamId);

  return { West: sort("West"), East: sort("East") };
}

async function loadParticipants(): Promise<ProgressionInput> {
  const fallback = PARTICIPANTS.map((name) => ({ name, picks: hydratePicks(null) }));
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("nba_standings_predictions")
      .select("participant, picks")
      .eq("season_key", CURRENT_PROGRESSION_SEASON.key);
    if (error) throw error;
    const records = new Map(
      (data ?? [])
        .filter((row) => isParticipant(row.participant))
        .map((row) => [row.participant, hydratePicks(row.picks)]),
    );
    return PARTICIPANTS.map((name) => ({ name, picks: records.get(name) ?? hydratePicks(null) }));
  } catch {
    return fallback;
  }
}

export async function GET() {
  try {
    const participants = await loadParticipants();
    const response = await fetchJson<ScoreboardResponse>(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${datePart(CURRENT_PROGRESSION_SEASON.seasonStart)}-${datePart(CURRENT_PROGRESSION_SEASON.seasonEnd)}&limit=2000`,
    );
    const games = parseGames(response.events ?? []);
    const checkpoints = buildProgression(
      CURRENT_PROGRESSION_SEASON,
      participants,
      // Reconstruct standings independently at every weekly checkpoint; no
      // interpolation or cumulative score is used.
      weeklyCheckpoints(CURRENT_PROGRESSION_SEASON).map(({ date }) => ({
        date,
        standings: standingsAt(games, date),
      })),
    );

    return NextResponse.json({ season: CURRENT_PROGRESSION_SEASON, checkpoints });
  } catch {
    return NextResponse.json(
      { season: CURRENT_PROGRESSION_SEASON, checkpoints: [], unavailable: true },
      { status: 200 },
    );
  }
}
