// The shared quiz engine for every Fish Identification mode: question
// generation, answer evaluation and run state. Pure functions with seeded
// random streams, so it is testable and has no React in it. The components
// in components/fish-id/ only render what this produces.
//
// A run is RUN_LENGTH plates long and the score is the number answered
// correctly. Its seed comes from a four-letter code (lib/fishId/codes.ts), so
// friends who play the same code get the same plates and choices.

import { canAsk, type NameField, type PromptKind, type QuizMode } from "./modes.ts";
import type { Fish } from "./types.ts";

export const CHOICES_PER_QUESTION = 4;

// Plates in one run.
export const RUN_LENGTH = 12;

// Returns a number in [0, 1), like Math.random.
export type Random = () => number;

export type Choice = { fishId: string; label: string };

export type Question = {
  fish: Fish;
  prompt: PromptKind;
  answer: NameField;
  choices: Choice[];
  correctIndex: number;
};

// Small, fast, seedable generator (mulberry32).
export function mulberry32(seed: number): Random {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 32);
}

// An independent random stream for one purpose (`salt`) and position (`n`) in a run.
function stream(seed: number, salt: number, n: number): Random {
  return mulberry32(seed ^ Math.imul(n + 1, 0x9e3779b1) ^ Math.imul(salt, 0x85ebca6b));
}

export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function genusOf(fish: Fish): string {
  return fish.scientificName.split(" ")[0];
}

// How alike two species are, so that distractors are often close relatives
// (two salmon, two sculpins) instead of always being obvious.
function kinship(a: Fish, b: Fish): number {
  if (genusOf(a) === genusOf(b)) return 2;
  if (a.family && a.family === b.family) return 1.5;
  return 0;
}

// Random noise added to kinship: big enough that relatives are favoured, not guaranteed.
const KINSHIP_NOISE = 2;

// At most this many distractors are close relatives (same genus or family),
// so at least one choice comes from outside the family. This keeps the quiz
// from being all lookalikes.
export const MAX_RELATIVES = 2;

export function pickDistractors(subject: Fish, pool: readonly Fish[], field: NameField, random: Random): Fish[] {
  const taken = new Set([subject[field]]);
  const candidates = shuffle(pool, random)
    .filter((fish) => fish.id !== subject.id)
    .map((fish) => ({ fish, weight: kinship(subject, fish) + random() * KINSHIP_NOISE }))
    .sort((a, b) => b.weight - a.weight);

  const picked: Fish[] = [];
  let relatives = 0;
  for (const { fish } of candidates) {
    // Never show the same label twice, and never a second copy of the right answer.
    if (taken.has(fish[field])) continue;
    const related = kinship(subject, fish) > 0;
    if (related && relatives === MAX_RELATIVES) continue;
    taken.add(fish[field]);
    picked.push(fish);
    if (related) relatives++;
    if (picked.length === CHOICES_PER_QUESTION - 1) return picked;
  }
  throw new Error(`Not enough distinct ${field} values to build a question for ${subject.id}`);
}

export function buildQuestion(mode: QuizMode, subject: Fish, pool: readonly Fish[], random: Random): Question {
  const options = shuffle([subject, ...pickDistractors(subject, pool, mode.answer, random)], random);
  return {
    fish: subject,
    prompt: mode.prompt,
    answer: mode.answer,
    choices: options.map((fish) => ({ fishId: fish.id, label: fish[mode.answer] })),
    correctIndex: options.indexOf(subject),
  };
}

// The species a mode can ask about, in the pool's order.
export function askable(mode: QuizMode, pool: readonly Fish[]): Fish[] {
  return pool.filter((fish) => canAsk(mode, fish));
}

export function isCorrect(question: Question, choiceIndex: number): boolean {
  return choiceIndex === question.correctIndex;
}

// ---- Runs ------------------------------------------------------------------

// Species are dealt from a shuffled deck of the pool, reshuffled each time it
// runs out, so nothing repeats until every species has been asked. Each
// question is a pure function of the run's seed and its position: the server
// can render the first one and the client hydrates the same question.
export type Run = { mode: QuizMode; pool: readonly Fish[]; seed: number };

const DECK = 1;
const CHOICES = 2;

// null when the pool has nothing this mode can ask about.
export function questionAt(run: Run, index: number): Question | null {
  const subjects = askable(run.mode, run.pool);
  if (subjects.length === 0) return null;
  const lap = Math.floor(index / subjects.length);
  const deck = shuffle(subjects, stream(run.seed, DECK, lap));
  return buildQuestion(run.mode, deck[index % subjects.length], run.pool, stream(run.seed, CHOICES, index));
}

// The chosen index, or "skipped" when the photograph failed to load.
export type Outcome = number | "skipped";

export type Entry = { question: Question; outcome: Outcome };

export type RunState = {
  run: Run;
  // Position of the current plate in the run, from 0.
  index: number;
  question: Question | null;
  // The current plate's answer; null while it is unanswered.
  outcome: Outcome | null;
  // Every finished plate, oldest first.
  log: Entry[];
  over: boolean;
};

export type RunAction =
  | { type: "answer"; choice: number }
  | { type: "skip" }
  | { type: "next" }
  | { type: "restart"; seed: number };

export type Phase = "answering" | "feedback" | "over";

export function startRun(run: Run): RunState {
  return { run, index: 0, question: questionAt(run, 0), outcome: null, log: [], over: false };
}

export function phaseOf(state: RunState): Phase {
  if (state.over || !state.question) return "over";
  return state.outcome === null ? "answering" : "feedback";
}

export type Verdict = "correct" | "wrong" | "skipped";

// null while the question is unanswered.
export function verdictOf(question: Question, outcome: Outcome | null): Verdict | null {
  if (outcome === null) return null;
  if (outcome === "skipped") return "skipped";
  return isCorrect(question, outcome) ? "correct" : "wrong";
}

export function runReducer(state: RunState, action: RunAction): RunState {
  const phase = phaseOf(state);

  switch (action.type) {
    case "answer": {
      // One answer per plate: later clicks are ignored.
      if (phase !== "answering") return state;
      const count = state.question!.choices.length;
      if (!Number.isInteger(action.choice) || action.choice < 0 || action.choice >= count) return state;
      return { ...state, outcome: action.choice };
    }
    case "skip":
      // Only for a plate whose photograph failed to load; it doesn't score.
      return phase === "answering" ? { ...state, outcome: "skipped" } : state;
    case "next": {
      if (phase !== "feedback") return state;
      const question = state.question!;
      const log = [...state.log, { question, outcome: state.outcome! }];
      if (log.length >= RUN_LENGTH) return { ...state, log, outcome: null, over: true };
      const index = state.index + 1;
      return { ...state, index, question: questionAt(state.run, index), outcome: null, log };
    }
    case "restart":
      return startRun({ ...state.run, seed: action.seed });
  }
}

export type Summary = {
  // Correct answers: the run's score.
  score: number;
  wrong: number;
  skipped: number;
  // Plates answered or skipped so far.
  settled: number;
};

// Counts the finished plates plus the current one once it is answered.
export function summarize(state: RunState): Summary {
  const entries = [...state.log];
  if (phaseOf(state) === "feedback") entries.push({ question: state.question!, outcome: state.outcome! });
  let score = 0;
  let wrong = 0;
  let skipped = 0;
  for (const { question, outcome } of entries) {
    const verdict = verdictOf(question, outcome);
    if (verdict === "correct") score++;
    else if (verdict === "wrong") wrong++;
    else skipped++;
  }
  return { score, wrong, skipped, settled: entries.length };
}
