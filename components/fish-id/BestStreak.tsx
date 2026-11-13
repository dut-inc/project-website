"use client";

import { RUN_LENGTH } from "@/lib/fishId/engine";
import { bestKey, useBest } from "./streakStore";

// "Best 10/12" for a mode on the selection screen, once this browser has one.
export default function BestStreak({ setId, modeId }: { setId: string; modeId: string }) {
  const best = useBest(bestKey(setId, modeId));
  if (!best) return null;
  return (
    <>
      Best <span className="text-fid-sand">{best}</span>/{RUN_LENGTH}
    </>
  );
}
