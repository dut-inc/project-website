import CaseHeader from "@/components/CaseHeader";
import { getProject } from "@/lib/projects";

export default function BoardPage() {
  const project = getProject("board");

  return (
    <div>
      <CaseHeader
        caseNumber={project.case}
        title={project.title}
        status={project.status}
        pin={project.pin}
        description="The catch-all — shared links, notes, and whatever doesn't need its own case file yet."
      />
      <div className="mx-auto mt-10 max-w-xl space-y-3 font-mono text-sm text-cream/60">
        <p>&gt; shared links list: not started</p>
        <p>&gt; notes/scratchpad: not started</p>
      </div>
    </div>
  );
}
