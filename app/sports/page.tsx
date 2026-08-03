import Link from "next/link";
import CaseHeader from "@/components/CaseHeader";
import { getProject } from "@/lib/projects";

export default function SportsPage() {
  const project = getProject("sports");

  return (
    <div>
      <CaseHeader
        caseNumber={project.case}
        title={project.title}
        status={project.status}
        pin={project.pin}
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
