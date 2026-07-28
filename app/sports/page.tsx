import CaseHeader from "@/components/CaseHeader";

export default function SportsPage() {
  return (
    <div>
      <CaseHeader
        caseNumber="002"
        title="Sports Lab"
        status="PLANNING"
        description="Basketball and baseball models — win probability, scouting recaps, and a fantasy assistant for the group."
      />
      <div className="space-y-4 font-mono text-sm text-paper2">
        <p>&gt; data pipeline (nba_api / pybaseball): not started</p>
        <p>&gt; win-probability model: not started</p>
        <p>&gt; scouting/recap agent: not started</p>
        <p>&gt; fantasy assistant: not started</p>
      </div>
    </div>
  );
}
