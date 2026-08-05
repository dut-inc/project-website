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
 * cards snap out of the way (no chase animations — see the FLIP effect
 * below), and the final order is reported up through `onReorder` — team
 * data is never modified.
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
  //
  // While a drag is active the remaining cards snap instantly instead —
  // otherwise every pointermove would restart a 240ms transition on every
  // shifted card every frame and they'd perpetually chase the moving gap
  // (the messy "everything flies around" look). The ghost already follows
  // the pointer smoothly, so the drag still feels fluid. Drops are
  // seamless: the card remounts exactly where the gap was, so nothing
  // animates there either.
  useLayoutEffect(() => {
    const els = gridRef.current?.querySelectorAll<HTMLElement>("[data-card-id]");
    if (!els) return;
    const rects = new Map<string, DOMRect>();
    els.forEach((el) => rects.set(el.dataset.cardId!, el.getBoundingClientRect()));
    els.forEach((el) => {
      const id = el.dataset.cardId!;
      const prev = prevRects.current.get(id);
      const cur = rects.get(id)!;
      if (!drag && prev && (prev.left !== cur.left || prev.top !== cur.top)) {
        el.style.transition = "none";
        el.style.transform = `translate(${prev.left - cur.left}px, ${prev.top - cur.top}px)`;
        requestAnimationFrame(() => {
          if (dragRef.current) return; // a drag began mid-animation — stay snapped
          const live = gridRef.current?.querySelector<HTMLElement>(`[data-card-id="${id}"]`);
          if (!live) return;
          live.style.transition = "transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1)";
          live.style.transform = "";
        });
      } else {
        // Clear leftover inline transforms/transitions so a drag starts clean.
        el.style.transition = "";
        el.style.transform = "";
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

      // Find where the gap should move. Cards are laid out row-major, so we
      // first locate which row the pointer is in (cards in the same row share
      // a top), then which column within that row by scanning every card in
      // the row horizontally. A naive single pass that breaks on the first
      // vertically-overlapping card can never move the gap past a same-row
      // neighbor — e.g. dragging left-to-right would stall at the middle
      // column because the pointer is always inside the neighbor's vertical
      // band too.
      const rest = teamsRef.current.filter((t) => t.id !== d.id);
      const rects = rest
        .map((t) => cardEls.current.get(t.id))
        .filter((el): el is HTMLDivElement => Boolean(el))
        .map((el) => el.getBoundingClientRect());

      const rows: { start: number; rects: DOMRect[] }[] = [];
      for (const r of rects) {
        const last = rows[rows.length - 1];
        if (last && Math.abs(last.rects[0].top - r.top) < 8) {
          last.rects.push(r);
        } else {
          rows.push({ start: last ? last.start + last.rects.length : 0, rects: [r] });
        }
      }

      let targetIndex: number;
      if (rows.length === 0) {
        targetIndex = 0;
      } else {
        // Row under the pointer (or below every row → end of the list).
        let rowIndex = rows.length;
        for (let i = 0; i < rows.length; i++) {
          const bottom = Math.max(...rows[i].rects.map((c) => c.bottom));
          if (e.clientY <= bottom) {
            rowIndex = i;
            break;
          }
        }

        if (rowIndex === rows.length) {
          targetIndex = rest.length;
        } else {
          const row = rows[rowIndex];
          let colIndex = row.rects.length;
          for (let i = 0; i < row.rects.length; i++) {
            const c = row.rects[i];
            if (e.clientX < c.left + c.width / 2) {
              colIndex = i;
              break;
            }
          }
          targetIndex = row.start + colIndex;
        }
      }

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
            transform: `translate(${drag.x}px, ${drag.y}px) scale(1.02)`,
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
