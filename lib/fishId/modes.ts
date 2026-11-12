// The quiz modes. Each mode is configuration for the shared engine
// (lib/fishId/engine.ts): what the question shows, and which name the four
// choices are drawn from. A new format is a new entry here, plus a prompt
// renderer if it shows something other than a photograph or a name.

import type { SpeciesSet } from "./sets.ts";
import type { Fish } from "./types.ts";

export type NameField = "commonName" | "scientificName";
export type PromptKind = "photo" | NameField;

export type QuizMode = {
  // URL value: /fish-stuff/identify?mode=<id>
  id: string;
  numeral: string;
  prompt: PromptKind;
  answer: NameField;
  // Shown on the selection screen.
  title: string;
  summary: string;
  // The question asked on every plate.
  question: string;
};

export const QUIZ_MODES: readonly QuizMode[] = [
  {
    id: "photo-common",
    numeral: "I",
    prompt: "photo",
    answer: "commonName",
    title: "Photograph to common name",
    summary: "Study the photograph and name the species.",
    question: "Which species is this?",
  },
  {
    id: "photo-scientific",
    numeral: "II",
    prompt: "photo",
    answer: "scientificName",
    title: "Photograph to scientific name",
    summary: "Study the photograph and give its binomial name.",
    question: "What is its scientific name?",
  },
  {
    id: "scientific-common",
    numeral: "III",
    prompt: "scientificName",
    answer: "commonName",
    title: "Scientific name to common name",
    summary: "Read the binomial and find the name it goes by.",
    question: "What is this species commonly called?",
  },
  {
    id: "common-scientific",
    numeral: "IV",
    prompt: "commonName",
    answer: "scientificName",
    title: "Common name to scientific name",
    summary: "Read the common name and find its binomial.",
    question: "What is its scientific name?",
  },
];

export const QUIZ_HREF = "/fish-stuff/identify";

// The selection screen for a set, or a run of one mode over it.
export function quizHref(set: SpeciesSet, mode?: QuizMode): string {
  return `${QUIZ_HREF}?set=${set.id}${mode ? `&mode=${mode.id}` : ""}`;
}

export function getMode(id: string | null | undefined): QuizMode | undefined {
  return QUIZ_MODES.find((mode) => mode.id === id);
}

// Whether a species can be the subject of a question in this mode. Photo
// prompts need a photograph; any species can be a distractor.
export function canAsk(mode: QuizMode, fish: Fish): boolean {
  return mode.prompt !== "photo" || fish.image !== null;
}

export const FIELD_LABEL: Record<NameField, string> = {
  commonName: "Common name",
  scientificName: "Scientific name",
};
