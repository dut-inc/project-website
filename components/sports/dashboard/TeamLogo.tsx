"use client";

import Image from "next/image";
import type { TeamColors } from "@/lib/sports/types";

const SEATTLE_LOGOS: Record<string, string> = {
  Mariners: "/images/Seattle/Mariners.png",
  Seahawks: "/images/Seattle/Seahawks.png",
  Kraken: "/images/Seattle/Kraken.png",
  Storm: "/images/Seattle/Storm.png",
  Sounders: "/images/Seattle/Sounders.png",
  Reign: "/images/Seattle/Reign.png",
  Seawolves: "/images/Seattle/Seawolves.png",
  Torrent: "/images/Seattle/Torrent.png",
  SuperSonics: "/images/NBA/SEA.png",
};

/**
 * Logo asset used by the Seattle dashboard. The explicit prop remains
 * supported for live opponents and future teams; Seattle's uploaded assets
 * fill in automatically when the data has no logo URL yet.
 */
function resolveLogoUrl(shortName: string, logoUrl?: string) {
  return logoUrl ?? SEATTLE_LOGOS[shortName];
}

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
  const resolvedLogoUrl = resolveLogoUrl(shortName, logoUrl);

  return (
    <div
      className="flex shrink-0 select-none items-center justify-center"
      style={{ width: size, height: size }}
    >
      {resolvedLogoUrl ? (
        <Image
          src={resolvedLogoUrl}
          alt={`${shortName} logo`}
          width={size}
          height={size}
          draggable={false}
          className="h-full w-full object-contain"
        />
      ) : (
        <span
          className="font-display font-semibold"
          style={{ color: colors.primary, fontSize: size * 0.32 }}
          aria-hidden="true"
        >
          {initials}
        </span>
      )}
    </div>
  );
}
