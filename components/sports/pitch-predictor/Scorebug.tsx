"use client";

import { PITCH_COLORS, type PitchType } from "@/lib/sports/pitchTypes.ts";

export type MatchupSide = {
  name: string;
  hand: string;
  team: string;
  sub?: string;
  /** Pitcher's top pitches for the mini usage bars. */
  topPitches?: { type: PitchType; pct: number }[];
};

function ScoreCell({
  label,
  value,
  highlight,
  divider,
  className = "",
}: {
  label: string;
  value: number;
  highlight?: boolean;
  divider?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex items-baseline gap-1.5 px-2.5 py-1 ${divider ? "border-l border-white/10 " : ""}${className}`}
    >
      <span className="text-[8px] uppercase tracking-[0.18em] text-white/40">{label}</span>
      <span className={`text-sm font-semibold leading-none ${highlight ? "text-sports-accent" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

export function ScorebugBar({
  balls,
  strikes,
  outs,
  inning,
  pitchesThrown,
  isFullCount,
}: {
  balls: number;
  strikes: number;
  outs: number;
  inning: number;
  pitchesThrown: number;
  isFullCount: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-red-500" />
        </span>
        <span className="font-mono text-[9px] font-medium uppercase tracking-[0.25em] text-white/60">
          At-bat
        </span>
      </div>

      <div
        className={`flex items-center overflow-hidden rounded-lg border font-mono ${
          isFullCount
            ? "border-sports-accent/60 bg-sports-accent/15"
            : "border-white/10 bg-black/50"
        }`}
      >
        <ScoreCell label="Balls" value={balls} highlight={isFullCount} />
        <ScoreCell label="Strikes" value={strikes} divider highlight={isFullCount} />
        <ScoreCell label="Outs" value={outs} divider highlight={isFullCount} />
        <ScoreCell label="Inning" value={inning} divider className="hidden sm:flex" />
        <ScoreCell label="Pitches" value={pitchesThrown} divider className="hidden md:flex" />
      </div>
    </div>
  );
}

function RunnerDiamond({
  runnerOn1b,
  runnerOn2b,
  runnerOn3b,
}: {
  runnerOn1b: boolean;
  runnerOn2b: boolean;
  runnerOn3b: boolean;
}) {
  const base = (x: number, y: number, label: string, occupied: boolean) => (
    <g>
      <rect
        x={x - 11}
        y={y - 11}
        width={22}
        height={22}
        rx={3}
        fill={occupied ? "#FF9552" : "rgba(255,255,255,0.06)"}
        stroke={occupied ? "#FF9552" : "rgba(255,255,255,0.2)"}
        strokeWidth={1.5}
      />
      <text
        x={x}
        y={y + 3.5}
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fill={occupied ? "#0B0B0D" : "rgba(255,255,255,0.45)"}
        fontFamily="monospace"
      >
        {label}
      </text>
    </g>
  );

  return (
    <svg viewBox="0 0 120 120" className="w-28 shrink-0 sm:w-32" aria-label="Runner diamond">
      <path
        d="M60 104 L104 60 L60 16 L16 60 Z"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {base(104, 60, "1B", runnerOn1b)}
      {base(60, 16, "2B", runnerOn2b)}
      {base(16, 60, "3B", runnerOn3b)}
      {base(60, 104, "HP", false)}
    </svg>
  );
}

function MatchupCard({
  side,
  align,
  role,
}: {
  side: MatchupSide;
  align: "left" | "right";
  role: "P" | "H";
}) {
  const [roleName, roleColor] = role === "P" ? ["PITCHER", "#FF9552"] : ["BATTER", "#7FD1AE"];
  const right = align === "right";
  return (
    <div className={`min-w-0 flex-1 ${right ? "text-right" : ""}`}>
      <div
        className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] ${
          right ? "justify-end" : ""
        }`}
      >
        <span
          className="inline-flex size-5 items-center justify-center rounded-md font-bold"
          style={{ backgroundColor: roleColor, color: "#0B0B0D" }}
        >
          {role}
        </span>
        <span style={{ color: roleColor }}>{roleName}</span>
      </div>
      <div className="mt-1 truncate font-sign text-2xl uppercase leading-none tracking-wide text-white sm:text-3xl">
        {side.name}
      </div>
      <div className="mt-1 truncate font-mono text-[11px] uppercase tracking-widest text-white/45">
        {side.hand} · {side.team}
        {side.sub ? ` · ${side.sub}` : ""}
      </div>

      {side.topPitches && side.topPitches.length > 0 && (
        <div className="mt-3 flex flex-col gap-1">
          {side.topPitches.slice(0, 3).map((p) => (
            <div key={p.type} className="flex items-center gap-2">
              <span
                className="inline-block size-2 shrink-0 rounded-full"
                style={{ backgroundColor: PITCH_COLORS[p.type] }}
              />
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, p.pct)}%`, backgroundColor: PITCH_COLORS[p.type] }}
                />
              </div>
              <span className="w-10 shrink-0 font-mono text-[10px] text-white/50">
                {p.type} {p.pct.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Matchup({
  pitcher,
  batter,
  runnerOn1b,
  runnerOn2b,
  runnerOn3b,
}: {
  pitcher: MatchupSide | null;
  batter: MatchupSide | null;
  runnerOn1b: boolean;
  runnerOn2b: boolean;
  runnerOn3b: boolean;
}) {
  return (
    <div className="flex items-start gap-4 sm:gap-6">
      <MatchupCard
        side={pitcher ?? { name: "—", hand: "", team: "SELECT PITCHER" }}
        align="left"
        role="P"
      />
      <div className="flex flex-col items-center self-center">
        <RunnerDiamond runnerOn1b={runnerOn1b} runnerOn2b={runnerOn2b} runnerOn3b={runnerOn3b} />
      </div>
      <MatchupCard
        side={batter ?? { name: "—", hand: "", team: "SELECT BATTER" }}
        align="right"
        role="H"
      />
    </div>
  );
}
