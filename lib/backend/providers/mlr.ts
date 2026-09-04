// lib/backend/providers/mlr.ts
//
// MLR provider — Seattle Seawolves.
//
// Status as of August 2026: there is NO reliable free, keyless JSON feed
// for Major League Rugby. Everything was investigated before settling on a
// graceful error state:
//
//   - ESPN's rugby coverage is discontinued (league slug returns 404/400).
//   - SofaScore's public API returns 403 for non-browser clients.
//   - the-rugby-api (RapidAPI) requires a paid key.
//   - majorleague.rugby's official site has no public JSON API — its data
//     goes through an internal "makerweb" API (apim-maker.llt-services.com)
//     with no discoverable public path.
//
// Per the backend prompt, we prefer reliability over brittleness: "If a
// sports provider does not expose a particular piece of information,
// gracefully omit it rather than creating a brittle workaround." This
// provider implements the same `TeamProvider` interface and returns a clear
// per-team error state — the dashboard keeps loading, and the Seawolves
// card explains why it has no data. When a real MLR feed appears (official
// API, or a keyed provider added to .env), swap the body of `fetch()` —
// nothing else in the codebase changes.

import type { ProviderResult, TeamProvider } from "./types.ts";

const UNAVAILABLE =
  "No public MLR data feed is available right now (ESPN dropped rugby coverage; the league's site has no public API). Swap in a real feed in lib/backend/providers/mlr.ts — the rest of the dashboard is wired and waiting.";

export function buildMlrProvider(): TeamProvider {
  return {
    league: "mlr",
    fetch: async (): Promise<ProviderResult> => ({
      ok: false,
      error: UNAVAILABLE,
    }),
  };
}
