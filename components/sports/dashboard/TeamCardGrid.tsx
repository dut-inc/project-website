"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Team } from "@/lib/sports/types";
import TeamCard, { type DragHandleProps } from "./TeamCard";

interface DragState {
  id: string;
  pointerId: number;
  /** Overlay position (viewport coords). */
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  /** Index (in the array of non-dragged teams) where the gap sits. */
  placeholderIndex: number;
}

interface PendingDrag {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  rect: DOMRect;
}

const DRAG_THRESHOLD = 6; // px of pointer movement before a drag starts

/**
 * Reorderable grid of team cards.
 *
 * Drag-and-drop uses native Pointer Events (mouse + touch) driven by a
 * dedicated grip handle, so clicking a card still expands it. Movement is
 * tracked with window-level listeners (the dragged card is unmounted from
 * the grid while dragging, so element capture would be lost). The dragged
 * card becomes a fixed-position ghost following the pointer, the remaining
 * cards shuffle out of the way via a small FLIP animation, and the final
 * order is reported up through `onReorder` — team data is never modified.
 */
export default function TeamCardGrid({
  teams,
  onReorder,
  onSelect,
}: {
  teams: Team[];
  onReorder: (orderedIds: string[]) => void;
  onSelect: (team: Team) => void;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const pendingRef = useRef<PendingDrag | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cardEls = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevRects = useRef<Map<string, DOMRect>>(new Map());

  // Latest props/state mirrored into refs so window listeners never go stale.
  const teamsRef = useRef(teams);
  teamsRef.current = teams;
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  const byId = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  // Visual list: every card except the one being dragged, with a gap slot
  // at `placeholderIndex` so the grid layout never jumps.
  const display: (Team | null)[] = useMemo(() => {
    if (!drag) return teams;
    const rest = teams.filter((t) => t.id !== drag.id);
    const list: (Team | null)[] = [...rest];
    list.splice(Math.max(0, Math.min(drag.placeholderIndex, list.length)), 0, null);
    return list;
  }, [teams, drag]);

  // FLIP: after each commit, animate cards that moved to their new slots.
  useLayoutEffect(() => {
    const els = gridRef.current?.querySelectorAll<HTMLElement>("[data-card-id]");
    if (!els) return;
    const rects = new Map<string, DOMRect>();
    els.forEach((el) => rects.set(el.dataset.cardId!, el.getBoundingClientRect()));
    els.forEach((el) => {
      const id = el.dataset.cardId!;
      const prev = prevRects.current.get(id);
      const cur = rects.get(id)!;
      if (prev && (prev.left !== cur.left || prev.top !== cur.top)) {
        el.style.transition = "none";
        el.style.transform = `translate(${prev.left - cur.left}px, ${prev.top - cur.top}px)`;
        requestAnimationFrame(() => {
          el.style.transition = "transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1)";
          el.style.transform = "";
        });
      }
    });
    prevRects.current = rects;
  });

  // Freeze selection / cursor while dragging.
  useEffect(() => {
    if (!drag) return;
    const prevSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
    return () => {
      document.body.style.userSelect = prevSelect;
      document.body.style.cursor = prevCursor;
    };
  }, [drag]);

  // Window-level drag tracking. The dragged card is removed from the grid
  // during the drag, so we listen on `window` rather than relying on
  // element-level events or pointer capture.
  useEffect(() => {
    function onMove(e: PointerEvent) {
      const pending = pendingRef.current;
      if (pending) {
        if (e.pointerId !== pending.pointerId) return;
        if (Math.hypot(e.clientX - pending.startX, e.clientY - pending.startY) < DRAG_THRESHOLD) return;
        pendingRef.current = null;
        const r = pending.rect;
        const rest = teamsRef.current.filter((t) => t.id !== pending.id);
        const placeholderIndex = Math.max(0, rest.findIndex((t) => t.id === pending.id));
        dragRef.current = {
          id: pending.id,
          pointerId: pending.pointerId,
          x: r.left,
          y: r.top,
          offsetX: pending.startX - r.left,
          offsetY: pending.startY - r.top,
          width: r.width,
          height: r.height,
          placeholderIndex,
        };
        setDrag(dragRef.current);
        return;
      }

      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      e.preventDefault();

      const nx = e.clientX - d.offsetX;
      const ny = e.clientY - d.offsetY;

      // Find where the gap should move, scanning cards in visual order.
      const rest = teamsRef.current.filter((t) => t.id !== d.id);
      let targetIndex = 0;
      for (let i = 0; i < rest.length; i++) {
        const el = cardEls.current.get(rest[i].id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (e.clientY < r.top) {
          targetIndex = i;
          break;
        }
        if (e.clientY <= r.bottom) {
          targetIndex = e.clientX <= r.left + r.width / 2 ? i : i + 1;
          break;
        }
        targetIndex = i + 1;
      }
      targetIndex = Math.max(0, Math.min(targetIndex, rest.length));

      if (targetIndex === d.placeholderIndex) {
        dragRef.current = { ...d, x: nx, y: ny };
      } else {
        dragRef.current = { ...d, x: nx, y: ny, placeholderIndex: targetIndex };
      }
      setDrag(dragRef.current);
    }

    function onUp(e: PointerEvent) {
      if (pendingRef.current) {
        if (e.pointerId === pendingRef.current.pointerId) pendingRef.current = null;
        return;
      }
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;

      const rest = teamsRef.current.filter((t) => t.id !== d.id);
      const ids = rest.map((t) => t.id);
      ids.splice(Math.max(0, Math.min(d.placeholderIndex, ids.length)), 0, d.id);
      // The card reappears exactly where the gap was — drop it back without
      // a FLIP animation so the swap is seamless.
      prevRects.current.delete(d.id);
      dragRef.current = null;
      setDrag(null);
      onReorderRef.current(ids);
    }

    function onCancel(e: PointerEvent) {
      if (e.pointerId === dragRef.current?.pointerId || e.pointerId === pendingRef.current?.pointerId) {
        pendingRef.current = null;
        dragRef.current = null;
        setDrag(null);
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, []);

  const dragTeam = drag ? byId.get(drag.id) : undefined;

  const handleProps = (team: Team): DragHandleProps => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      const el = cardEls.current.get(team.id);
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      pendingRef.current = {
        id: team.id,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        rect: el.getBoundingClientRect(),
      };
    },
  });

  return (
    <div className="relative">
      <div
        ref={gridRef}
        className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${drag ? "pointer-events-none select-none" : ""}`}
      >
        {display.map((team) =>
          team ? (
            <div
              key={team.id}
              data-card-id={team.id}
              ref={(el) => {
                if (el) cardEls.current.set(team.id, el);
                else cardEls.current.delete(team.id);
              }}
              className="h-full"
            >
              <TeamCard team={team} onExpand={onSelect} dragHandleProps={handleProps(team)} />
            </div>
          ) : (
            <div key="drag-placeholder" className="animate-fade-in">
              <div
                className="rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02]"
                style={{ height: drag?.height }}
              />
            </div>
          )
        )}
      </div>

      {/* Drag ghost */}
      {drag && dragTeam && (
        <div
          className="pointer-events-none fixed left-0 top-0 z-50 animate-fade-in"
          style={{
            transform: `translate(${drag.x}px, ${drag.y}px)`,
            width: drag.width,
            willChange: "transform",
          }}
          aria-hidden="true"
        >
          <TeamCard team={dragTeam} onExpand={() => {}} dragging />
        </div>
      )}
    </div>
  );
}
