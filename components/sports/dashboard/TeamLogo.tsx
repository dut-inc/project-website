"use client";

// Placeholder team logo: consistent across every card, tinted with the
// team's colors. Real logos can drop in later without touching layout.

import type { Team } from "@/lib/sports/types";

export default function TeamLogo({ team, size = 52 }: { team: Team; size?: number }) {
  const initials = team.shortName.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();

  return (
    <div
      className="flex shrink-0 select-none items-center justify-center rounded-full font-display font-semibold text-white/95"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.32,
        background: `linear-gradient(135deg, ${team.colors.primary} 0%, ${team.colors.secondary} 100%)`,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -2px 6px rgba(0,0,0,0.35), 0 4px 12px -2px rgba(0,0,0,0.55)",
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
