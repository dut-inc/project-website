"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Map as LeafletMap,
  Marker as LeafletMarker,
  Popup as LeafletPopup,
} from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  CATEGORY_META,
  REGION_CENTER,
  REGION_ZOOM,
  type Sighting,
  type SightingCategory,
} from "@/lib/sightings";

type LeafletLib = typeof import("leaflet");

export type PickedPoint = { lat: number; lng: number };

type Props = {
  sightings: Sighting[];
  filter: SightingCategory | "all";
  focusId: string | null;
  onSelect: (id: string | null) => void;
  pickMode: boolean; // Reports a spot or clear the selection
  onPick: (point: PickedPoint) => void;
  pickedPoint: PickedPoint | null;
};

function openPopupFor(leaflet: LeafletLib, map: LeafletMap, sighting: Sighting): LeafletPopup {
  return leaflet
    .popup({
      offset: leaflet.point(0, -18),
      closeButton: true,
      closeOnClick: false,
      maxWidth: 250,
    })
    .setLatLng([sighting.lat, sighting.lng])
    .setContent(popupHtml(sighting))
    .openOn(map);
}

function popupHtml(sighting: Sighting): string {
  const meta = CATEGORY_META[sighting.category];
  return `
    <div class="sighting-popup-card">
      <div class="sighting-popup-photo-wrap">
        <img src="${sighting.photo}" alt="${sighting.species} photo" class="sighting-popup-photo" />
        <span class="sighting-popup-chip" style="background:${meta.color}">${meta.label}</span>
      </div>
      <div class="sighting-popup-body">
        <h3 class="font-display text-base leading-tight text-ink">${sighting.species}</h3>
        <p class="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink2">${sighting.location}</p>
        <p class="mt-1.5 text-xs leading-relaxed text-ink/80">${sighting.note}</p>
        <p class="mt-2 font-mono text-[10px] text-ink2">${sighting.date} · ${sighting.observer}</p>
      </div>
    </div>`;
}

export default function SightingMap({
  sightings,
  filter,
  focusId,
  onSelect,
  pickMode,
  onPick,
  pickedPoint,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<LeafletLib | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const pickMarkerRef = useRef<LeafletMarker | null>(null);
  const popupRef = useRef<LeafletPopup | null>(null);
  const focusIdRef = useRef<string | null>(focusId);
  const onSelectRef = useRef(onSelect);
  const onPickRef = useRef(onPick);
  const pickModeRef = useRef(pickMode);
  const sightingsRef = useRef(sightings);
  // Guard so filter clicks never re-fly the map on their own
  const didCatchUpRef = useRef(false);
  const [ready, setReady] = useState(false);

  const sightingsById = useMemo(
    () => new Map(sightings.map((s) => [s.id, s])),
    [sightings],
  );

  // Keep the latest callbacks/data without re-running the one-time map effect.
  useEffect(() => {
    onSelectRef.current = onSelect;
    onPickRef.current = onPick;
    pickModeRef.current = pickMode;
    focusIdRef.current = focusId;
    sightingsRef.current = sightings;
  });

  function clearFocusStyling() {
    markersRef.current.forEach((marker) =>
      marker.getElement()?.classList.remove("sighting-marker--focused"),
    );
  }

  // One-time map setup. Markers are synced separately so uploads can add pins.
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let map: LeafletMap | null = null;

    void (async () => {
      const leaflet = await import("leaflet");
      if (cancelled || !containerRef.current) return;
      leafletRef.current = leaflet;

      map = leaflet.map(containerRef.current, {
        // Leaflet wants [lat, lng]; the data layer stores [lng, lat].
        center: [REGION_CENTER[1], REGION_CENTER[0]],
        zoom: REGION_ZOOM,
        zoomControl: false, // we add our own control below
      });
      const initialized = map;
      if (!initialized) return;
      mapRef.current = initialized;

      leaflet
        .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        })
        .addTo(initialized);

      leaflet.control.zoom({ position: "bottomright" }).addTo(initialized);

      // Background click: in pick mode report the spot, otherwise clear the
      // selection. (closeOnClick is off so this handler is the single source of truth.)
      initialized.on("click", (event) => {
        if (pickModeRef.current) {
          onPickRef.current({ lat: event.latlng.lat, lng: event.latlng.lng });
          return;
        }
        initialized.closePopup();
        popupRef.current = null;
        onSelectRef.current(null);
      });

      setReady(true);
    })().catch(() => undefined);

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      leafletRef.current = null;
      popupRef.current?.remove();
      popupRef.current = null;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = new Map();
      pickMarkerRef.current?.remove();
      pickMarkerRef.current = null;
    };
  }, []);

  // Sync markers whenever the map is ready or the sightings/filter change.
  // (Rebuilds so uploads and filter changes both land correctly.)
  useEffect(() => {
    const map = mapRef.current;
    const leaflet = leafletRef.current;
    if (!ready || !map || !leaflet) return;

    clearFocusStyling();
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = new Map();

    sightingsRef.current.forEach((sighting) => {
      if (filter !== "all" && sighting.category !== filter) return;

      const meta = CATEGORY_META[sighting.category];
      const icon = leaflet.divIcon({
        className: "sighting-marker",
        html: `<div class="sighting-marker-pin" style="background:${meta.color}"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 20], // tip of the teardrop sits on the coordinate
      });

      const marker = leaflet
        .marker([sighting.lat, sighting.lng], {
          icon,
          title: `${sighting.species} — ${sighting.location}`,
        })
        .addTo(map);

      // Stop the DOM click from bubbling to the map's background handler.
      // In pick mode a marker click drops the pin at that sighting's spot.
      marker.on("click", (event) => {
        leaflet.DomEvent.stopPropagation(event.originalEvent);
        if (pickModeRef.current) {
          onPickRef.current({ lat: sighting.lat, lng: sighting.lng });
          return;
        }
        onSelectRef.current(sighting.id);
      });

      markersRef.current.set(sighting.id, marker);
    });

    // Drop the popup when the focused sighting gets filtered out of view
    // (the marker is gone, but the popup would otherwise stay floating).
    const focusedId = focusIdRef.current;
    const focusedSighting = focusedId ? sightingsById.get(focusedId) : null;
    if (
      focusedId &&
      focusedSighting &&
      filter !== "all" &&
      focusedSighting.category !== filter
    ) {
      map.closePopup();
      popupRef.current = null;
    }

    // Re-apply the focus ring when the focused sighting is still visible after a rebuild
    const focusedMarker =
      focusedId && focusedSighting ? markersRef.current.get(focusedId) : null;
    focusedMarker?.getElement()?.classList.add("sighting-marker--focused");

    // Catch up focus once when the map first becomes ready, only runs first
    if (!didCatchUpRef.current) {
      didCatchUpRef.current = true;
      if (focusedId && focusedSighting && focusedMarker) {
        map.flyTo([focusedSighting.lat, focusedSighting.lng], 11, { duration: 0.6 });
        popupRef.current = openPopupFor(leaflet, map, focusedSighting);
      }
    }
  }, [ready, filter, sightingsById]);

  // Pick mode: show the target pin at the chosen spot.
  useEffect(() => {
    const map = mapRef.current;
    const leaflet = leafletRef.current;
    if (!ready || !map || !leaflet) return;

    pickMarkerRef.current?.remove();
    pickMarkerRef.current = null;
    if (!pickedPoint) return;

    const icon = leaflet.divIcon({
      className: "sighting-marker--pick",
      html: `<div class="sighting-pick-pin"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    pickMarkerRef.current = leaflet
      .marker([pickedPoint.lat, pickedPoint.lng], {
        icon,
        interactive: false,
        keyboard: false,
      })
      .addTo(map);
  }, [ready, pickedPoint]);

  // Crosshair cursor while the form is in pick mode.
  useEffect(() => {
    const el = containerRef.current;
    if (el) el.style.cursor = pickMode ? "crosshair" : "";
  }, [pickMode]);

  // Focus: highlight the marker, fly to it, and open its photo popup.
  useEffect(() => {
    focusIdRef.current = focusId;
    clearFocusStyling();

    const map = mapRef.current;
    const leaflet = leafletRef.current;
    if (!map || !leaflet || !focusId) return;

    const marker = markersRef.current.get(focusId);
    const sighting = sightingsRef.current.find((s) => s.id === focusId);
    if (!marker || !sighting) return;

    marker.getElement()?.classList.add("sighting-marker--focused");
    map.flyTo([sighting.lat, sighting.lng], 11, { duration: 0.6 });

    map.closePopup();
    popupRef.current = openPopupFor(leaflet, map, sighting);
  }, [focusId]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-[420px] w-full overflow-hidden rounded-xl bg-[#DCE7E6] shadow-inner sm:h-[480px]"
        aria-label="Map of recent sightings"
      />
      {pickMode && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-[500] -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/85 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-cream shadow-lg">
          click the map to drop the pin
        </div>
      )}
    </div>
  );
}
