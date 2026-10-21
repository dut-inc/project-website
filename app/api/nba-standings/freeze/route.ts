import { NextRequest, NextResponse } from "next/server";
import {
  currentEspnSeasonYear,
  freezeNbaStandings,
  NBA_STANDINGS_FREEZE_AT,
  NBA_STANDINGS_FREEZE_SEASON,
  seasonLabelFor,
} from "@/lib/backend/providers/nbaStandings";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const seasonLabel = seasonLabelFor(currentEspnSeasonYear());
  if (seasonLabel !== NBA_STANDINGS_FREEZE_SEASON) {
    return NextResponse.json({ frozen: false, skipped: true, season: seasonLabel });
  }

  const now = new Date();
  if (now.getTime() < Date.parse(NBA_STANDINGS_FREEZE_AT)) {
    return NextResponse.json({ error: "The standings freeze deadline has not arrived." }, { status: 409 });
  }

  const snapshot = await freezeNbaStandings(now);
  return NextResponse.json({ frozen: true, season: snapshot.seasonLabel, fetchedAt: snapshot.fetchedAt });
}
