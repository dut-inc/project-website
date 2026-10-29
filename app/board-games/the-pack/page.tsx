"use client";

import CaseHeader from "@/components/CaseHeader";
import CreateOrJoinRoom from "@/components/the-pack/CreateOrJoinRoom";
import { getProject } from "@/lib/projects";

export default function ThePackPage() {
  const project = getProject("the-pack");

  return (
    <div>
      <CaseHeader
        caseNumber={project.case}
        title={project.title}
        status={project.status}
        pin={project.pin}
        paper={project.paper}
        rotation={project.rotation}
        description={project.summary}
        backHref="/board-games"
        backLabel="Back to Board Games"
      />
      <CreateOrJoinRoom />
    </div>
  );
}
