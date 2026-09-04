"use client";

// Team logo. When the team's data provides a `logoUrl` (e.g. a PNG asset),
// it is rendered as-is inside the same circular, shadowed frame — dropping
// real logos in later requires no component changes. Without a logoUrl it
// falls back to a consistent initials placeholder tinted with the team's
// colors. Accepts colors + shortName directly (not a full Team) so the live
// scoreboard can render an opponent placeholder without an opponent Team.

import type { TeamColors } from "@/lib/sports/types";

export default function TeamLogo({
  colors,
  shortName,
  logoUrl,
  size = 52,
}: {
  colors: TeamColors;
  shortName: string;
  logoUrl?: string;
  size?: number;
}) {
  const initials = shortName.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();

  return (
    <div
      className="flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        background: colors.primary,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -2px 6px rgba(0,0,0,0.35), 0 4px 12px -2px rgba(0,0,0,0.55)",
      }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${shortName} logo`}
          draggable={false}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className="font-display font-semibold text-white/95"
          style={{ fontSize: size * 0.32 }}
          aria-hidden="true"
        >
          {initials}
        </span>
      )}
    </div>
  );
}
