import Link from "next/link";
import CaseHeader from "@/components/CaseHeader";

export default function SportsPage() {
  return (
    <div>
      <CaseHeader
        caseNumber="002"
        title="Sports Lab"
        status="PLANNING"
        pin="gold"
        description="Basketball and baseball models — win probability, scouting recaps, and a fantasy assistant for the group."
      />
      <div className="mx-auto mt-10 max-w-xl space-y-3 font-mono text-sm text-cream/60">
        <p>
          &gt; data pipeline (nba_api / pybaseball): partial —{" "}
          <Link href="/sports/offensive-profiles" className="text-pinGold underline">
            offensive archetype clustering
          </Link>{" "}
          running on sample data
        </p>
        <p>&gt; win-probability model: not started</p>
        <p>&gt; scouting/recap agent: not started</p>
        <p>&gt; fantasy assistant: not started</p>
      </div>
    </div>
  );
}
