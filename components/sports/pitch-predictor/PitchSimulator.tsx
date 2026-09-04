"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildFeatureVector,
  loadPitchModel,
  predictProbabilities,
  type PitchModel,
  type AtBatContext,
  type PitchProbabilities,
} from "@/lib/sports/pitchPredictor.ts";
import { PITCH_COLORS, PITCH_NAMES, PITCH_TYPES, type PitchType } from "@/lib/sports/pitchTypes.ts";
import type { Batter, Pitcher } from "@/lib/sports/pitchPlayers.ts";
import PlayerSelect, { type SelectablePlayer } from "./PlayerSelect.tsx";
import { Matchup, ScorebugBar } from "./Scorebug.tsx";
import PredictionBoard from "./PredictionBoard.tsx";

type Outcome = "ball" | "called_strike" | "swinging_strike" | "foul" | "in_play";

const OUTCOME_LABELS: Record<Outcome, string> = {
  ball: "Ball",
  called_strike: "Called Strike",
  swinging_strike: "Swing & Miss",
  foul: "Foul",
  in_play: "In Play",
};

type Result = "STRIKEOUT" | "WALK" | "IN PLAY" | null;

type PitchEvent = {
  id: number;
  pitch: PitchType;
  outcome: Outcome;
  balls: number;
  strikes: number;
};

type SimState = {
  balls: number;
  strikes: number;
  outs: number;
  inning: number;
  scoreDiff: number;
  pitchesThrown: number;
  runnerOn1b: boolean;
  runnerOn2b: boolean;
  runnerOn3b: boolean;
  log: PitchEvent[];
  result: Result;
};

const MAX_AUTO_PITCHES = 12;
// Rough MLB outcome frequencies used by auto mode only (the model predicts
// pitch type, not outcome).
const OUTCOME_POOL: { outcome: Outcome; weight: number }[] = [
  { outcome: "ball", weight: 0.38 },
  { outcome: "called_strike", weight: 0.13 },
  { outcome: "swinging_strike", weight: 0.13 },
  { outcome: "foul", weight: 0.24 },
  { outcome: "in_play", weight: 0.12 },
];

function initialState(): SimState {
  return {
    balls: 0,
    strikes: 0,
    outs: 0,
    inning: 1,
    scoreDiff: 0,
    pitchesThrown: 0,
    runnerOn1b: false,
    runnerOn2b: false,
    runnerOn3b: false,
    log: [],
    result: null,
  };
}

let pitchId = 0;

/** Pure at-bat transition: returns the next state after a thrown pitch. */
function applyPitch(state: SimState, pitch: PitchType, outcome: Outcome): SimState {
  const preBalls = state.balls;
  const preStrikes = state.strikes;
  let { balls, strikes } = state;
  if (outcome === "ball") balls += 1;
  else if (outcome === "called_strike" || outcome === "swinging_strike") strikes += 1;
  else if (outcome === "foul" && strikes < 2) strikes += 1;

  let result: Result = state.result;
  if (strikes >= 3) result = "STRIKEOUT";
  else if (balls >= 4) result = "WALK";
  else if (outcome === "in_play") result = "IN PLAY";

  const event: PitchEvent = {
    id: ++pitchId,
    pitch,
    outcome,
    balls: preBalls,
    strikes: preStrikes,
  };
  return {
    ...state,
    balls: result ? state.balls : balls, // keep final count on display after the at-bat ends
    strikes: result ? state.strikes : strikes,
    pitchesThrown: state.pitchesThrown + 1,
    log: [...state.log, event],
    result,
  };
}

function pickWeighted<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((a, b) => a + b.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">{label}</span>
      <div className="flex items-center overflow-hidden rounded-lg border border-white/15 bg-black/40">
        <button
          type="button"
          aria-label={`decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="px-2.5 py-1.5 font-mono text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          −
        </button>
        <span className="min-w-9 text-center font-mono text-sm text-white">
          {value}
          {suffix ? <span className="ml-0.5 text-[10px] text-white/40">{suffix}</span> : null}
        </span>
        <button
          type="button"
          aria-label={`increase ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="px-2.5 py-1.5 font-mono text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function PitchSimulator({
  pitchers,
  batters,
}: {
  pitchers: Pitcher[];
  batters: Batter[];
}) {
  const [pitcher, setPitcher] = useState<Pitcher | null>(null);
  const [batter, setBatter] = useState<Batter | null>(null);
  const [state, setState] = useState<SimState>(initialState);
  const [selectedPitch, setSelectedPitch] = useState<PitchType | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome | null>(null);
  const [autoRunning, setAutoRunning] = useState(false);

  const [model, setModel] = useState<PitchModel | null>(null);
  const [modelStatus, setModelStatus] = useState<"loading" | "ready" | "error">("loading");
  const [retryKey, setRetryKey] = useState(0);

  const stateRef = useRef(state);
  const autoRef = useRef(false);
  const autoTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    loadPitchModel()
      .then((m) => {
        if (cancelled) return;
        setModel(m);
        setModelStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setModelStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  useEffect(() => {
    return () => {
      autoRef.current = false;
      if (autoTimeout.current) clearTimeout(autoTimeout.current);
    };
  }, []);

  const context: AtBatContext | null = useMemo(() => {
    if (!pitcher || !batter) return null;
    return {
      balls: state.balls,
      strikes: state.strikes,
      pitcherHand: pitcher.hand,
      batterHand: batter.hand,
      outs: state.outs,
      inning: state.inning,
      pitchesThrown: state.pitchesThrown,
      batterKRate: batter.k_rate,
      runnerOn1b: state.runnerOn1b,
      runnerOn2b: state.runnerOn2b,
      runnerOn3b: state.runnerOn3b,
      scoreDiff: state.scoreDiff,
      usage: pitcher.usage,
    };
  }, [pitcher, batter, state]);

  const predictions: PitchProbabilities | null = useMemo(() => {
    if (!model || !context) return null;
    return predictProbabilities(model, buildFeatureVector(context));
  }, [model, context]);

  const canThrow = pitcher !== null && batter !== null && selectedPitch !== null && selectedOutcome !== null && state.result === null && !autoRunning;

  const pitcherSelect: SelectablePlayer | null = pitcher
    ? {
        player_id: pitcher.player_id,
        player_name: pitcher.player_name,
        team: pitcher.team,
        hand: pitcher.hand === "L" ? "LHP" : "RHP",
        sub: Object.entries(pitcher.usage)
          .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
          .slice(0, 2)
          .map(([t, p]) => `${t} ${Math.round(p ?? 0)}%`)
          .join(" · "),
      }
    : null;

  const batterSelect: SelectablePlayer | null = batter
    ? {
        player_id: batter.player_id,
        player_name: batter.player_name,
        team: batter.team,
        hand: batter.hand,
        sub: `K% ${batter.k_rate.toFixed(0)}`,
      }
    : null;

  const commitState = useCallback((next: SimState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const resetAtBat = useCallback(
    (resetPitches = false) => {
      autoRef.current = false;
      setAutoRunning(false);
      if (autoTimeout.current) clearTimeout(autoTimeout.current);
      setSelectedPitch(null);
      setSelectedOutcome(null);
      commitState({
        ...initialState(),
        outs: stateRef.current.outs,
        inning: stateRef.current.inning,
        scoreDiff: stateRef.current.scoreDiff,
        pitchesThrown: resetPitches ? 0 : stateRef.current.pitchesThrown,
        runnerOn1b: stateRef.current.runnerOn1b,
        runnerOn2b: stateRef.current.runnerOn2b,
        runnerOn3b: stateRef.current.runnerOn3b,
      });
    },
    [commitState]
  );

  const resetGame = useCallback(() => {
    autoRef.current = false;
    setAutoRunning(false);
    if (autoTimeout.current) clearTimeout(autoTimeout.current);
    setSelectedPitch(null);
    setSelectedOutcome(null);
    commitState(initialState());
  }, [commitState]);

  const throwPitch = useCallback(
    (pitch: PitchType, outcome: Outcome) => {
      const current = stateRef.current;
      if (current.result) return;
      commitState(applyPitch(current, pitch, outcome));
      setSelectedPitch(null);
      setSelectedOutcome(null);
    },
    [commitState]
  );

  const startAuto = useCallback(() => {
    if (!model || !pitcher || !batter || autoRef.current) return;
    autoRef.current = true;
    setAutoRunning(true);
    setSelectedPitch(null);
    setSelectedOutcome(null);

    const step = () => {
      if (!autoRef.current) return;
      const current = stateRef.current;
      if (current.result || current.log.length >= MAX_AUTO_PITCHES) {
        autoRef.current = false;
        setAutoRunning(false);
        return;
      }
      const ctx: AtBatContext = {
        balls: current.balls,
        strikes: current.strikes,
        pitcherHand: pitcher.hand,
        batterHand: batter.hand,
        outs: current.outs,
        inning: current.inning,
        pitchesThrown: current.pitchesThrown,
        batterKRate: batter.k_rate,
        runnerOn1b: current.runnerOn1b,
        runnerOn2b: current.runnerOn2b,
        runnerOn3b: current.runnerOn3b,
        scoreDiff: current.scoreDiff,
        usage: pitcher.usage,
      };
      const probs = predictProbabilities(model, buildFeatureVector(ctx));
      const pitch = pickWeighted(probs.map((p) => ({ value: p.type, weight: p.prob })));
      const outcome = pickWeighted(OUTCOME_POOL.map((o) => ({ value: o.outcome, weight: o.weight })));
      commitState(applyPitch(current, pitch, outcome));
      autoTimeout.current = setTimeout(step, 560);
    };
    step();
  }, [model, pitcher, batter, commitState]);

  const stopAuto = useCallback(() => {
    autoRef.current = false;
    setAutoRunning(false);
    if (autoTimeout.current) clearTimeout(autoTimeout.current);
  }, []);

  // Sort pitch buttons: arsenal pitches first (by usage), then the rest dimmed.
  const pitchButtons = useMemo(() => {
    const usage = pitcher?.usage ?? {};
    return [...PITCH_TYPES].sort((a, b) => (usage[b] ?? -1) - (usage[a] ?? -1));
  }, [pitcher]);

  const lastEvent = state.log[state.log.length - 1];
  const isFullCount = state.balls === 3 && state.strikes === 2 && !state.result;
  // e.g. "FF → ball" — context shown inside the model's call card mid-at-bat.
  const modelNote =
    lastEvent && !state.result && predictions
      ? `${lastEvent.pitch} → ${OUTCOME_LABELS[lastEvent.outcome].toLowerCase()}`
      : null;

  return (
    <div>
      {/* --- Player selection ------------------------------------------- */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <PlayerSelect
          placeholder="Search a pitcher…"
          players={pitchers.map((p) => ({
            player_id: p.player_id,
            player_name: p.player_name,
            team: p.team,
            hand: p.hand === "L" ? "LHP" : "RHP",
            sub: Object.entries(p.usage)
              .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
              .slice(0, 2)
              .map(([t, q]) => `${t} ${Math.round(q ?? 0)}%`)
              .join(" · "),
          }))}
          selected={pitcherSelect}
          onSelect={(p) => {
            setPitcher(p ? pitchers.find((x) => x.player_id === p.player_id) ?? null : null);
            resetAtBat(true);
          }}
        />
        <PlayerSelect
          placeholder="Search a batter…"
          players={batters.map((b) => ({
            player_id: b.player_id,
            player_name: b.player_name,
            team: b.team,
            hand: b.hand,
            sub: `K% ${b.k_rate.toFixed(0)}`,
          }))}
          selected={batterSelect}
          onSelect={(p) => {
            setBatter(p ? batters.find((x) => x.player_id === p.player_id) ?? null : null);
            resetAtBat();
          }}
        />
      </div>

      {/* --- Broadcast frame --------------------------------------------- */}
      <div className="relative mt-4 overflow-hidden rounded-3xl border border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(255,149,82,0.16),transparent_55%),radial-gradient(ellipse_at_50%_120%,rgba(39,75,109,0.28),transparent_60%)]" />
        <div className="relative p-3 sm:p-5">
          <ScorebugBar
            balls={state.balls}
            strikes={state.strikes}
            outs={state.outs}
            inning={state.inning}
            pitchesThrown={state.pitchesThrown}
            isFullCount={isFullCount}
          />

          <div className="mt-4">
            <Matchup
              pitcher={
                pitcher
                  ? {
                      name: pitcher.player_name,
                      hand: pitcher.hand === "L" ? "LHP" : "RHP",
                      team: pitcher.team,
                      topPitches: Object.entries(pitcher.usage)
                        .map(([t, p]) => ({ type: t as PitchType, pct: p ?? 0 }))
                        .sort((a, b) => b.pct - a.pct),
                    }
                  : null
              }
              batter={
                batter
                  ? { name: batter.player_name, hand: batter.hand, team: batter.team, sub: `K% ${batter.k_rate.toFixed(0)}` }
                  : null
              }
              runnerOn1b={state.runnerOn1b}
              runnerOn2b={state.runnerOn2b}
              runnerOn3b={state.runnerOn3b}
            />
          </div>

          {state.result && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sports-accent/40 bg-sports-accent/10 px-4 py-3">
              <div className="font-sign text-2xl uppercase tracking-widest text-sports-accent sm:text-3xl">
                {state.result}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-white/50">
                  {state.log.length} pitch{state.log.length === 1 ? "" : "es"}
                </span>
                <button
                  type="button"
                  onClick={() => resetAtBat()}
                  className="rounded-full bg-sports-accent px-4 py-1.5 font-mono text-[11px] font-medium uppercase tracking-widest text-black transition-colors hover:bg-white"
                >
                  New at-bat
                </button>
              </div>
            </div>
          )}

          {/* Pitch log */}
          {state.log.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
                Log
              </span>
              {state.log.map((event) => (
                <span
                  key={event.id}
                  className="flex items-center gap-1.5 rounded-md border border-white/10 bg-black/50 px-2 py-1 font-mono text-[11px] text-white/80"
                >
                  <span
                    className="inline-flex size-4 items-center justify-center rounded text-[8px] font-bold text-black"
                    style={{ backgroundColor: PITCH_COLORS[event.pitch] }}
                  >
                    {event.pitch}
                  </span>
                  {OUTCOME_LABELS[event.outcome]}
                  <span className="text-white/35">
                    {event.balls}-{event.strikes}
                  </span>
                </span>
              ))}
            </div>
          )}

          {!pitcher || !batter ? (
            <p className="mt-5 text-center font-mono text-[11px] uppercase tracking-widest text-white/30">
              Select a pitcher and batter above to start the at-bat
            </p>
          ) : null}
        </div>
      </div>

      {/* --- Control deck ------------------------------------------------ */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <Stepper label="Outs" value={state.outs} min={0} max={2} onChange={(v) => commitState({ ...stateRef.current, outs: v })} />
          <Stepper label="Inning" value={state.inning} min={1} max={9} onChange={(v) => commitState({ ...stateRef.current, inning: v })} />
          <Stepper
            label="Run diff"
            value={state.scoreDiff}
            min={-10}
            max={10}
            onChange={(v) => commitState({ ...stateRef.current, scoreDiff: v })}
          />
          <Stepper
            label="Pitches thrown"
            value={state.pitchesThrown}
            min={0}
            max={130}
            onChange={(v) => commitState({ ...stateRef.current, pitchesThrown: v })}
          />
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">Runners</span>
            <div className="flex gap-1.5">
              {(
                [
                  ["1B", "runnerOn1b"],
                  ["2B", "runnerOn2b"],
                  ["3B", "runnerOn3b"],
                ] as const
              ).map(([label, key]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={state[key]}
                  onClick={() => commitState({ ...stateRef.current, [key]: !state[key] })}
                  className={`rounded-lg border px-3 py-2 font-mono text-[11px] font-medium tracking-wider transition-colors ${
                    state[key]
                      ? "border-sports-accent/60 bg-sports-accent/20 text-sports-accent"
                      : "border-white/15 bg-black/40 text-white/35 hover:text-white/60"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={resetGame}
              className="rounded-full border border-white/15 bg-black/40 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-white/50 transition-colors hover:border-white/30 hover:text-white"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={autoRunning ? stopAuto : startAuto}
              disabled={!model || !pitcher || !batter || (!!state.result && !autoRunning)}
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-white/70 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {autoRunning ? "Stop auto" : "Auto at-bat"}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-sports-accent">
              Call the pitch
            </span>
            {predictions && (
              <button
                type="button"
                onClick={() => {
                  const top = predictions[0];
                  if (top) setSelectedPitch(top.type);
                }}
                className="font-mono text-[10px] uppercase tracking-widest text-white/40 transition-colors hover:text-sports-accent"
              >
                Auto-pick (model) →
              </button>
            )}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
            {pitchButtons.map((type) => {
              const used = (pitcher?.usage[type] ?? 0) > 0;
              const isSelected = selectedPitch === type;
              return (
                <button
                  key={type}
                  type="button"
                  disabled={!!state.result || autoRunning}
                  onClick={() => setSelectedPitch(isSelected ? null : type)}
                  className={`group flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? "border-sports-accent bg-sports-accent/15"
                      : "border-white/10 bg-black/40 hover:border-white/30"
                  } ${used ? "" : "opacity-40"}`}
                >
                  <span
                    className="flex size-8 items-center justify-center rounded-lg font-sign text-sm text-black transition-transform group-hover:scale-105"
                    style={{ backgroundColor: PITCH_COLORS[type] }}
                  >
                    {type}
                  </span>
                  <span className="text-center font-mono text-[9px] uppercase leading-tight text-white/60">
                    {PITCH_NAMES[type]}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-widest text-white/25">
            Dimmed pitches aren&apos;t in this pitcher&apos;s arsenal
          </p>
        </div>

        <div className="mt-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-sports-accent">
            Outcome
          </span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(Object.keys(OUTCOME_LABELS) as Outcome[]).map((outcome) => (
              <button
                key={outcome}
                type="button"
                disabled={!!state.result || autoRunning}
                onClick={() => setSelectedOutcome(selectedOutcome === outcome ? null : outcome)}
                className={`rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  selectedOutcome === outcome
                    ? "border-sports-accent bg-sports-accent/15 text-sports-accent"
                    : "border-white/15 bg-black/40 text-white/60 hover:border-white/30 hover:text-white"
                }`}
              >
                {OUTCOME_LABELS[outcome]}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={!canThrow}
          onClick={() => {
            if (selectedPitch && selectedOutcome) throwPitch(selectedPitch, selectedOutcome);
          }}
          className="mt-5 w-full rounded-xl bg-sports-accent py-3 font-sign text-lg uppercase tracking-[0.2em] text-black transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-30 sm:text-xl"
        >
          Throw pitch
        </button>
      </div>

      {/* --- Prediction board -------------------------------------------- */}
      <div className="mt-4">
        <PredictionBoard
          predictions={
            predictions ? predictions.map((p) => ({ type: p.type, prob: p.prob })) : null
          }
          modelStatus={modelStatus}
          onRetry={() => {
            setModelStatus("loading");
            setRetryKey((k) => k + 1);
          }}
          note={modelNote}
        />
      </div>
    </div>
  );
}