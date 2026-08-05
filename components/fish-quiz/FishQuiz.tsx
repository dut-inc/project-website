"use client";

import { useMemo, useState } from "react";
import FishIntro from "./FishIntro";
import FishQuestion from "./FishQuestion";
import FishResult from "./FishResult";
import {
  QUIZ_QUESTIONS,
  applyAnswer,
  emptyScores,
  scoreToResult,
  type Scores,
} from "@/lib/fishQuiz";

type Step = "intro" | "quiz" | "result";

export default function FishQuiz() {
  const [step, setStep] = useState<Step>("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | undefined)[]>([]);
  const [copied, setCopied] = useState(false);

  const total = QUIZ_QUESTIONS.length;
  const question = QUIZ_QUESTIONS[qIndex];

  // Scores derive from the answer history, so Back / Restart always stay consistent.
  const scores: Scores = useMemo(() => {
    let acc = emptyScores();
    answers.forEach((optIdx, qi) => {
      if (optIdx === undefined) return;
      acc = applyAnswer(acc, qi, optIdx);
    });
    return acc;
  }, [answers]);

  const result = step === "result" ? scoreToResult(scores) : null;

  function choose(optIdx: number) {
    // Overwrite in place so going Back can show the previously picked option.
    const next = [...answers];
    next[qIndex] = optIdx;
    if (qIndex + 1 < total) {
      setAnswers(next);
      setQIndex(qIndex + 1);
    } else {
      setAnswers(next);
      setStep("result");
    }
  }

  function goBack() {
    if (qIndex === 0) return;
    setQIndex(qIndex - 1);
  }

  function restart() {
    setStep("intro");
    setQIndex(0);
    setAnswers([]);
    setCopied(false);
  }

  async function copyResult() {
    if (!result) return;
    const text = `I'm a ${result.fish.name} — "${result.fish.tagline}" 🐟\nTake the quiz at The Board: https://ibisboard.vercel.app/fish-quiz`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      {step === "intro" && <FishIntro onStart={() => setStep("quiz")} />}

      {step === "quiz" && question && (
        <FishQuestion
          question={question}
          qIndex={qIndex}
          total={total}
          answers={answers}
          onChoose={choose}
          onBack={goBack}
          onRestart={restart}
        />
      )}

      {step === "result" && result && (
        <FishResult
          result={result}
          scores={scores}
          copied={copied}
          onRestart={restart}
          onCopy={copyResult}
        />
      )}
    </div>
  );
}
