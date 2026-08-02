import CaseHeader from "@/components/CaseHeader";
import FishQuiz from "@/components/fish-quiz/FishQuiz";

export default function FishQuizPage() {
  return (
    <div>
      <CaseHeader
        caseNumber="001"
        title="Fish Quiz"
        status="ACTIVE"
        pin="teal"
        description="Which Pacific Northwest fish are you? Six quick questions, one very important answer."
      />
      <div className="mx-auto mt-10 max-w-2xl">
        <FishQuiz />
        <p>&gt; results/species mapping: not started</p>
        <p>&gt; species ID model (v2): not started</p>
      </div>
    </div>
  );
}
