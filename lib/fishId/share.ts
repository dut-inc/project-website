// The text a player copies to send a finished run to friends: the score, a
// row of squares (one per plate) and a link that deals the same run.

import { verdictOf, type Entry } from "./engine.ts";
import { codeHref, type QuizMode } from "./modes.ts";
import type { SpeciesSet } from "./sets.ts";

const SQUARE = { correct: "🟩", wrong: "🟥", skipped: "⬜" } as const;

export function shareText({
  code,
  set,
  mode,
  log,
  score,
  origin,
}: {
  code: string;
  set: SpeciesSet;
  mode: QuizMode;
  log: readonly Entry[];
  score: number;
  origin: string;
}): string {
  const squares = log.map(({ question, outcome }) => SQUARE[verdictOf(question, outcome) ?? "skipped"]).join("");
  return [
    `Identify the Fish · ${code}`,
    `${set.title} · ${mode.title}`,
    `${score}/${log.length} ${squares}`,
    `Play the same quiz: ${origin}${codeHref(code)}`,
  ].join("\n");
}
