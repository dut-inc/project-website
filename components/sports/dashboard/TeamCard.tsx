"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
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
 * One reorderable team widget — a square, flat white storefront card that
 * stacks full-width on the green board. Left is the team identity (big
 * logo, no accent bar), middle carries the live game / last game + next
 * games, and the right rail holds the drag grip. For live teams the score
 * sits in the exact middle of the box (1fr | auto | 1fr). The whole box is
 * clickable to expand; hovering brightens it without scaling it.
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
  const inactive = team.status === "inactive";

  const rail = (
    <div className="flex shrink-0 items-center justify-between gap-3 pt-1 md:flex-col md:items-end md:justify-center md:gap-1.5 md:pt-0">
      <button
        type="button"
        {...dragHandleProps}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Drag to reorder ${team.shortName}`}
        title="Drag to reorder"
        className="flex cursor-grab items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-ink2 transition-colors hover:bg-ink/5 hover:text-ink active:cursor-grabbing"
        style={{ touchAction: "none" }}
      >
        <GripIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Reorder</span>
      </button>
      <span className="flex items-center gap-1 rounded-none border border-transparent px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-ink2/70 transition-colors group-hover:border-market-olive group-hover:bg-market-olive group-hover:text-white group-hover:shadow-[0_0_12px_rgba(78,90,56,0.35)]">
        Details
        <ChevronDownIcon className="h-3 w-3 transition-transform duration-200 group-hover:translate-y-0.5" />
      </span>
    </div>
  );

  const body = inactive ? (
    <p className="font-display text-lg font-semibold tracking-tight text-ink">bring em back!</p>
  ) : team.error ? (
    <p className="font-display text-[13px] font-medium leading-snug text-[#8A3B28]">
      ⚠ {team.error}
    </p>
  ) : (
    <div className="flex flex-col gap-2">
      {team.previousGame && <GameSummary game={team.previousGame} />}
      <ScheduleList games={team.nextGames} />
    </div>
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${team.shortName} — click for the full view`}
      onClick={() => onExpand(team)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onExpand(team);
        }
      }}
      className={`group relative w-full cursor-pointer border border-ink/15 bg-market-card shadow-[0_4px_14px_-10px_rgba(0,0,0,0.45)] outline-none transition-[background-color,border-color,box-shadow] duration-300 hover:border-ink/30 hover:bg-market-cardHover hover:shadow-[0_18px_44px_-18px_rgba(0,0,0,0.55)] focus-visible:ring-2 focus-visible:ring-market-red/70 ${
        dragging ? "ring-1 ring-ink/25" : ""
      }`}
    >
      {isLive ? (
        /* Live card — the score lands in the true middle of the box. The
           centered grid only kicks in at lg+ (below that the identity, score
           and rail stack so the team name never gets squeezed). */
        <div className="flex flex-col gap-3 px-5 py-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-0 lg:py-5">
          <div className="min-w-0 lg:pr-6">
            <TeamCardHeader team={team} />
          </div>

          <div className="flex justify-center py-1 lg:py-0">
            <LiveGameDisplay team={team} />
          </div>

          <div className="lg:justify-self-end lg:pl-6">{rail}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:gap-0 md:py-5">
          <div className="md:w-[300px] md:shrink-0 md:pr-5">
            <TeamCardHeader team={team} />
          </div>

          <div className="flex-1 py-1 md:min-w-0 md:border-l md:border-ink/10 md:px-5 md:py-0">
            {body}
          </div>

          <div className="md:border-l md:border-ink/10 md:pl-4">{rail}</div>
        </div>
      )}
    </div>
  );
}
