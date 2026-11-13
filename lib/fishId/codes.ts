// Four-letter quiz codes. A code names a species set, a mode and a run seed,
// so one code is all a friend needs to play the same plates with the same
// choices: /fish-stuff/identify?code=KQZT.
//
// A code is a number written in base 24 (A–Z without I and O, which are easy
// to misread). The number's remainder by COMBOS.length picks the set and
// mode; the rest picks the seed. Adding a set or a mode, or re-importing the
// species, changes what old codes deal. Codes are for sharing a run today,
// not for keeping.

import { QUIZ_MODES, getMode, type QuizMode } from "./modes.ts";
import { SPECIES_SETS, getSet, type SpeciesSet } from "./sets.ts";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
export const CODE_LENGTH = 4;
const TOTAL = ALPHABET.length ** CODE_LENGTH;

// Every set and mode pairing, in a fixed order.
const COMBOS = SPECIES_SETS.flatMap((set) => QUIZ_MODES.map((mode) => [set.id, mode.id] as const));
const PER_COMBO = Math.floor(TOTAL / COMBOS.length);

export type QuizCode = { code: string; set: SpeciesSet; mode: QuizMode; seed: number };

// Spreads neighbouring code numbers across the seed space.
function seedOf(n: number): number {
  let h = Math.imul(n ^ 0x5eed5eed, 0x9e3779b1);
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return h >>> 0;
}

function write(n: number): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out = ALPHABET[n % ALPHABET.length] + out;
    n = Math.floor(n / ALPHABET.length);
  }
  return out;
}

function fromNumber(n: number): QuizCode {
  const [setId, modeId] = COMBOS[n % COMBOS.length];
  return { code: write(n), set: getSet(setId)!, mode: getMode(modeId)!, seed: seedOf(n) };
}

// null when `input` isn't a code. Case and surrounding spaces don't matter.
export function parseCode(input: string | null | undefined): QuizCode | null {
  const code = (input ?? "").trim().toUpperCase();
  if (code.length !== CODE_LENGTH) return null;
  let n = 0;
  for (const char of code) {
    const digit = ALPHABET.indexOf(char);
    if (digit < 0) return null;
    n = n * ALPHABET.length + digit;
  }
  if (n >= PER_COMBO * COMBOS.length) return null;
  return fromNumber(n);
}

// A fresh code for this set and mode. `random` is like Math.random.
export function randomCode(set: SpeciesSet, mode: QuizMode, random: () => number = Math.random): QuizCode {
  const combo = COMBOS.findIndex(([s, m]) => s === set.id && m === mode.id);
  if (combo < 0) throw new Error(`Unknown set and mode: ${set.id}, ${mode.id}`);
  return fromNumber(Math.floor(random() * PER_COMBO) * COMBOS.length + combo);
}
