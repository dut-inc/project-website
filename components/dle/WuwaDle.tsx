"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  getDailyWuwaForteResonator,
  getDailyWuwaResonator,
  normalizeResonatorName,
  pacificDateString,
  WUWA_FORTE_RESONATORS,
  WUWA_RESONATORS,
  type WuwaResonator,
} from "@/lib/dleWuwa";

const MAX_GUESSES = 6;
const CELL_CLASS = "flex min-h-20 w-full items-center justify-center rounded border px-2 text-center";

type GameMode = "resonator" | "forte";
type GuessResult = "correct" | "partial" | "wrong";
type VersionDirection = "higher" | "lower" | "same";

type Guess = {
  resonator: WuwaResonator;
  matches: Record<"quality" | "element" | "weapon" | "affiliation" | "version", GuessResult>;
  versionDirection: VersionDirection;
};

const fields = [
  { key: "quality", label: "Rarity" },
  { key: "element", label: "Element" },
  { key: "weapon", label: "Weapon" },
  { key: "affiliation", label: "Affiliation" },
  { key: "version", label: "Version" },
] as const;

function matchResult(value: string | number | null, answer: string | number | null): GuessResult {
  if (value === answer) return "correct";
  if (value && answer && typeof value === "string" && typeof answer === "string") {
    const guessValues = value.split(", ").map((item) => item.trim());
    const answerValues = answer.split(", ").map((item) => item.trim());
    if (guessValues.some((item) => answerValues.includes(item))) return "partial";
  }
  return "wrong";
}

function versionMajor(version: string | null) {
  if (!version) return null;
  return /^(\d+)/.exec(version.trim())?.[1] ?? null;
}

function versionMatchResult(guess: string | null, answer: string | null): GuessResult {
  if (guess === answer) return "correct";
  return versionMajor(guess) === versionMajor(answer) && versionMajor(guess) !== null ? "partial" : "wrong";
}

function versionRank(version: string | null) {
  if (!version) return 0;
  const match = /^(\d+)(?:\.(\d+))?$/.exec(version.trim());
  return match ? Number(match[1]) * 100 + Number(match[2] ?? 0) : 0;
}

function compareVersions(guess: string | null, answer: string | null): VersionDirection {
  const guessRank = versionRank(guess);
  const answerRank = versionRank(answer);
  if (guessRank === answerRank) return "same";
  return guessRank > answerRank ? "higher" : "lower";
}

function resultClass(result: GuessResult) {
  if (result === "correct") return "border-pinTeal/70 bg-pinTeal/20 text-cream";
  if (result === "partial") return "border-pinGold/70 bg-pinGold/15 text-cream";
  return "border-pinRed/50 bg-pinRed/10 text-cream/80";
}

function dateInputValue(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function shiftDate(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return dateInputValue(date);
}

function Icon({ src, alt, size = 76 }: { src: string | null; alt: string; size?: number }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) return <span className="text-cream/30">—</span>;
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      unoptimized
      className="object-contain"
      style={{ width: size, height: size }}
      onError={() => setHasError(true)}
    />
  );
}

function AttributeIcon({ value, icon, label }: { value: string | null; icon: string | null; label: string }) {
  return (
    <>
      {icon ? <Icon src={icon} alt={`${value ?? label} ${label.toLowerCase()} icon`} size={48} /> : <span className="text-center text-xs text-cream/65">{value ?? "—"}</span>}
      <span className="sr-only">{value ?? "Unknown"}</span>
    </>
  );
}

export default function WuwaDle() {
  const today = pacificDateString();
  const [mode, setMode] = useState<GameMode>("resonator");
  const [activeDate, setActiveDate] = useState(today);
  const [activeResonatorName, setActiveResonatorName] = useState<string | null>(null);
  const [randomResonatorName, setRandomResonatorName] = useState<string | null>(null);
  const [randomForteResonatorName, setRandomForteResonatorName] = useState<string | null>(null);
  const [devDate, setDevDate] = useState(today);
  const [devResonatorName, setDevResonatorName] = useState("");
  const [phaseOneGuesses, setPhaseOneGuesses] = useState<Guess[]>([]);
  const [phaseTwoGuesses, setPhaseTwoGuesses] = useState<Guess[]>([]);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<"won" | "lost" | null>(null);
  const [completedModes, setCompletedModes] = useState<Record<GameMode, boolean>>({ resonator: false, forte: false });

  const phaseOneAnswer = useMemo(() => {
    if (randomResonatorName) return WUWA_RESONATORS.find((resonator) => resonator.name === randomResonatorName) ?? getDailyWuwaResonator(activeDate);
    if (activeResonatorName) return WUWA_RESONATORS.find((resonator) => resonator.name === activeResonatorName) ?? getDailyWuwaResonator(activeDate);
    return getDailyWuwaResonator(activeDate);
  }, [activeDate, activeResonatorName, randomResonatorName]);

  const phaseTwoAnswer = useMemo(() => {
    if (randomForteResonatorName) return WUWA_FORTE_RESONATORS.find((resonator) => resonator.name === randomForteResonatorName) ?? getDailyWuwaForteResonator(activeDate);
    return getDailyWuwaForteResonator(activeDate);
  }, [activeDate, randomForteResonatorName]);

  const answer = mode === "resonator" ? phaseOneAnswer : phaseTwoAnswer;
  const guesses = mode === "resonator" ? phaseOneGuesses : phaseTwoGuesses;
  const ability = phaseTwoAnswer.forte.forte_circuit;
  const availableResonators = mode === "resonator" ? WUWA_RESONATORS : WUWA_FORTE_RESONATORS;
  const isComplete = completedModes[mode];

  const suggestions = useMemo(() => {
    const normalizedQuery = normalizeResonatorName(query);
    if (!normalizedQuery) return [];
    return availableResonators
      .filter((resonator) => normalizeResonatorName(resonator.name).includes(normalizedQuery))
      .filter((resonator) => !guesses.some((guess) => guess.resonator.name === resonator.name))
      .slice(0, 8);
  }, [availableResonators, guesses, query]);

  function submitGuess(resonator: WuwaResonator) {
    if (isComplete) return;
    const matches = {
      quality: matchResult(resonator.quality, answer.quality),
      element: matchResult(resonator.element, answer.element),
      weapon: matchResult(resonator.weapon, answer.weapon),
      affiliation: matchResult(resonator.affiliation, answer.affiliation),
      version: versionMatchResult(resonator.version, answer.version),
    };
    const nextGuess = {
      resonator,
      matches,
      versionDirection: compareVersions(resonator.version, answer.version),
    };
    const nextGuesses = [...guesses, nextGuess];
    const isCorrect = normalizeResonatorName(resonator.name) === normalizeResonatorName(answer.name);

    if (mode === "resonator") setPhaseOneGuesses(nextGuesses);
    else setPhaseTwoGuesses(nextGuesses);
    setQuery("");
    setHighlightedIndex(0);

    if (isCorrect || nextGuesses.length >= MAX_GUESSES) {
      setCompletedModes((current) => ({ ...current, [mode]: true }));
      setResult(isCorrect ? "won" : "lost");
      setNotice(
        isCorrect
          ? `${mode === "resonator" ? "Resonator" : "Forte Circuit owner"} guessed in ${nextGuesses.length} ${nextGuesses.length === 1 ? "guess" : "guesses"}.`
          : `The answer was ${answer.name}.`,
      );
    }
  }

  function continueToForteMode() {
    setMode("forte");
    setQuery("");
    setHighlightedIndex(0);
    setInputFocused(false);
    setNotice("Forte mode unlocked: identify the Resonator behind the Forte Circuit ability.");
    setResult(null);
  }

  function switchMode(nextMode: GameMode) {
    setMode(nextMode);
    setQuery("");
    setHighlightedIndex(0);
    setInputFocused(false);
    setNotice(null);
    setResult(null);
  }

  function resetGame(playDifferentRound = false) {
    if (playDifferentRound) {
      const resonatorCandidates = WUWA_RESONATORS.filter((resonator) => resonator.name !== phaseOneAnswer.name);
      const forteCandidates = WUWA_FORTE_RESONATORS.filter((resonator) => resonator.name !== phaseTwoAnswer.name);
      setRandomResonatorName(resonatorCandidates[Math.floor(Math.random() * resonatorCandidates.length)]?.name ?? null);
      setRandomForteResonatorName(forteCandidates[Math.floor(Math.random() * forteCandidates.length)]?.name ?? null);
    } else {
      setRandomResonatorName(null);
      setRandomForteResonatorName(null);
    }
    setPhaseOneGuesses([]);
    setPhaseTwoGuesses([]);
    setQuery("");
    setHighlightedIndex(0);
    setNotice(null);
    setResult(null);
    setCompletedModes({ resonator: false, forte: false });
  }

  function applyTarget() {
    setActiveDate(devDate);
    setActiveResonatorName(devResonatorName || null);
    setRandomResonatorName(null);
    setRandomForteResonatorName(null);
    setMode("resonator");
    setPhaseOneGuesses([]);
    setPhaseTwoGuesses([]);
    setQuery("");
    setHighlightedIndex(0);
    setCompletedModes({ resonator: false, forte: false });
    setResult(null);
    setNotice(devResonatorName ? `Resonator target set to ${devResonatorName}.` : `Daily targets set to ${devDate}.`);
  }

  return (
    <section className="mx-auto mt-8 max-w-[90rem]" aria-labelledby="wuwa-dle-heading">
      <div className="rounded-lg border border-cream/15 bg-wall2/80 p-5 shadow-[0_18px_34px_-16px_rgba(0,0,0,0.75)] sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-cream/10 pb-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-pinGold">WUWADLE / GAME MODES</p>
            <h1 id="wuwa-dle-heading" className="mt-2 font-dle text-3xl text-cream sm:text-4xl">
              {mode === "resonator" ? "Who is today's Resonator?" : "Which Resonator owns this ability?"}
            </h1>
            <p className="mt-2 text-sm text-cream/65">
              {mode === "resonator" ? "Guess the Wuthering Waves Resonator." : "Use the clues to identify the Forte Circuit ability's owner."}
            </p>
          </div>
          <div className="text-right font-mono text-[10px] uppercase tracking-widest text-cream/50">
            <p>{mode === "resonator" ? "Resonator mode" : "Forte mode"}</p>
            <p className="mt-1 text-pinGold">{guesses.length} / {MAX_GUESSES} guesses</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2" aria-label="Wuwadle game modes">
          <button
            type="button"
            onClick={() => switchMode("resonator")}
            className={`min-h-11 rounded-full border px-4 font-mono text-[10px] uppercase tracking-widest transition-colors ${mode === "resonator" ? "border-pinGold bg-pinGold text-wall" : "border-cream/20 text-cream/65 hover:border-pinGold hover:text-pinGold"}`}
            aria-pressed={mode === "resonator"}
          >
            Resonator
            {completedModes.resonator && <span className="ml-2" aria-label="completed">✓</span>}
          </button>
          <button
            type="button"
            onClick={() => switchMode("forte")}
            className={`min-h-11 rounded-full border px-4 font-mono text-[10px] uppercase tracking-widest transition-colors ${mode === "forte" ? "border-pinGold bg-pinGold text-wall" : "border-cream/20 text-cream/65 hover:border-pinGold hover:text-pinGold"}`}
            aria-pressed={mode === "forte"}
          >
            Forte Circuit
            {completedModes.forte && <span className="ml-2" aria-label="completed">✓</span>}
          </button>
        </div>

        <details className="mt-6 rounded-md border border-pinGold/30 bg-pinGold/5">
          <summary className="cursor-pointer px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-pinGold">Developer tools</summary>
          <div className="grid gap-4 border-t border-pinGold/20 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <div>
              <label htmlFor="wuwa-dev-date" className="font-mono text-[10px] uppercase tracking-widest text-cream/60">Daily date (Pacific)</label>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setDevDate((current) => shiftDate(current, -1))} className="min-h-11 rounded border border-cream/20 px-3 font-mono text-sm text-cream/75 hover:border-pinGold hover:text-pinGold" aria-label="Previous day">&larr;</button>
                <input id="wuwa-dev-date" type="date" value={devDate} onChange={(event) => setDevDate(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded border border-cream/20 bg-wall/70 px-3 text-sm text-cream" />
                <button type="button" onClick={() => setDevDate((current) => shiftDate(current, 1))} className="min-h-11 rounded border border-cream/20 px-3 font-mono text-sm text-cream/75 hover:border-pinGold hover:text-pinGold" aria-label="Next day">&rarr;</button>
              </div>
            </div>
            <div>
              <label htmlFor="wuwa-dev-resonator" className="font-mono text-[10px] uppercase tracking-widest text-cream/60">Custom Resonator target</label>
              <select id="wuwa-dev-resonator" value={devResonatorName} onChange={(event) => setDevResonatorName(event.target.value)} className="mt-2 min-h-11 w-full rounded border border-cream/20 bg-wall/70 px-3 text-sm text-cream">
                <option value="">Use daily Resonator</option>
                {WUWA_RESONATORS.map((resonator) => <option key={resonator.name} value={resonator.name}>{resonator.name}</option>)}
              </select>
            </div>
            <button type="button" onClick={applyTarget} className="min-h-11 rounded-full bg-pinGold px-4 font-mono text-[10px] uppercase tracking-widest text-wall hover:bg-cream">Apply target</button>
          </div>
          <p className="px-4 pb-3 font-mono text-[9px] uppercase tracking-wider text-cream/45">Applying a target clears both game modes. Controls are local to this browser session.</p>
        </details>

        {mode === "forte" && (
          <div className="mt-6 flex flex-col items-center gap-4 rounded-md border border-pinGold/35 bg-pinGold/5 p-5 text-center sm:flex-row sm:text-left">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md border border-pinGold/30 bg-wall/50">
              <Icon src={ability?.icon ?? null} alt="" size={84} />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-pinGold">Forte Circuit ability</p>
              <p className="mt-2 font-display text-2xl text-cream">{ability?.name ?? "Unknown ability"}</p>
              <p className="mt-1 text-sm text-cream/55">Which Resonator uses this ability?</p>
            </div>
          </div>
        )}

        <div
          className="relative mt-6"
          onFocus={() => setInputFocused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setInputFocused(false);
          }}
        >
          <label htmlFor="wuwa-resonator-guess" className="font-mono text-[10px] uppercase tracking-widest text-cream/60">Resonator name</label>
          <input
            id="wuwa-resonator-guess"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setHighlightedIndex(0);
            }}
            disabled={isComplete}
            autoComplete="off"
            placeholder="Start typing a Resonator…"
            onKeyDown={(event) => {
              if (suggestions.length === 0) return;
              if (event.key === "Enter") {
                event.preventDefault();
                submitGuess(suggestions[highlightedIndex] ?? suggestions[0]);
              } else if (event.key === "ArrowDown") {
                event.preventDefault();
                setHighlightedIndex((index) => Math.min(index + 1, suggestions.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setHighlightedIndex((index) => Math.max(index - 1, 0));
              }
            }}
            className="mt-2 min-h-12 w-full rounded-md border border-cream/20 bg-wall/70 px-4 text-sm text-cream placeholder:text-cream/35 disabled:opacity-50"
          />
          {inputFocused && suggestions.length > 0 && (
            <div className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-md border border-cream/15 bg-wall shadow-xl">
              {suggestions.map((resonator, index) => (
                <button key={resonator.name} type="button" onClick={() => submitGuess(resonator)} onMouseEnter={() => setHighlightedIndex(index)} className={`flex min-h-12 w-full items-center gap-3 border-b border-cream/10 px-4 text-left text-sm text-cream last:border-0 ${index === highlightedIndex ? "bg-wall2" : ""}`}>
                  <Icon src={resonator.icon} alt="" size={64} />
                  <span className="flex-1">{resonator.name}</span>
                  {index === highlightedIndex && <span className="font-mono text-[9px] uppercase tracking-widest text-pinGold">Enter ↵</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {notice && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-pinGold/50 bg-pinGold/10 px-4 py-3 text-sm text-cream" role="status">
            <span>{notice}</span>
            {mode === "resonator" && isComplete && (
              <button type="button" onClick={continueToForteMode} className="font-mono text-[10px] uppercase tracking-widest text-pinGold hover:text-cream">Continue to Forte</button>
            )}
          </div>
        )}

        {result && (
          <div className="animate-backdrop-in fixed inset-0 z-50 flex items-center justify-center bg-wall/80 p-4 backdrop-blur-sm" role="presentation">
            <div className="animate-modal-pop relative w-full max-w-md overflow-hidden rounded-xl border border-cream/20 bg-wall2 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85)]" role="dialog" aria-modal="true" aria-labelledby="wuwa-result-title">
              <div className={`h-2 ${result === "won" ? "bg-pinTeal" : "bg-pinGold"}`} aria-hidden />
              <div className="p-6 text-center sm:p-8">
                <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${result === "won" ? "text-pinTeal" : "text-pinGold"}`}>
                  {mode === "resonator" ? (result === "won" ? "Resonator mode complete" : "Resonator mode ended") : (result === "won" ? "Wuwadle complete" : "Forte Circuit not identified")}
                </p>
                <h2 id="wuwa-result-title" className="mt-2 font-display text-4xl italic text-cream">
                  {mode === "resonator" ? "Ready for the Forte Circuit?" : result === "won" ? "Lets do the wuwadle again." : "You lost the wuwadle."}
                </h2>
                <p className="mt-2 text-sm text-cream/65">
                  {mode === "resonator"
                    ? `The Resonator answer was ${answer.name}. Continue to Forte when you're ready.`
                    : result === "won"
                      ? `You found the answer in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}.`
                      : "The correct Resonator was hiding in plain sight."}
                </p>

                <div className="mx-auto mt-6 flex max-w-xs items-center gap-4 rounded-lg border border-cream/10 bg-wall/50 p-4 text-left">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md border border-cream/10 bg-wall2"><Icon src={answer.icon} alt={`${answer.name} icon`} size={88} /></div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-cream/45">{mode === "resonator" ? "Resonator answer" : "Forte owner"}</p>
                    <p className="mt-1 font-display text-2xl text-cream">{answer.name}</p>
                    <p className="mt-1 text-xs text-cream/60">{answer.quality ?? "—"}★ · {answer.element ?? "—"} · {answer.weapon ?? "—"}</p>
                    <p className="text-xs text-cream/60">{answer.affiliation ?? "—"} · Version {answer.version ?? "—"}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-center gap-3">
                  <button type="button" onClick={() => setResult(null)} className="min-h-11 rounded-full border border-cream/25 px-5 font-mono text-[10px] uppercase tracking-widest text-cream/75 hover:border-pinGold hover:text-pinGold">Review guesses</button>
                  {mode === "resonator" ? (
                    <button type="button" onClick={continueToForteMode} className="min-h-11 rounded-full bg-pinGold px-5 font-mono text-[10px] uppercase tracking-widest text-wall hover:bg-cream">Continue to Forte</button>
                  ) : (
                    <button type="button" onClick={() => resetGame(true)} className="min-h-11 rounded-full bg-pinGold px-5 font-mono text-[10px] uppercase tracking-widest text-wall hover:bg-cream">Play again</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-7 overflow-x-auto">
          <div className="min-w-[1060px]">
            <div className="grid grid-cols-[minmax(210px,1.4fr)_144px_repeat(5,minmax(116px,1fr))] gap-2 border-b border-cream/10 px-2 pb-3 font-mono text-[9px] uppercase tracking-widest text-cream/45">
              <span>Name</span><span>Icon</span>{fields.map((field) => <span key={field.key}>{field.label}</span>)}
            </div>
            <div className="space-y-2 pt-2">
              {[...guesses].reverse().map((guess) => (
                <div key={guess.resonator.name} className="grid grid-cols-[minmax(210px,1.4fr)_144px_repeat(5,minmax(116px,1fr))] items-center gap-2 px-2 text-sm">
                  <span className={`${CELL_CLASS} justify-start border-cream/10 bg-wall/20 font-medium text-cream`}>{guess.resonator.name}</span>
                  <span className={`${CELL_CLASS} border-cream/10 bg-wall/20`}><Icon src={guess.resonator.icon} alt={`${guess.resonator.name} icon`} size={76} /></span>
                  <span className={`${CELL_CLASS} text-sm ${resultClass(guess.matches.quality)}`}>{guess.resonator.quality ?? "—"}★</span>
                  <span className={`${CELL_CLASS} ${resultClass(guess.matches.element)}`} title={guess.resonator.element ?? "Unknown element"}><AttributeIcon value={guess.resonator.element} icon={guess.resonator.element_icon} label="element" /></span>
                  <span className={`${CELL_CLASS} ${resultClass(guess.matches.weapon)}`} title={guess.resonator.weapon ?? "Unknown weapon"}><AttributeIcon value={guess.resonator.weapon} icon={guess.resonator.weapon_icon} label="weapon" /></span>
                  <span className={`${CELL_CLASS} text-xs ${resultClass(guess.matches.affiliation)}`} title={guess.resonator.affiliation ?? "Unknown affiliation"}>{guess.resonator.affiliation ?? "—"}</span>
                  <span className={`${CELL_CLASS} flex-col text-xs ${resultClass(guess.matches.version)}`} title={guess.versionDirection === "same" ? "Exact version match" : `The answer is ${guess.versionDirection === "higher" ? "lower" : "higher"} than this guess`}>
                    <span>{guess.resonator.version ?? "—"}</span>
                    {guess.versionDirection !== "same" && <span className="mt-1 font-mono text-[9px] uppercase tracking-wider text-pinGold">{guess.versionDirection === "higher" ? "↓ Lower" : "↑ Higher"}</span>}
                  </span>
                </div>
              ))}
              {guesses.length === 0 && <p className="border border-dashed border-cream/15 px-4 py-10 text-center text-sm text-cream/45">Your clues will appear here after the first guess.</p>}
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-4 border-t border-cream/10 pt-5 text-xs text-cream/55 sm:grid-cols-3">
          <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-pinTeal align-middle" />Exact match</p>
          <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-pinGold align-middle" />Partial match or version direction</p>
          <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-pinRed align-middle" />Wrong value</p>
        </div>
      </div>
    </section>
  );
}
