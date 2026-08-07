"use client";

import { useEffect, useRef } from "react";
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
  SIGHTINGS_BY_ID,
  type Sighting,
  type SightingCategory,
} from "@/lib/sightings";

// Leaflet is imported dynamically so it never touches the server render.
type LeafletLib = typeof import("leaflet");

type Props = {
  sightings: Sighting[];
  filter: SightingCategory | "all";
  focusId: string | null;
  onSelect: (id: string | null) => void;
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

export default function SightingMap({ sightings, filter, focusId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<LeafletLib | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const popupRef = useRef<LeafletPopup | null>(null);
  const focusIdRef = useRef<string | null>(focusId);
  const onSelectRef = useRef(onSelect);

  // Keep the latest callback without re-running the one-time map effect.
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  function clearFocusStyling() {
    markersRef.current.forEach((marker) =>
      marker.getElement()?.classList.remove("sighting-marker--focused"),
    );
  }

  // One-time map + marker setup. Sightings are module-static, so this runs once.
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let map: LeafletMap | null = null;
    const markers = new Map<string, LeafletMarker>();

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

      // Clicking empty map closes the popup and clears the list highlight.
      // (closeOnClick is off so this handler is the single source of truth.)
      initialized.on("click", () => {
        initialized.closePopup();
        popupRef.current = null;
        onSelectRef.current(null);
      });

      markersRef.current = markers;
      sightings.forEach((sighting) => {
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
          .addTo(initialized);

        // Stop the DOM click from bubbling to the map's background handler.
        marker.on("click", (event) => {
          leaflet.DomEvent.stopPropagation(event.originalEvent);
          onSelectRef.current(sighting.id);
        });

        markers.set(sighting.id, marker);
      });

      // If a card was selected before the map finished loading, catch up.
      const pending = focusIdRef.current;
      if (pending) {
        const marker = markersRef.current.get(pending);
        const sighting = SIGHTINGS_BY_ID[pending];
        if (marker && sighting) {
          marker.getElement()?.classList.add("sighting-marker--focused");
          initialized.flyTo([sighting.lat, sighting.lng], 11, { duration: 0.6 });
          popupRef.current = openPopupFor(leaflet, initialized, sighting);
        }
      }
    })().catch(() => undefined);

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      leafletRef.current = null;
      popupRef.current?.remove();
      popupRef.current = null;
      markers.forEach((m) => m.remove());
      markersRef.current = new Map();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filters: hide markers that don't match the current filter, and close the popup if the focused sighting is filtered out.
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      if (!el) return;
      const sighting = SIGHTINGS_BY_ID[id];
      const visible = sighting && (filter === "all" || sighting.category === filter);
      el.style.display = visible ? "" : "none";
    });

    const focused = focusIdRef.current;
    if (focused) {
      const sighting = SIGHTINGS_BY_ID[focused];
      if (sighting && filter !== "all" && sighting.category !== filter) {
        mapRef.current?.closePopup();
        popupRef.current = null;
      }
    }
  }, [filter]);

  // Focus: highlight the marker, fly to it, and open its photo popup.
  useEffect(() => {
    focusIdRef.current = focusId;
    clearFocusStyling();

    const map = mapRef.current;
    const leaflet = leafletRef.current;
    if (!map || !leaflet || !focusId) return;

    const marker = markersRef.current.get(focusId);
    const sighting = SIGHTINGS_BY_ID[focusId];
    if (!marker || !sighting) return;

    marker.getElement()?.classList.add("sighting-marker--focused");
    map.flyTo([sighting.lat, sighting.lng], 11, { duration: 0.6 });

    map.closePopup();
    popupRef.current = openPopupFor(leaflet, map, sighting);
  }, [focusId]);

  return (
    <div
      ref={containerRef}
      className="h-[420px] w-full overflow-hidden rounded-xl bg-[#DCE7E6] shadow-inner sm:h-[480px]"
      aria-label="Map of recent sightings"
    />
  );
}
