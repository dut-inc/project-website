"use client";

import { useMemo, useState } from "react";
import Pin from "@/components/Pin";
import SightingMap from "./SightingMap";
import SightingCard from "./SightingCard";
import {
  CATEGORY_META,
  SIGHTINGS,
  type SightingCategory,
} from "@/lib/sightings";

const FILTERS: { id: SightingCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  ...(Object.keys(CATEGORY_META) as SightingCategory[]).map((id) => ({
    id,
    label: CATEGORY_META[id].label,
  })),
];

export default function ConservationMap() {
  const [filter, setFilter] = useState<SightingCategory | "all">("all");
  const [focusId, setFocusId] = useState<string | null>(null);

  const visible = useMemo(
    () => SIGHTINGS.filter((s) => filter === "all" || s.category === filter),
    [filter],
  );

  return (
    <div className="mx-auto mt-10 max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <div className="relative rotate-1">
          <Pin color="navy" />
          <div className="paper-torn bg-kraft p-2.5 shadow-[0_14px_28px_-8px_rgba(0,0,0,0.55)]">
            <div className="mb-1.5 flex items-center justify-between px-1 pt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink2">
              <span>Field Map · Puget Sound</span>
              <span>
                {visible.length} sighting{visible.length === 1 ? "" : "s"}
              </span>
            </div>
            <SightingMap
              sightings={SIGHTINGS}
              filter={filter}
              focusId={focusId}
              onSelect={setFocusId}
            />
          </div>
        </div>

        <aside className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                  filter === f.id
                    ? "bg-pinNavy text-cream"
                    : "bg-cream/10 text-cream/70 hover:bg-cream/20"
                }`}
                aria-pressed={filter === f.id}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {visible.map((sighting) => (
              <SightingCard
                key={sighting.id}
                sighting={sighting}
                selected={focusId === sighting.id}
                onSelect={setFocusId}
              />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
