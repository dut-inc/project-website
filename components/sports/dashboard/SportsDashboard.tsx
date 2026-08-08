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
 * moss-green painted wall with its white-dotted trim, the red neon sign
 * on its iron scaffold, and white storefront widgets below.
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
      {/* Neon market sign on its iron scaffold — SEATTLE / SPORTS / CENTER,
          stacked like the Public Market Center sign. SEATTLE and CENTER
          share the same indent (PUBLIC and CENTER do the same), SPORTS
          sits centered between them, and the letters breathe with extra
          vertical spacing. */}
      <header className="text-center">
        <div className="relative mx-auto w-fit">
          {/* Iron backing frame + corner rivets (the sign housing). */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-7 -inset-y-5 rounded-sm border-[5px] border-[#322e26] bg-[#201d18]/25"
          />
          <span aria-hidden className="pointer-events-none absolute -left-3.5 -top-3.5 h-2.5 w-2.5 rounded-full bg-[#4a453a]" />
          <span aria-hidden className="pointer-events-none absolute -right-3.5 -top-3.5 h-2.5 w-2.5 rounded-full bg-[#4a453a]" />
          <span aria-hidden className="pointer-events-none absolute -bottom-3.5 -left-3.5 h-2.5 w-2.5 rounded-full bg-[#4a453a]" />
          <span aria-hidden className="pointer-events-none absolute -bottom-3.5 -right-3.5 h-2.5 w-2.5 rounded-full bg-[#4a453a]" />

          {/* Support legs + feet — short enough to clear the badge row below. */}
          <div aria-hidden className="pointer-events-none absolute left-10 top-full h-7 w-[5px] bg-[#322e26]" />
          <div aria-hidden className="pointer-events-none absolute right-10 top-full h-7 w-[5px] bg-[#322e26]" />
          <div aria-hidden className="pointer-events-none absolute left-6 top-full mt-6 h-[5px] w-14 bg-[#322e26]" />
          <div aria-hidden className="pointer-events-none absolute right-6 top-full mt-6 h-[5px] w-14 bg-[#322e26]" />

          <h2 className="neon-sign animate-neon-breathe relative text-left font-sign text-4xl uppercase leading-none tracking-[0.03em] sm:text-5xl md:text-6xl">
            <span className="block pl-6 sm:pl-9">Seattle</span>
            <span className="block py-1.5 sm:py-2">Sports</span>
            <span className="block pl-6 sm:pl-9">Center</span>
          </h2>
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
              <div key={i} className="h-28 animate-pulse border border-white/20 bg-white/15" />
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
