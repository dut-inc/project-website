import type { PlayerArchetype } from "@/lib/archetypes";

// Flat, stylized shot-zone map (not to exact court scale). Colored by
// zone efficiency (FG%) on an orange intensity scale; frequency (% of
// shots) is printed as the label since two numbers in one shade isn't
// readable.

function zoneColor(fgPct: number) {
  const min = 0.25;
  const max = 0.65;
  const t = Math.max(0, Math.min(1, (fgPct - min) / (max - min)));
  // interpolate a dark ember -> bright orange
  const from = { r: 0x3a, g: 0x22, b: 0x13 };
  const to = { r: 0xff, g: 0x8a, b: 0x3d };
  const r = Math.round(from.r + (to.r - from.r) * t);
  const g = Math.round(from.g + (to.g - from.g) * t);
  const b = Math.round(from.b + (to.b - from.b) * t);
  return `rgb(${r},${g},${b})`;
}

function ZoneLabel({ x, y, pct }: { x: number; y: number | string; pct: number }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill="rgba(255,255,255,0.85)"
      fontSize="11"
      fontFamily="var(--font-mono, monospace)"
      fontWeight={600}
    >
      {Math.round(pct * 100)}%
    </text>
  );
}

export default function ShotZoneHeatmap({ player }: { player: PlayerArchetype }) {
  return (
    <svg viewBox="0 0 240 220" className="w-full max-w-[280px]" role="img" aria-label="Shot zone efficiency map">
      <rect width="240" height="220" rx="10" fill="#0F1013" />

      {/* above the break 3 */}
      <rect x="10" y="146" width="220" height="64" rx="6" fill={zoneColor(player.fgpct_above_break3)} />
      <ZoneLabel x={120} y="182" pct={player.fgpct_above_break3} />

      {/* corner 3s */}
      <rect x="10" y="16" width="30" height="130" fill={zoneColor(player.fgpct_corner3)} />
      <rect x="200" y="16" width="30" height="130" fill={zoneColor(player.fgpct_corner3)} />
      <ZoneLabel x={25} y="100" pct={player.fgpct_corner3} />
      <ZoneLabel x={215} y="100" pct={player.fgpct_corner3} />

      {/* midrange */}
      <rect x="40" y="16" width="50" height="130" fill={zoneColor(player.fgpct_midrange)} />
      <rect x="150" y="16" width="50" height="130" fill={zoneColor(player.fgpct_midrange)} />
      <ZoneLabel x={65} y="90" pct={player.fgpct_midrange} />
      <ZoneLabel x={175} y="90" pct={player.fgpct_midrange} />

      {/* paint (non-RA) */}
      <rect x="90" y="16" width="60" height="130" fill={zoneColor(player.fgpct_paint_non_ra)} />
      <ZoneLabel x={120} y="120" pct={player.fgpct_paint_non_ra} />

      {/* restricted area */}
      <path d="M 96 16 A 24 24 0 0 1 144 16 Z" fill={zoneColor(player.fgpct_rim)} />
      <ZoneLabel x={120} y="34" pct={player.fgpct_rim} />

      {/* court outline + hoop */}
      <rect x="10" y="10" width="220" height="205" rx="4" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <line x1="105" y1="14" x2="135" y2="14" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
      <circle cx="120" cy="16" r="2.5" fill="rgba(255,255,255,0.5)" />
    </svg>
  );
}
