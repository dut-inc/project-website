"use client";

import { bestKey, useBestStreak } from "./streakStore";

// "Best 12" for a mode on the selection screen, once this browser has one.
export default function BestStreak({ setId, modeId }: { setId: string; modeId: string }) {
  const best = useBestStreak(bestKey(setId, modeId));
  if (!best) return null;
  return (
    <>
      Best <span className="text-fid-sand">{best}</span>
    </>
  );
}
