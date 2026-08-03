"use client";

import Image from "next/image";
import { useState } from "react";
import type { PlayerArchetype } from "@/lib/archetypes";
import { teamGradient, TEAM_COLORS } from "@/lib/teamColors";
import ShotZoneHeatmap from "./ShotZoneHeatmap";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between border-b border-white/10 py-2 last:border-0">
      <span className="font-mono text-[11px] uppercase tracking-widest text-white/70">{label}</span>
      <span className="font-mono text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

export default function PlayerCardModern({ player }: { player: PlayerArchetype }) {
  const [imgFailed, setImgFailed] = useState(false);
  const { primary, secondary } = teamGradient(player.team);
  const teamName = player.team ? TEAM_COLORS[player.team.toUpperCase()]?.name : undefined;
  const photoUrl = `https://cdn.nba.com/headshots/nba/latest/260x190/${player.player_id}.png`;

  return (
    <section
      aria-labelledby="player-profile-name"
      className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]"
      style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}
    >
      <div className="grid gap-6 bg-black/55 p-6 sm:grid-cols-[1.1fr_1fr] sm:p-8">
        <div>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-white/10">
              {!imgFailed ? (
                <Image
                  src={photoUrl}
                  alt={player.player_name}
                  fill
                  sizes="80px"
                  className="object-cover"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center font-body text-2xl font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
                  aria-hidden="true"
                >
                  {initials(player.player_name)}
                </div>
              )}
            </div>
            <div>
              <h2 id="player-profile-name" className="font-body text-2xl font-bold text-white">
                {player.player_name}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {teamName && (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-white/70">
                    {teamName}
                  </span>
                )}
                <span className="rounded-full bg-sports-accent px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-black">
                  {player.archetype}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {player.ppg !== undefined && <StatRow label="Points / gm" value={player.ppg.toFixed(1)} />}
            {player.rpg !== undefined && <StatRow label="Rebounds / gm" value={player.rpg.toFixed(1)} />}
            {player.apg !== undefined && <StatRow label="Assists / gm" value={player.apg.toFixed(1)} />}
            <StatRow label="FG attempts" value={player.total_fga} />
            <StatRow label="3PT rate" value={`${Math.round(player.three_point_rate * 100)}%`} />
            <StatRow label="% assisted" value={`${Math.round(player.pct_assisted * 100)}%`} />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <ShotZoneHeatmap player={player} />
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-white/40">
            Shading = FG% by zone
          </p>
        </div>
      </div>
    </section>
  );
}
