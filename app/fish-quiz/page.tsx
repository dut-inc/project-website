import CaseHeader from "@/components/CaseHeader";

export default function FishQuizPage() {
  return (
    <div>
      <CaseHeader
        caseNumber="001"
        title="Fish Quiz"
        status="PLANNING"
        description="Which-fish-are-you personality quiz, with a photo-based species ID model to follow."
      />
      <div className="space-y-4 font-mono text-sm text-paper2">
        <p>&gt; question bank: not started</p>
        <p>&gt; results/species mapping: not started</p>
        <p>&gt; species ID model (v2): not started</p>
      </div>
    </div>
  );
}
