"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  GENSHIN_CHARACTERS,
  getDailyGenshinCharacter,
  normalizeCharacterName,
  pacificDateString,
  type GenshinCharacter,
} from "@/lib/dleGenshin";

const MAX_GUESSES = 6;
const CELL_CLASS = "flex h-20 w-full items-center justify-center rounded border px-2 text-center";
const CLUE_CELL_CLASS = "flex h-20 w-full items-center justify-center rounded border px-2 text-center";

type GuessResult = "correct" | "partial" | "wrong";
type VersionDirection = "higher" | "lower" | "same";

type Guess = {
  character: GenshinCharacter;
  matches: Record<"quality" | "element" | "weapon" | "region" | "version", GuessResult>;
  versionDirection: VersionDirection;
};

const fields = [
  { key: "quality", label: "Rarity" },
  { key: "element", label: "Element" },
  { key: "weapon", label: "Weapon" },
  { key: "region", label: "Region" },
  { key: "version", label: "Version" },
] as const;

function matchResult(value: string | number | null, answer: string | number | null): GuessResult {
  if (value === answer) return "correct";
  return "wrong";
}

function versionMajor(version: string) {
  const numericVersion = /^(\d+)/.exec(version.trim());
  if (numericVersion) return numericVersion[1];
  if (/^Luna\s+/i.test(version.trim())) return "Luna";
  return version.trim();
}

function versionMatchResult(guess: string, answer: string): GuessResult {
  if (guess === answer) return "correct";
  return versionMajor(guess) === versionMajor(answer) ? "partial" : "wrong";
}

function resultClass(result: GuessResult) {
  if (result === "correct") return "border-pinTeal/70 bg-pinTeal/20 text-cream";
  if (result === "partial") return "border-pinGold/70 bg-pinGold/15 text-cream";
  return "border-pinRed/50 bg-pinRed/10 text-cream/80";
}

function romanToNumber(value: string) {
  const numerals: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  let total = 0;
  let previous = 0;
  for (const numeral of value.toUpperCase().split("").reverse()) {
    const current = numerals[numeral] ?? 0;
    total += current < previous ? -current : current;
    previous = current;
  }
  return total;
}

function versionRank(version: string) {
  const numericVersion = /^(\d+)(?:\.(\d+))?$/.exec(version.trim());
  if (numericVersion) return Number(numericVersion[1]) * 100 + Number(numericVersion[2] ?? 0);

  const lunaVersion = /^Luna\s+([IVXLCDM]+)$/i.exec(version.trim());
  if (lunaVersion) return 600 + romanToNumber(lunaVersion[1]);

  return 0;
}

function compareVersions(guess: string, answer: string): VersionDirection {
  const guessRank = versionRank(guess);
  const answerRank = versionRank(answer);
  if (guessRank === answerRank) return "same";
  return guessRank > answerRank ? "higher" : "lower";
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
      //direct browser
      unoptimized
      className="object-contain"
      style={{ width: size, height: size }}
      onError={() => setHasError(true)}
    />
  );
}

function AttributeIcon({
  value,
  icon,
  label,
}: {
  value: string;
  icon: string | null;
  label: string;
}) {
  return (
    <>
      {icon ? (
        <Icon src={icon} alt={`${value} ${label.toLowerCase()} icon`} size={48} />
      ) : (
        <span className="text-center text-xs text-cream/65">{value}</span>
      )}
      <span className="sr-only">{value}</span>
    </>
  );
}

export default function GenshinDle() {
  const today = pacificDateString();
  const [activeDate, setActiveDate] = useState(today);
  const [activeCharacterName, setActiveCharacterName] = useState<string | null>(null);
  const [randomCharacterName, setRandomCharacterName] = useState<string | null>(null);
  const [devDate, setDevDate] = useState(today);
  const [devCharacterName, setDevCharacterName] = useState("");
  const answer = useMemo(() => {
    if (randomCharacterName) {
      return GENSHIN_CHARACTERS.find((character) => character.name === randomCharacterName) ?? getDailyGenshinCharacter(activeDate);
    }
    if (activeCharacterName) {
      return GENSHIN_CHARACTERS.find((character) => character.name === activeCharacterName) ?? getDailyGenshinCharacter(activeDate);
    }
    return getDailyGenshinCharacter(activeDate);
  }, [activeCharacterName, activeDate, randomCharacterName]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<"won" | "lost" | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const suggestions = useMemo(() => {
    const normalizedQuery = normalizeCharacterName(query);
    if (!normalizedQuery) return [];
    return GENSHIN_CHARACTERS
      .filter((character) => normalizeCharacterName(character.name).includes(normalizedQuery))
      .filter((character) => !guesses.some((guess) => guess.character.name === character.name))
      .slice(0, 8);
  }, [guesses, query]);

  function submitGuess(character: GenshinCharacter) {
    if (isComplete) return;
    const matches = {
      quality: matchResult(character.quality, answer.quality),
      element: matchResult(character.element, answer.element),
      weapon: matchResult(character.weapon, answer.weapon),
      region: matchResult(character.region, answer.region),
      version: versionMatchResult(character.version, answer.version),
    };
    const nextGuesses = [
      ...guesses,
      {
        character,
        matches,
        versionDirection: compareVersions(character.version, answer.version),
      },
    ];
    const isCorrect = normalizeCharacterName(character.name) === normalizeCharacterName(answer.name);
    setGuesses(nextGuesses);
    setQuery("");
    if (isCorrect || nextGuesses.length >= MAX_GUESSES) {
      setIsComplete(true);
      setResult(isCorrect ? "won" : "lost");
      setNotice(isCorrect ? `Character guessed in ${nextGuesses.length} ${nextGuesses.length === 1 ? "guess" : "guesses"}.` : `The answer was ${answer.name}.`);
    }
  }

  function resetGame(playDifferentCharacter = false) {
    if (playDifferentCharacter) {
      const candidates = GENSHIN_CHARACTERS.filter((character) => character.name !== answer.name);
      const nextCharacter = candidates[Math.floor(Math.random() * candidates.length)];
      setRandomCharacterName(nextCharacter?.name ?? null);
    } else {
      setRandomCharacterName(null);
    }
    setGuesses([]);
    setQuery("");
    setNotice(null);
    setResult(null);
    setIsComplete(false);
  }

  return (
    <section className="mx-auto mt-8 max-w-6xl" aria-labelledby="genshin-dle-heading">
      <div className="rounded-lg border border-cream/15 bg-wall2/80 p-5 shadow-[0_18px_34px_-16px_rgba(0,0,0,0.75)] sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-cream/10 pb-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-pinTeal">JENSHINDLE</p>
            <h1 id="genshin-dle-heading" className="mt-2 font-dle text-3xl text-cream sm:text-4xl">Who is today&apos;s character?</h1>
            <p className="mt-2 text-sm text-cream/65">Guess the Genshin character.</p>
          </div>
          <div className="text-right font-mono text-[10px] uppercase tracking-widest text-cream/50">
            <p>Daily character</p>
            <p className="mt-1 text-pinGold">{guesses.length} / {MAX_GUESSES} guesses</p>
          </div>
        </div>

        <details className="mt-6 rounded-md border border-pinGold/30 bg-pinGold/5">
          <summary className="cursor-pointer px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-pinGold">Developer tools</summary>
          <div className="grid gap-4 border-t border-pinGold/20 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <div>
              <label htmlFor="genshin-dev-date" className="font-mono text-[10px] uppercase tracking-widest text-cream/60">Daily date (Pacific)</label>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setDevDate((current) => shiftDate(current, -1))} className="min-h-11 rounded border border-cream/20 px-3 font-mono text-sm text-cream/75 hover:border-pinGold hover:text-pinGold" aria-label="Previous day">&larr;</button>
                <input id="genshin-dev-date" type="date" value={devDate} onChange={(event) => setDevDate(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded border border-cream/20 bg-wall/70 px-3 text-sm text-cream" />
                <button type="button" onClick={() => setDevDate((current) => shiftDate(current, 1))} className="min-h-11 rounded border border-cream/20 px-3 font-mono text-sm text-cream/75 hover:border-pinGold hover:text-pinGold" aria-label="Next day">&rarr;</button>
              </div>
            </div>
            <div>
              <label htmlFor="genshin-dev-character" className="font-mono text-[10px] uppercase tracking-widest text-cream/60">Custom character</label>
              <select id="genshin-dev-character" value={devCharacterName} onChange={(event) => setDevCharacterName(event.target.value)} className="mt-2 min-h-11 w-full rounded border border-cream/20 bg-wall/70 px-3 text-sm text-cream">
                <option value="">Use character for selected date</option>
                {GENSHIN_CHARACTERS.map((character) => <option key={character.name} value={character.name}>{character.name}</option>)}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveDate(devDate);
                setActiveCharacterName(devCharacterName || null);
                setRandomCharacterName(null);
                setGuesses([]);
                setQuery("");
                setIsComplete(false);
                setResult(null);
                setNotice(devCharacterName ? `Custom target set to ${devCharacterName}.` : `Daily target set to ${devDate}.`);
              }}
              className="min-h-11 rounded-full bg-pinGold px-4 font-mono text-[10px] uppercase tracking-widest text-wall hover:bg-cream"
            >
              Apply target
            </button>
          </div>
          <p className="px-4 pb-3 font-mono text-[9px] uppercase tracking-wider text-cream/45">Applying a target clears the current guesses. Controls are local to this browser session.</p>
        </details>

        <div
          className="relative mt-6"
          onFocus={() => setInputFocused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setInputFocused(false);
            }
          }}
        >
          <label htmlFor="genshin-character-guess" className="font-mono text-[10px] uppercase tracking-widest text-cream/60">Character name</label>
          <input
            id="genshin-character-guess"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setHighlightedIndex(0);
            }}
            disabled={isComplete}
            autoComplete="off"
            placeholder="Start typing a character…"
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
              {suggestions.map((character, index) => (
                <button
                  key={character.name}
                  type="button"
                  onClick={() => submitGuess(character)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`flex min-h-12 w-full items-center gap-3 border-b border-cream/10 px-4 text-left text-sm text-cream last:border-0 ${index === highlightedIndex ? "bg-wall2" : ""}`}
                >
                  <Icon src={character.icon} alt="" size={64} />
                  <span className="flex-1">{character.name}</span>
                  {index === highlightedIndex && (
                    <span className="font-mono text-[9px] uppercase tracking-widest text-pinGold">Enter ↵</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {notice && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-pinGold/50 bg-pinGold/10 px-4 py-3 text-sm text-cream" role="status">
            <span>{notice}</span>
            <button type="button" onClick={() => resetGame()} className="font-mono text-[10px] uppercase tracking-widest text-pinGold hover:text-cream">New preview</button>
          </div>
        )}

        {result && (
          <div className="animate-backdrop-in fixed inset-0 z-50 flex items-center justify-center bg-wall/80 p-4 backdrop-blur-sm" role="presentation">
            <div
              className="animate-modal-pop relative w-full max-w-md overflow-hidden rounded-xl border border-cream/20 bg-wall2 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85)]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="genshin-result-title"
            >
              <div className={`h-2 ${result === "won" ? "bg-pinTeal" : "bg-pinGold"}`} aria-hidden />
              <div className="p-6 text-center sm:p-8">
                <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${result === "won" ? "text-pinTeal" : "text-pinGold"}`}>
                  {result === "won" ? "Character guessed" : "Character not guessed"}
                </p>
                <h2 id="genshin-result-title" className="mt-2 font-display text-4xl italic text-cream">
                  {result === "won" ? "Lets do the jenshindle again." : "You lost the jenshindle."}
                </h2>
                <p className="mt-2 text-sm text-cream/65">
                  {result === "won" ? `You found the answer in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}.` : "The correct character was hiding in plain sight."}
                </p>

                <div className="mx-auto mt-6 flex max-w-xs items-center gap-4 rounded-lg border border-cream/10 bg-wall/50 p-4 text-left">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md border border-cream/10 bg-wall2">
                    <Icon src={answer.icon} alt={`${answer.name} icon`} size={88} />
                  </div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-cream/45">Answer</p>
                    <p className="mt-1 font-display text-2xl text-cream">{answer.name}</p>
                    <p className="mt-1 text-xs text-cream/60">{answer.quality ?? "—"}★ · {answer.element} · {answer.weapon}</p>
                    <p className="text-xs text-cream/60">{answer.region} · Version {answer.version}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-center gap-3">
                  <button type="button" onClick={() => setResult(null)} className="min-h-11 rounded-full border border-cream/25 px-5 font-mono text-[10px] uppercase tracking-widest text-cream/75 hover:border-pinGold hover:text-pinGold">
                    Review guesses
                  </button>
                  <button type="button" onClick={() => resetGame(true)} className="min-h-11 rounded-full bg-pinGold px-5 font-mono text-[10px] uppercase tracking-widest text-wall hover:bg-cream">
                    Play again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-7 overflow-x-auto">
          <div className="min-w-[1060px]">
            <div className="grid grid-cols-[minmax(210px,1.4fr)_144px_repeat(5,minmax(116px,1fr))] gap-2 border-b border-cream/10 px-2 pb-3 font-mono text-[9px] uppercase tracking-widest text-cream/45">
              <span>Name</span>
              <span>Icon</span>
              {fields.map((field) => <span key={field.key}>{field.label}</span>)}
            </div>
            <div className="space-y-2 pt-2">
              {[...guesses].reverse().map((guess) => (
                <div key={guess.character.name} className="grid grid-cols-[minmax(210px,1.4fr)_144px_repeat(5,minmax(116px,1fr))] items-center gap-2 px-2 text-sm">
                  <span className={`${CELL_CLASS} justify-start border-cream/10 bg-wall/20 font-medium text-cream`}>{guess.character.name}</span>
                  <span className={`${CELL_CLASS} border-cream/10 bg-wall/20`}><Icon src={guess.character.icon} alt={`${guess.character.name} icon`} size={76} /></span>
                  <span className={`${CLUE_CELL_CLASS} text-sm ${resultClass(guess.matches.quality)}`}>{guess.character.quality ?? "—"}★</span>
                  <span className={`${CLUE_CELL_CLASS} ${resultClass(guess.matches.element)}`} title={guess.character.element}>
                    <AttributeIcon value={guess.character.element} icon={guess.character.element_icon} label="element" />
                  </span>
                  <span className={`${CLUE_CELL_CLASS} ${resultClass(guess.matches.weapon)}`} title={guess.character.weapon}>
                    <AttributeIcon value={guess.character.weapon} icon={guess.character.weapon_icon} label="weapon" />
                  </span>
                  <span className={`${CLUE_CELL_CLASS} ${resultClass(guess.matches.region)}`} title={guess.character.region}>
                    <AttributeIcon value={guess.character.region} icon={guess.character.region_icon} label="region" />
                  </span>
                  <span className={`${CLUE_CELL_CLASS} flex-col text-xs ${resultClass(guess.matches.version)}`} title={guess.versionDirection === "same" ? "Exact version match" : `The answer is ${guess.versionDirection === "higher" ? "lower" : "higher"} than this guess`}>
                    <span>{guess.character.version}</span>
                    {guess.versionDirection !== "same" && (
                      <span className="mt-1 font-mono text-[9px] uppercase tracking-wider text-pinGold">
                        {guess.versionDirection === "higher" ? "↓ Lower" : "↑ Higher"}
                      </span>
                    )}
                  </span>
                </div>
              ))}
              {guesses.length === 0 && <p className="border border-dashed border-cream/15 px-4 py-10 text-center text-sm text-cream/45">Your clues will appear here after the first guess.</p>}
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-4 border-t border-cream/10 pt-5 text-xs text-cream/55 sm:grid-cols-3">
          <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-pinTeal align-middle" />Exact match</p>
          <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-pinGold align-middle" />Higher or lower version</p>
          <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-pinRed align-middle" />Wrong value</p>
        </div>
      </div>
    </section>
  );
}
