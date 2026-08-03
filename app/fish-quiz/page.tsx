import CaseHeader from "@/components/CaseHeader";
import FishQuiz from "@/components/fish-quiz/FishQuiz";
import { getProject } from "@/lib/projects";

export default function FishQuizPage() {
  const project = getProject("fish-quiz");

  return (
    <div>
      <CaseHeader
        caseNumber={project.case}
        title={project.title}
        status={project.status}
        pin={project.pin}
        description="Which Pacific Northwest fish are you? Six quick questions, one very important answer."
      />
      <div className="mx-auto mt-10 max-w-2xl">
        <FishQuiz />
        <div className="mt-8 space-y-2 font-mono text-xs uppercase tracking-wider text-cream/45">
          <p>&gt; results/species mapping: not started</p>
          <p>&gt; species ID model (v2): not started</p>
        </div>
      </div>
    </div>
  );
}
