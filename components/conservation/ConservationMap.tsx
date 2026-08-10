"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Pin from "@/components/Pin";
import SightingMap, { type PickedPoint } from "./SightingMap";
import SightingCard from "./SightingCard";
import SightingUploadForm from "./SightingUploadForm";
import { createClient } from "@/utils/supabase/client";
import {
  CATEGORY_META,
  SIGHTINGS,
  toSighting,
  type Sighting,
  type SightingCategory,
} from "@/lib/sightings";

const FILTERS: { id: SightingCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  ...(Object.keys(CATEGORY_META) as SightingCategory[]).map((id) => ({
    id,
    label: CATEGORY_META[id].label,
  })),
];

function getErrorMessage(error: { message?: string; details?: string } | null) {
  if (!error) return "Something went wrong.";
  return error.details
    ? `${error.message} ${error.details}`
    : error.message ?? "Something went wrong.";
}

export default function ConservationMap() {
  const [sightings, setSightings] = useState<Sighting[]>(SIGHTINGS);
  const [filter, setFilter] = useState<SightingCategory | "all">("all");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const [pickedPoint, setPickedPoint] = useState<PickedPoint | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch shared records from Supabase and merge them with the static seeds.
  // Uploaded photos are already public Storage URLs, so no resolution needed.
  const loadSightings = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    setLoadError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("sightings")
        .select("id, species, category, location, lat, lng, date, observer, note, photo, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const uploaded = (data ?? [])
        .map((row) => toSighting(row as Record<string, unknown>))
        .filter((s): s is Sighting => s !== null);

      setSightings([...SIGHTINGS, ...uploaded]);
    } catch (caughtError) {
      setLoadError(getErrorMessage(caughtError as { message?: string; details?: string }));
    }
  }, []);

  useEffect(() => {
    // Initial fetch: syncs the merged list with the shared table.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSightings();
  }, [loadSightings]);

  const visible = useMemo(
    () => sightings.filter((s) => filter === "all" || s.category === filter),
    [sightings, filter],
  );

  const handlePick = useCallback((point: PickedPoint) => {
    setPickedPoint(point);
    setPickMode(false);
  }, []);

  const handlePickedConsumed = useCallback(() => {
    setPickedPoint(null);
  }, []);

  const handleCreated = useCallback(
    async (id: string) => {
      // Keep the form open so the success notice renders and the user can log
      // another sighting; the map flies to the new pin via setFocusId below.
      setPickMode(false);
      setPickedPoint(null);
      await loadSightings();
      setFocusId(id);
    },
    [loadSightings],
  );

  return (
    <div className="mx-auto mt-10 max-w-6xl">
      {uploadOpen && (
        <div className="mb-8">
          <SightingUploadForm
            pickMode={pickMode}
            onStartPick={() => setPickMode(true)}
            onStopPick={() => setPickMode(false)}
            pickedPoint={pickedPoint}
            onPickedConsumed={handlePickedConsumed}
            onCreated={handleCreated}
          />
        </div>
      )}

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
              sightings={sightings}
              filter={filter}
              focusId={focusId}
              onSelect={setFocusId}
              pickMode={pickMode}
              onPick={handlePick}
              pickedPoint={pickedPoint}
            />
          </div>
        </div>

        <aside className="space-y-3">
          <button
            type="button"
            onClick={() => setUploadOpen((open) => !open)}
            className={`w-full rounded-full px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
              uploadOpen
                ? "bg-[#C1442D] text-cream hover:bg-[#C1442D]/85"
                : "bg-pinNavy text-cream hover:bg-pinNavy/85"
            }`}
            aria-expanded={uploadOpen}
          >
            {uploadOpen ? "close the log form" : "＋ log a sighting"}
          </button>

          {loadError && (
            <div
              role="alert"
              className="rounded-xl border border-[#C1442D]/60 bg-[#C1442D]/10 px-3 py-2.5 font-mono text-[10px] leading-relaxed text-ink/80"
            >
              shared records unavailable: {loadError}
              {(loadError.toLowerCase().includes("relation") ||
                loadError.toLowerCase().includes("row-level security") ||
                loadError.toLowerCase().includes("permission denied")) && (
                <span className="mt-1 block text-ink/60">
                  Run the latest supabase/schema.sql in the Supabase SQL editor, then refresh.
                </span>
              )}
            </div>
          )}

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
