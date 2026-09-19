import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  currentEspnSeasonYear,
  getNbaStandings,
  getLivePicks,
  seasonLabelFor,
} from "@/lib/backend/providers/nbaStandings";
import {
  PARTICIPANTS,
  hydratePicks,
  isSeasonLocked,
  isParticipant,
  parsePicks,
} from "@/lib/sports/nbaStandingsPicks";

// GET /api/nba-standings/predictions
//
// One endpoint for the whole pool: live standings + every participant's
// saved picks for the current season. The DB is optional — if Supabase isn't
// configured the standings still load and every board falls back to chalk.
export async function GET() {
  const standings = await getNbaStandings();

  let records: Record<string, { picks: unknown; updatedAt: string | null }> = {};
  let dbError: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("nba_standings_predictions")
      .select("participant, picks, updated_at")
      .eq("season_key", standings.seasonLabel);

    if (error) throw error;
    for (const row of data ?? []) {
      if (isParticipant(row.participant)) {
        records[row.participant] = { picks: row.picks, updatedAt: row.updated_at };
      }
    }
  } catch (err) {
    // Surface the real cause (e.g. table missing / RLS denial). Supabase
    // throws plain PostgrestError objects, not Error instances, so we can't
    // rely on instanceof here.
    const message =
      typeof err === "object" && err !== null && "message" in err
        ? (err as { message: unknown }).message
        : null;
    dbError = typeof message === "string" && message ? message : "Failed to load predictions";
  }

  const participants = PARTICIPANTS.map((name) => {
    const record = records[name];
    return {
      name,
      picks: hydratePicks(record?.picks),
      saved: record?.picks != null && parsePicks(record.picks) !== null,
      updatedAt: record?.updatedAt ?? null,
    };
  });

  return NextResponse.json({
    season: {
      key: standings.seasonLabel,
      locked: isSeasonLocked(),
      tipOff: "2026-10-20T00:00:00-04:00",
      isPreseason: standings.isPreseason,
    },
    standings: {
      fetchedAt: standings.fetchedAt,
      West: standings.West,
      East: standings.East,
    },
    participants,
    dbError,
  });
}

// PUT /api/nba-standings/predictions
//
// Save one participant's board. The season lock is enforced here on the
// server clock — a stale client or tampered cookie can't write after tip-off.
export async function PUT(request: NextRequest) {
  if (isSeasonLocked()) {
    return NextResponse.json(
      { error: "The season has tipped off — picks are locked." },
      { status: 423 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const asRecord = (body ?? {}) as Record<string, unknown>;
  const participant = asRecord.participant;
  if (!isParticipant(participant)) {
    return NextResponse.json({ error: "Unknown participant." }, { status: 400 });
  }

  const picks = parsePicks(asRecord.picks);
  if (!picks) {
    return NextResponse.json(
      { error: "Each conference list needs exactly its 15 teams, once each." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("nba_standings_predictions")
      .upsert(
        {
          season_key: seasonLabelFor(currentEspnSeasonYear()),
          participant,
          picks,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "season_key,participant" },
      );
    if (error) throw error;
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Could not save picks: ${err.message}`
            : "Could not save picks.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, picks });
}
