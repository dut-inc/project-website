import CaseHeader from "@/components/CaseHeader";
import ConservationMap from "@/components/conservation/ConservationMap";
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
        description="upload a photo from a hike or fishing trip, and watch the shared map fill in."
      />
      <ConservationMap />
      <div className="mx-auto mt-10 max-w-xl space-y-3 font-mono text-sm text-cream/60">
        <p>&gt; shared sighting map: live (OpenStreetMap)</p>
        <p>&gt; uploads: live</p>
        <p>&gt; species ID model: shared with Fish Quiz (case 001)</p>
        <p>&gt; weekly digest agent: not started</p>
      </div>
    </div>
  );
}
