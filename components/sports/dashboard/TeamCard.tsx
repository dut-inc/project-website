"use client";

import { useMemo } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { shade } from "@/lib/sports/leagues";
import type { Team } from "@/lib/sports/types";
import GameSummary from "./GameSummary";
import LiveGameDisplay from "./LiveGameDisplay";
import ScheduleList from "./ScheduleList";
import TeamCardHeader from "./TeamCardHeader";
import { ChevronDownIcon, GripIcon } from "./icons";

/** Pointer-event wiring for the drag handle, provided by TeamCardGrid. */
export interface DragHandleProps {
  onPointerDown?: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove?: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp?: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerCancel?: (e: ReactPointerEvent<HTMLButtonElement>) => void;
}

/**
 * One reorderable team card. The whole card is clickable to expand; the
 * grip in the footer starts drag-to-reorder (via pointer events wired up
 * by TeamCardGrid). Hover intensifies the team's colors — the card never
 * scales or resizes.
 */
export default function TeamCard({
  team,
  onExpand,
  dragging = false,
  dragHandleProps,
}: {
  team: Team;
  onExpand: (team: Team) => void;
  /** True while this card is rendered as the floating drag ghost. */
  dragging?: boolean;
  dragHandleProps?: DragHandleProps;
}) {
  const isLive = Boolean(team.currentGame);

  const gradients = useMemo(() => {
    const { primary, secondary } = team.colors;
    return {
      base: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
      hover: `linear-gradient(135deg, ${shade(primary, 0.24)} 0%, ${primary} 40%, ${secondary} 65%, ${shade(
        secondary,
        0.28
      )} 100%)`,
      rest: "0 6px 24px -14px rgba(0,0,0,0.9)",
      glow: `0 12px 36px -8px ${primary}66, 0 3px 14px -2px ${secondary}55`,
    };
  }, [team.colors]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${team.name} — click for the full view`}
      onClick={() => onExpand(team)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onExpand(team);
        }
      }}
      className={`group relative h-full cursor-pointer rounded-2xl outline-none transition-shadow duration-300 focus-visible:ring-2 focus-visible:ring-white/40 ${
        dragging ? "ring-2 ring-white/15" : ""
      }`}
    >
      {/* Gradient border layers (rest + intensified on hover). */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-2xl opacity-100 transition-opacity duration-300"
        style={{ background: gradients.base, boxShadow: gradients.rest }}
      />
      <div
        aria-hidden
        className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: gradients.hover, boxShadow: gradients.glow }}
      />

      {/* Card sheet */}
      <div className="relative m-[2px] flex h-[calc(100%-4px)] flex-col overflow-hidden rounded-[calc(1rem-2px)] bg-[#16171B] transition-colors duration-300 group-hover:bg-[#191B21]">
        <div className="px-4 pt-4 pb-3">
          <TeamCardHeader team={team} />
        </div>

        <div className="flex-1 space-y-3 px-4 pb-4">
          {team.status === "inactive" ? (
            <div className="rounded-xl border border-dashed border-pinGold/25 bg-pinGold/[0.04] p-3.5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-pinGold/80">Placeholder</p>
              {team.note && <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">{team.note}</p>}
            </div>
          ) : isLive ? (
            <LiveGameDisplay team={team} />
          ) : (
            <>
              {team.previousGame && <GameSummary game={team.previousGame} />}
              <div>
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-white/40">Upcoming</p>
                <ScheduleList games={team.nextGames} />
              </div>
            </>
          )}
        </div>

        {/* Footer: drag handle + expand hint */}
        <div className="flex items-center justify-between border-t border-white/5 px-4 py-1.5">
          <button
            type="button"
            {...dragHandleProps}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Drag to reorder ${team.name}`}
            title="Drag to reorder"
            className="flex cursor-grab items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white/35 transition-colors hover:bg-white/5 hover:text-white/70 active:cursor-grabbing"
            style={{ touchAction: "none" }}
          >
            <GripIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reorder</span>
          </button>
          <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-white/35 transition-colors group-hover:text-white/75">
            Details
            <ChevronDownIcon className="h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  );
}
