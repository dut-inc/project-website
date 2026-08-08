// app/api/teams/route.ts
//
// The dashboard's single backend-facing endpoint. The frontend only ever
// talks to this route (through the TeamService in lib/sports/teamService.ts);
// it never calls a sports API directly.
//
//   GET /api/teams -> { teams: Team[], metadata: {...} }
//
// All heavy lifting (provider fetching, normalization, caching, failure
// isolation) lives server-side in lib/backend/. This route is
// force-dynamic so Next never bakes a snapshot at build time — the
// in-memory cache in lib/backend/cache.ts decides when to refresh.

import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/backend/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const payload = await getDashboard();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        teams: [],
        metadata: {
          asOf: new Date().toISOString(),
          source: "live",
          note: `Dashboard backend failed to assemble: ${err instanceof Error ? err.message : String(err)}`,
          providerStatus: {},
        },
      },
      { status: 500 },
    );
  }
}
