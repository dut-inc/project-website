"use client";

import { useMemo, useState } from "react";
import {
  GENSHIN_CHARACTERS,
  getDailyGenshinCharacter,
  normalizeCharacterName,
  type GenshinCharacter,
} from "@/lib/dleGenshin";

const MAX_GUESSES = 6;
const CELL_CLASS = "flex h-16 w-full items-center justify-center rounded border px-2 text-center";

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

function Icon({ src, alt, size = 56 }: { src: string | null; alt: string; size?: number }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) return <span className="text-cream/30">—</span>;
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      referrerPolicy="no-referrer"
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
  const answer = useMemo(() => getDailyGenshinCharacter(), []);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
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
      version: matchResult(character.version, answer.version),
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
      setNotice(isCorrect ? `Case solved in ${nextGuesses.length} ${nextGuesses.length === 1 ? "guess" : "guesses"}.` : `The answer was ${answer.name}.`);
    }
  }

  function resetGame() {
    setGuesses([]);
    setQuery("");
    setNotice(null);
    setIsComplete(false);
  }

  return (
    <section className="mx-auto mt-8 max-w-6xl" aria-labelledby="genshin-dle-heading">
      <div className="rounded-lg border border-cream/15 bg-wall2/80 p-5 shadow-[0_18px_34px_-16px_rgba(0,0,0,0.75)] sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-cream/10 pb-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-pinTeal">Teyvat / daily character file</p>
            <h1 id="genshin-dle-heading" className="mt-2 font-display text-3xl italic text-cream sm:text-4xl">Who is today&apos;s character?</h1>
            <p className="mt-2 text-sm text-cream/65">Guess the character. Green means you found a match.</p>
          </div>
          <div className="text-right font-mono text-[10px] uppercase tracking-widest text-cream/50">
            <p>Daily case</p>
            <p className="mt-1 text-pinGold">{guesses.length} / {MAX_GUESSES} guesses</p>
          </div>
        </div>

        <div className="relative mt-6">
          <label htmlFor="genshin-character-guess" className="font-mono text-[10px] uppercase tracking-widest text-cream/60">Character name</label>
          <input
            id="genshin-character-guess"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={isComplete}
            autoComplete="off"
            placeholder="Start typing a character…"
            className="mt-2 min-h-12 w-full rounded-md border border-cream/20 bg-wall/70 px-4 text-sm text-cream placeholder:text-cream/35 disabled:opacity-50"
          />
          {suggestions.length > 0 && (
            <div className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-md border border-cream/15 bg-wall shadow-xl">
              {suggestions.map((character) => (
                <button
                  key={character.name}
                  type="button"
                  onClick={() => submitGuess(character)}
                  className="flex min-h-12 w-full items-center gap-3 border-b border-cream/10 px-4 text-left text-sm text-cream last:border-0 hover:bg-wall2"
                >
                  <Icon src={character.icon} alt="" size={52} />
                  <span>{character.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {notice && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-pinGold/50 bg-pinGold/10 px-4 py-3 text-sm text-cream" role="status">
            <span>{notice}</span>
            <button type="button" onClick={resetGame} className="font-mono text-[10px] uppercase tracking-widest text-pinGold hover:text-cream">New preview</button>
          </div>
        )}

        <div className="mt-7 overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[minmax(175px,1.4fr)_96px_repeat(5,minmax(118px,1fr))] gap-2 border-b border-cream/10 px-2 pb-3 font-mono text-[9px] uppercase tracking-widest text-cream/45">
              <span>Name</span>
              <span>Icon</span>
              {fields.map((field) => <span key={field.key}>{field.label}</span>)}
            </div>
            <div className="space-y-2 pt-2">
              {[...guesses].reverse().map((guess) => (
                <div key={guess.character.name} className="grid grid-cols-[minmax(175px,1.4fr)_96px_repeat(5,minmax(118px,1fr))] items-center gap-2 px-2 text-sm">
                  <span className={`${CELL_CLASS} justify-start border-cream/10 bg-wall/20 font-medium text-cream`}>{guess.character.name}</span>
                  <span className={`${CELL_CLASS} border-cream/10 bg-wall/20`}><Icon src={guess.character.icon} alt={`${guess.character.name} icon`} size={56} /></span>
                  <span className={`${CELL_CLASS} text-xs ${resultClass(guess.matches.quality)}`}>{guess.character.quality ?? "—"}★</span>
                  <span className={`${CELL_CLASS} ${resultClass(guess.matches.element)}`} title={guess.character.element}>
                    <AttributeIcon value={guess.character.element} icon={guess.character.element_icon} label="element" />
                  </span>
                  <span className={`${CELL_CLASS} ${resultClass(guess.matches.weapon)}`} title={guess.character.weapon}>
                    <AttributeIcon value={guess.character.weapon} icon={guess.character.weapon_icon} label="weapon" />
                  </span>
                  <span className={`${CELL_CLASS} ${resultClass(guess.matches.region)}`} title={guess.character.region}>
                    <AttributeIcon value={guess.character.region} icon={guess.character.region_icon} label="region" />
                  </span>
                  <span className={`${CELL_CLASS} min-h-16 flex-col text-xs ${resultClass(guess.matches.version)}`} title={guess.versionDirection === "same" ? "Exact version match" : `The answer is ${guess.versionDirection === "higher" ? "lower" : "higher"} than this guess`}>
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
          <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-pinRed align-middle" />Different value</p>
        </div>
      </div>
    </section>
  );
}
