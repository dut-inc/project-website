import CaseHeader from "@/components/CaseHeader";
import { getProject } from "@/lib/projects";

export default function ConservationPage() {
  const project = getProject("conservation");

  return (
    <div>
      <CaseHeader
        caseNumber={project.case}
        title={project.title}
        status={project.status}
        pin={project.pin}
        description="A citizen-science log for the group — upload a photo from a hike or fishing trip, get a species ID, watch the shared map fill in."
      />
      <div className="mx-auto mt-10 max-w-xl space-y-3 font-mono text-sm text-cream/60">
        <p>&gt; species ID model: shared with Fish Quiz (case 001)</p>
        <p>&gt; shared sighting map: not started</p>
        <p>&gt; weekly digest agent: not started</p>
      </div>
    </div>
  );
}
