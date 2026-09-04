"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTeams } from "@/lib/sports/teamService";
import type { Team } from "@/lib/sports/types";
import ExpandedTeamView from "./ExpandedTeamView";
import TeamCardGrid from "./TeamCardGrid";
import { LiveDot } from "./icons";

const ORDER_KEY = "seattle-sports-dashboard-order";

/** Red neon letters with a thin white core — each letter is layered twice
 *  with the SAME bold glyph, so the white core traces the red outline
 *  exactly. The base is solid red; on top sits a white copy of the same
 *  glyph whose edges are eaten back by a thick red stroke. What remains of
 *  the white is a hairline running through the middle of every stroke,
 *  terminating with the letter's own terminals instead of ending short
 *  of them. */
function inlineLetters(word: string) {
  return word.split("").map((ch, i) => (
    <span key={i} className="relative inline-block">
      {ch}
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center font-bold text-white"
        style={{ WebkitTextStroke: "0.08em #ff4638" }}
      >
        {ch}
      </span>
    </span>
  ));
}

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
    <div className="mt-8">
      {/* The stacked neon title — thick red letters with a thin white
          core, mimicking the Pike Place Market sign. SEATTLE and CENTER
          share the same left indent; SPORTS sits centered between them.
          All three words are the same size. */}
      <header className="text-center">
        <h1 className="neon-title animate-neon-breathe mx-auto w-fit text-left font-sign text-4xl font-bold uppercase leading-none tracking-[0.05em] sm:text-5xl md:text-6xl">
          <span className="block pl-6 sm:pl-9">{inlineLetters("SEATTLE")}</span>
          <span className="block py-1.5 text-center sm:py-2">{inlineLetters("SPORTS")}</span>
          <span className="block pl-6 sm:pl-9">{inlineLetters("CENTER")}</span>
        </h1>
      </header>

      {/* Data snapshot badge (the source badge — "live data" — was removed
          per product feedback; only the "as of" timestamp stays). */}
      <div className="mt-8 flex flex-wrap items-center justify-end gap-x-6 gap-y-3">
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

      {/* Pike Place board */}
      {/* pt-6/pt-8 keep the first widget row clear of the white trim
          line with the green medallions — p-4/p-6 alone was too tight. */}
      <div className="market-board mt-8 rounded-none p-4 pt-6 sm:p-6 sm:pt-8">
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
