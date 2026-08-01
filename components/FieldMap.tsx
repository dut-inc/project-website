"use client";

import { useMemo, useState } from "react";
import type { FieldSighting, FieldSpecies } from "@/lib/fieldWatch";
import { speciesById } from "@/lib/fieldWatch";

// FieldMap — a tactical-style SVG "radar" map of the PNW. Faint grid +
// compass rose + a hand-drawn-ish coastline outline. Pins are colored by
// species category, with click-to-drop, position-aware popouts, real
// remove buttons, and keyboard reach.

type Props = {
  pendingCoord: { x: number; y: number } | null;
  sightings: FieldSighting[];
  onDropCoord: (x: number, y: number) => void;
  onRemove: (id: string) => void;
};

const CATEGORY_FILL: Record<FieldSpecies["category"], string> = {
  bird: "#C9A227",
  fish: "#3A8FB7",
  mammal: "#C1442D",
  plant: "#5C8A3E",
  other: "#7B7B7B",
};

const CATEGORY_STROKE: Record<FieldSpecies["category"], string> = {
  bird: "#FFE08A",
  fish: "#7CC6E6",
  mammal: "#F57E66",
  plant: "#9BC57D",
  other: "#B5B5B5",
};

const POP_W = 220;
const POP_H = 96;

export default function FieldMap({
  pendingCoord,
  sightings,
  onDropCoord,
  onRemove,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  // Click-to-drop: capture the SVG coord space from the click clientX/Y.
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0.04 || x > 0.96 || y < 0.04 || y > 0.96) return;
    onDropCoord(x, y);
  };

  const sortedSightings = useMemo(
    () => [...sightings].sort((a, b) => b.createdAt - a.createdAt),
    [sightings]
  );

  return (
    <div className="rounded-md border border-pinTeal/30 bg-black/40 font-mono text-sm text-pinTeal shadow-[0_0_0_1px_rgba(47,122,107,0.05),inset_0_0_40px_rgba(47,122,107,0.06)]">
      <header className="flex items-center justify-between border-b border-pinTeal/20 px-4 py-2 text-[10px] uppercase tracking-widest text-pinTeal/80">
        <span>sighting map · {sortedSightings.length} pins</span>
        <span className="text-pinTeal/60">
          {pendingCoord ? "press confirm to place" : "click map to drop a pin"}
        </span>
      </header>

      <div className="relative aspect-[5/4] w-full">
        <svg
          viewBox="0 0 500 400"
          className="h-full w-full cursor-crosshair"
          onClick={handleSvgClick}
          aria-label="Tactical sight map. Click to drop a sighting pin."
          role="application"
        >
          <defs>
            <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
              <path
                d="M 25 0 L 0 0 0 25"
                fill="none"
                stroke="#2F7A6B"
                strokeOpacity="0.18"
                strokeWidth="0.6"
              />
            </pattern>
            <radialGradient id="oceanFill" cx="50%" cy="60%" r="60%">
              <stop offset="0%" stopColor="#2F7A6B" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#2F7A6B" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="220" cy="280" r="200" fill="url(#oceanFill)" />
          <rect width="500" height="400" fill="url(#grid)" />

          <path
            d="M 110 60 C 160 90, 230 70, 290 100 S 410 130, 460 180 L 470 360 L 60 360 L 90 220 C 70 180, 80 110, 110 60 Z"
            fill="#2F7A6B"
            fillOpacity="0.08"
            stroke="#2F7A6B"
            strokeOpacity="0.45"
            strokeWidth="1.2"
            strokeDasharray="3 4"
          />

          <g transform="translate(450, 50)" fontFamily="monospace" fontSize="9" fill="#2F7A6B" opacity="0.7">
            <circle cx="0" cy="0" r="18" fill="none" stroke="#2F7A6B" strokeOpacity="0.4" />
            <text x="0" y="-22" textAnchor="middle">N</text>
            <text x="0" y="30" textAnchor="middle">S</text>
            <text x="-22" y="3" textAnchor="middle">W</text>
            <text x="22" y="3" textAnchor="middle">E</text>
            <line x1="0" y1="-15" x2="0" y2="15" stroke="#2F7A6B" strokeOpacity="0.6" />
            <line x1="-15" y1="0" x2="15" y2="0" stroke="#2F7A6B" strokeOpacity="0.6" />
          </g>

          <g transform="translate(20, 380)" fontFamily="monospace" fontSize="8" fill="#2F7A6B" opacity="0.7">
            <line x1="0" y1="0" x2="60" y2="0" stroke="#2F7A6B" strokeOpacity="0.7" />
            <line x1="0" y1="-3" x2="0" y2="3" stroke="#2F7A6B" strokeOpacity="0.7" />
            <line x1="60" y1="-3" x2="60" y2="3" stroke="#2F7A6B" strokeOpacity="0.7" />
            <text x="0" y="13">0</text>
            <text x="56" y="13">~5mi</text>
          </g>

          {sortedSightings.map((s) => {
            const sp = speciesById(s.speciesId);
            if (!sp) return null;
            const cx = s.x * 500;
            const cy = s.y * 400;
            const fill = CATEGORY_FILL[sp.category];
            const stroke = CATEGORY_STROKE[sp.category];
            const isOpen = openId === s.id;
            // Flip popout away from edges so it never clips the map container.
            const xFlip = cx > 290 ? -POP_W - 6 : 6;
            const yFlip = cy < POP_H + 30 ? 14 : -POP_H - 6;
            return (
              <g
                key={s.id}
                transform={`translate(${cx}, ${cy})`}
              >
                <g
                  role="button"
                  tabIndex={0}
                  aria-label={`${sp.common} sighting, ${Math.round(s.confidence * 100)}% confidence. Press enter to ${
                    isOpen ? "close" : "open"
                  } details.`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenId(isOpen ? null : s.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenId(isOpen ? null : s.id);
                    } else if (e.key === "Escape" && isOpen) {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenId(null);
                    }
                  }}
                  className="cursor-pointer focus:outline-none"
                >
                  {/* Larger invisible hit area for easier click */}
                  <circle r="14" fill="transparent" />
                  <circle
                    r="9"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="2"
                  >
                    {isOpen && (
                      <animate attributeName="r" values="9;11;9" dur="1.4s" repeatCount="indefinite" />
                    )}
                  </circle>
                  <circle r="3" fill="#0E0F11" />
                  {/* Real focus ring — fades in via focus-visible only
                      so keyboard users actually see which pin is focused. */}
                  <circle
                    r="13"
                    fill="none"
                    stroke="#C9A227"
                    strokeWidth="2.5"
                    pointerEvents="none"
                    className="opacity-0 transition-opacity duration-100 focus-visible:opacity-100"
                  />
                </g>

                {isOpen && (
                  <g
                    transform={`translate(${xFlip}, ${yFlip})`}
                    fontFamily="monospace"
                    fontSize="10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <rect
                      x="0"
                      y="0"
                      width={POP_W}
                      height={POP_H}
                      rx="4"
                      fill="#0E0F11"
                      stroke={fill}
                      strokeWidth="1"
                      opacity="0.96"
                    />
                    <text x="10" y="16" fill={stroke} fontWeight="bold">
                      {sp.common.length > 26 ? sp.common.slice(0, 25) + "…" : sp.common}
                    </text>
                    <text x="10" y="30" fill="#EFE7D2" fontStyle="italic" opacity="0.7">
                      {sp.scientific}
                    </text>
                    <text x="10" y="48" fill="#EFE7D2" opacity="0.55" fontSize="9">
                      {Math.round(s.confidence * 100)}% ·{" "}
                      {new Date(s.createdAt).toISOString().slice(0, 16).replace("T", " ")}
                    </text>
                    {s.caption && (
                      <text x="10" y="62" fill="#EFE7D2" opacity="0.55" fontSize="9">
                        “{s.caption.slice(0, 30)}{s.caption.length > 30 ? "…" : ""}”
                      </text>
                    )}
                    {/* Real remove button — focusable SVG group */}
                    <g
                      role="button"
                      tabIndex={0}
                      aria-label="Remove this sighting"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(s.id);
                        setOpenId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          onRemove(s.id);
                          setOpenId(null);
                        }
                      }}
                      cursor="pointer"
                      transform="translate(10, 70)"
                    >
                      <rect
                        width="64"
                        height="16"
                        rx="3"
                        fill={fill}
                        fillOpacity="0.18"
                        stroke={fill}
                        strokeWidth="1"
                        className="focus-visible:fill-opacity-40 focus-visible:[stroke-width:2]"
                      />
                      <text x="32" y="11" textAnchor="middle" fill={stroke} fontSize="9" fontWeight="bold">
                        REMOVE
                      </text>
                    </g>
                  </g>
                )}
              </g>
            );
          })}

          {pendingCoord && (
            <g transform={`translate(${pendingCoord.x * 500}, ${pendingCoord.y * 400})`}>
              <circle r="14" fill="none" stroke="#C9A227" strokeWidth="1.5">
                <animate attributeName="r" values="10;16;10" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
              </circle>
              <circle r="6" fill="#C9A227" />
            </g>
          )}
        </svg>

        <div className="pointer-events-none absolute bottom-2 right-2 flex flex-col gap-1 rounded-sm border border-pinTeal/20 bg-black/60 px-2.5 py-1.5 text-[9px] uppercase tracking-widest text-pinTeal/80">
          {Object.entries(CATEGORY_FILL).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: v }}
              />
              <span>{k}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
