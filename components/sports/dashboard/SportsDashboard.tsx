"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTeams } from "@/lib/sports/teamService";
import type { Team } from "@/lib/sports/types";
import ExpandedTeamView from "./ExpandedTeamView";
import TeamCardGrid from "./TeamCardGrid";
import { LiveDot } from "./icons";

const ORDER_KEY = "seattle-sports-dashboard-order";

/**
 * Seattle Sports Dashboard.
 *
 * Consumes the frontend TeamService (currently mock data) and renders the
 * reorderable card board. The user's preferred card order is saved to
 * local storage and restored on revisit — only the presentation order
 * changes, never the team data itself. Clicking a card opens the expanded
 * view. The visual language is Pike Place Market: the Main Arcade's
 * moss-green painted wall with its white-dotted trim, the red neon sign,
 * and white storefront widgets below.
 */
export default function SportsDashboard() {
  const { teams, metadata, loading } = useTeams();
  const [orderIds, setOrderIds] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<Team | null>(null);

  // Restore the saved card order once, client-side only.
  useEffect(() => {
    let rafId: number | undefined;
    try {
      const raw = window.localStorage.getItem(ORDER_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
          // Deferred so the write isn't synchronous inside the effect
          // (react-hooks/set-state-in-effect): the board renders in default
          // order first, then the saved order swaps in.
          rafId = window.requestAnimationFrame(() => setOrderIds(parsed));
        }
      }
    } catch {
      // Ignore corrupted or unavailable storage.
    }
    return () => {
      if (rafId !== undefined) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const orderedTeams = useMemo(() => {
    if (!orderIds) return teams;
    const byId = new Map(teams.map((t) => [t.id, t]));
    const seen = new Set(orderIds);
    const saved = orderIds.map((id) => byId.get(id)).filter((t): t is Team => Boolean(t));
    return [...saved, ...teams.filter((t) => !seen.has(t.id))];
  }, [teams, orderIds]);

  // Re-resolve the selected team against the freshest snapshot so the
  // expanded panel (live score, B-S-O, scoring) stays current while the
  // board polls — `selected` itself only holds the object captured at
  // click time, which polling replaces.
  const selectedTeam = selected
    ? orderedTeams.find((t) => t.id === selected.id) ?? selected
    : null;

  const handleReorder = useCallback((ids: string[]) => {
    setOrderIds(ids);
    try {
      window.localStorage.setItem(ORDER_KEY, JSON.stringify(ids));
    } catch {
      // Storage unavailable (private mode etc.) — order just won't persist.
    }
  }, []);

  const liveTeams = orderedTeams.filter((t) => t.currentGame);

  return (
    <div>
      {/* The page title lives in the shared page header (app/sports/dashboard).
          Data snapshot badge (the source badge — "live data" — was removed
          per product feedback; only the "as of" timestamp stays). */}
      <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-3">
        {metadata?.asOf && (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-cream/50">
            as of {metadata.asOf}
          </span>
        )}
      </div>

      {/* Live-now ticker */}
      {liveTeams.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-none border border-market-red/25 bg-market-redSoft px-3.5 py-2.5">
          <span className="neon-soft flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest">
            <LiveDot className="h-1.5 w-1.5" /> Live now
          </span>
          {liveTeams.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-cream/70 transition-colors hover:border-market-red/40 hover:text-white"
            >
              {t.shortName} {t.currentGame?.teamScore}–{t.currentGame?.opponentScore}
            </button>
          ))}
        </div>
      )}

      {/* Pike Place board. The trim line its extra top padding used to clear
          is no longer drawn, so it sits close under the page header. */}
      <div className="market-board mt-2 rounded-none px-4 pb-4 sm:px-6 sm:pb-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse border border-white/20 bg-white/15" />
            ))}
          </div>
        ) : (
          <TeamCardGrid teams={orderedTeams} onReorder={handleReorder} onSelect={setSelected} />
        )}
      </div>

      {/* Expanded team view */}
      {selected && selectedTeam && (
        <ExpandedTeamView team={selectedTeam} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
