"use client";

import { useEffect, useState } from "react";
import type { Team } from "@/lib/sports/types";
import GameSeasonTabs, { type ExpandedTab } from "./GameSeasonTabs";
import GameStatsPanel from "./GameStatsPanel";
import SeasonStatsPanel from "./SeasonStatsPanel";
import TeamCardHeader from "./TeamCardHeader";
import { CloseIcon, LiveDot } from "./icons";

/**
 * Expanded team view — a modal that visually extends the team card
 * (same gradient border, same header) rather than navigating away.
 * When the team is playing it offers Game | Season tabs; otherwise it
 * goes straight to the Season view.
 */
export default function ExpandedTeamView({ team, onClose }: { team: Team; onClose: () => void }) {
  const isLive = Boolean(team.currentGame);
  const [tab, setTab] = useState<ExpandedTab>(isLive ? "game" : "season");

  // Escape to close + lock body scroll while open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${team.shortName} details`}
    >
      <div className="animate-backdrop-in absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="animate-modal-pop relative w-full max-w-3xl">
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-market-deep shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)]">
          {/* Solid team-color accent bar (flat — matches the cards). */}
          <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: team.colors.primary }} />
          <div className="max-h-[85vh] overflow-y-auto">
            {/* Sticky header: card header + tabs */}
            <div className="sticky top-0 z-10 border-b border-white/5 bg-market-deep/95 px-5 py-4 backdrop-blur-sm sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <TeamCardHeader team={team} />
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <GameSeasonTabs active={tab} onChange={setTab} showGame={isLive} />
                {isLive && (
                  <span className="neon-soft flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest">
                    <LiveDot className="h-1.5 w-1.5" />
                    Live
                  </span>
                )}
              </div>
            </div>

            <div className="px-5 py-5 sm:px-7">
              {tab === "game" && isLive ? <GameStatsPanel team={team} /> : <SeasonStatsPanel team={team} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
