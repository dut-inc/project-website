// lib/backend/normalize.ts
//
// Shared normalization helpers used by every provider. The frontend contract
// (lib/sports/types.ts) is the only shape these functions ever produce —
// league quirks are absorbed here so the route handler and the UI never see
// them.

import type { Outcome, Streak } from "../sports/types.ts";

/** The dashboard's home timezone. All human-readable times are formatted here. */
export const HOME_TZ = "America/Los_Angeles";

/** "2026-08-08T20:10:00Z" -> "2026-08-08" (UTC date part). */
export function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

/** "2026-08-08T20:10:00Z" -> "1:10 PM" in America/Los_Angeles. */
export function formatTimePT(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: HOME_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(dt);
}

/** ISO date key -> e.g. "2026-08-08" (local-day based, safe to compare). */
export function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Compute a streak from completed-game outcomes, oldest first.
 * "W3" / "L2" / "D1"; returns a zero-count streak when the list is empty.
 */
export function streakFromOutcomes(outcomes: Outcome[]): Streak {
  if (outcomes.length === 0) return { type: "W", count: 0 };
  const last = outcomes[outcomes.length - 1];
  let count = 0;
  for (let i = outcomes.length - 1; i >= 0; i--) {
    if (outcomes[i] !== last) break;
    count++;
  }
  return { type: last, count };
}

/** Ordinalize a small positive integer: 3 -> "3rd". */
const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];
export function ordinal(n: number): string {
  return ORDINALS[n - 1] ?? `${n}th`;
}

export type EspnLiveSport = "basketball" | "football" | "hockey" | "soccer";

/**
 * ESPN live statuses come as short detail strings ("Q3 4:32", "2nd Half
 * 12:45", "3rd Period 15:21", "Half"). Split them into the frontend's
 * free-form `period` display (the leagues config appends "Quarter"/"Period"/
 * "Half") plus an optional game clock. Anything unparseable falls back to
 * the raw string — the UI must not assume a clock exists.
 */
export function parseEspnPeriodClock(
  shortDetail: string,
  sport: EspnLiveSport,
): { period: string; clock?: string } {
  const s = (shortDetail ?? "").trim();
  if (!s) return { period: "In progress" };

  const clockMatch = s.match(/^(.*?)\s+(\d+:\d+)$/);
  const head = (clockMatch ? clockMatch[1] : s).trim();
  const clock = clockMatch ? clockMatch[2] : undefined;

  // Q3 -> 3rd   (basketball / football)
  const q = head.match(/^Q([1-9])$/i);
  if (q) return { period: ordinal(Number(q[1])), clock };

  // "3rd Period" / "2nd Half" / "1st Quarter" -> "3rd" (suffix is added by
  // the frontend's league config)
  const part = head.match(/^([1-9])[a-z]{2}\s+(half|period|quarter)$/i);
  if (part) return { period: ordinal(Number(part[1])), clock };

  // OT / Final OT / OT2
  if (/^(final\s+)?ot\d*$/i.test(head)) return { period: "OT", clock };

  // Soccer "1st Half"/"2nd Half" handled above; bare "Half" is halftime.
  if (/^half$/i.test(head)) return { period: "Half", clock };

  // Anything else (e.g. "In Progress", "Suspended") — pass through.
  return { period: head, clock };
}

/** Full opponent display name from an ESPN competitor ("Seattle Seahawks"). */
export function espnTeamDisplay(comp: { team?: { displayName?: string; shortDisplayName?: string } }): string {
  return comp.team?.displayName ?? comp.team?.shortDisplayName ?? "Unknown";
}

/**
 * ESPN completed-game note: "Final" -> "F", "Final/OT" -> "OT", etc.
 * Matches the frontend's expectation (formatGameNote renders "F" as "Final").
 */
export function espnGameNote(shortDetail: string | undefined): string | undefined {
  const s = (shortDetail ?? "").trim();
  if (!s || /^(final|ft|full time)$/i.test(s)) return "F";
  const m = s.match(/^(final|ft)\/(ot|so|2ot|3ot)$/i);
  if (m) return m[2].toUpperCase();
  return s;
}
