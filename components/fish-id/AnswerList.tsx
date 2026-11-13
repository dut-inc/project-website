"use client";

import type { Question } from "@/lib/fishId/engine";
import FishName from "./FishName";

export const ANSWER_KEYS = ["A", "B", "C", "D"];

type RowState = "idle" | "correct" | "wrong" | "missed" | "dim";

function rowState(index: number, question: Question, chosen: number | null): RowState {
  if (chosen === null) return "idle";
  if (index === question.correctIndex) return index === chosen ? "correct" : "missed";
  return index === chosen ? "wrong" : "dim";
}

const MARK: Partial<Record<RowState, { text: string; className: string }>> = {
  correct: { text: "Correct", className: "text-fid-foam" },
  missed: { text: "Correct answer", className: "text-fid-foam" },
  wrong: { text: "Your answer", className: "text-fid-coral" },
};

// The four choices. Once answered (or skipped) every row is locked, so a
// question can only ever take one answer.
export default function AnswerList({
  question,
  chosen,
  locked,
  onChoose,
}: {
  question: Question;
  chosen: number | null;
  locked: boolean;
  onChoose: (index: number) => void;
}) {
  return (
    <ol className="border-b border-fid-foam/15">
      {question.choices.map((choice, index) => {
        const state = locked ? rowState(index, question, chosen) : "idle";
        const mark = MARK[state];
        return (
          <li key={choice.fishId} className="border-t border-fid-foam/15">
            <button
              type="button"
              onClick={() => onChoose(index)}
              disabled={locked}
              data-state={state}
              className="fid-answer grid min-h-[3.5rem] w-full grid-cols-[2rem_1fr_auto] items-center gap-x-3 px-3 py-3 text-left disabled:cursor-default sm:px-4"
            >
              <span aria-hidden className="fid-key font-fidserif font-medium lining-nums text-[14px] text-fid-foam/70">
                {ANSWER_KEYS[index]}
              </span>
              <FishName field={question.answer} className="font-fidserif text-[1.3rem] leading-snug text-fid-white">
                {choice.label}
              </FishName>
              {mark ? (
                <span className={`font-fidserif font-medium lining-nums text-[12px] uppercase tracking-[0.14em] ${mark.className}`}>{mark.text}</span>
              ) : (
                <span />
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
