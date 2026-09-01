import CaseHeader from "@/components/CaseHeader";
import DleHub from "@/components/dle/DleHub";
import { getProject } from "@/lib/projects";

export default function DlePage() {
  const project = getProject("dle");

  return (
    <div>
      <CaseHeader
        caseNumber={project.case}
        title={project.title}
        status={project.status}
        pin={project.pin}
        description="Daily dle games."
      />
      <DleHub />
    </div>
  );
}
