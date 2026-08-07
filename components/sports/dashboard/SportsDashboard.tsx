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
 * view. The visual language is Pike Place Market: Fir-Green sign housing
 * with red neon-tube signage.
 */
export default function SportsDashboard() {
  const { teams, metadata, loading } = useTeams();
  const [orderIds, setOrderIds] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<Team | null>(null);

  // Restore the saved card order once, client-side only.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ORDER_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
          setOrderIds(parsed);
        }
      }
    } catch {
      // Ignore corrupted or unavailable storage.
    }
  }, []);

  const orderedTeams = useMemo(() => {
    if (!orderIds) return teams;
    const byId = new Map(teams.map((t) => [t.id, t]));
    const seen = new Set(orderIds);
    const saved = orderIds.map((id) => byId.get(id)).filter((t): t is Team => Boolean(t));
    return [...saved, ...teams.filter((t) => !seen.has(t.id))];
  }, [teams, orderIds]);

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
    <div className="mt-8">
      {/* Neon market sign — SEATTLE SPORTS CENTER, stacked vertically like
          the Public Market Center sign, with SEATTLE and CENTER indented. */}
      <header className="text-center">
        <h2 className="neon-sign animate-neon-breathe mx-auto w-fit text-left font-sign text-4xl uppercase leading-none tracking-[0.02em] sm:text-5xl md:text-6xl">
          <span className="block pl-5 sm:pl-7">Seattle</span>
          <span className="block">Sports</span>
          <span className="block pl-5 sm:pl-7">Center</span>
        </h2>
        <div className="mx-auto mt-6 flex max-w-xs items-center justify-center gap-3">
          <span className="h-px flex-1 bg-pinGold/50" />
          <span className="text-cream/40">✦</span>
          <span className="h-px flex-1 bg-pinGold/50" />
        </div>
      </header>

      {/* Data-source badge row + hint */}
      <div className="mt-8 flex flex-wrap items-center justify-end gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-market-red/30 bg-market-redSoft px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-market-red">
            {metadata?.source ?? "mock"} data
          </span>
          {metadata?.asOf && (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-cream/50">
              as of {metadata.asOf}
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 font-mono text-[11px] text-cream/35">
        <span className="text-cream/50">drag</span> cards to reorder — saved to this browser ·{" "}
        <span className="text-cream/50">click</span> a card for the full game &amp; season view
      </p>

      {/* Live-now ticker */}
      {liveTeams.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-market-red/25 bg-market-redSoft px-3.5 py-2.5">
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

      {/* Pike Place board */}
      <div className="market-board mt-6 rounded-3xl p-4 sm:p-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl border border-white/5 bg-white/[0.04]" />
            ))}
          </div>
        ) : (
          <TeamCardGrid teams={orderedTeams} onReorder={handleReorder} onSelect={setSelected} />
        )}
      </div>

      {/* Expanded team view */}
      {selected && <ExpandedTeamView team={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
