import PageHeader from "@/components/PageHeader";
import { getProject, type ProjectId } from "@/lib/projects";

// The header for a section's own (folder) page: the shared PageHeader with the
// section's title and summary, and no kicker line.
export default function CaseHeader({ projectId }: { projectId: ProjectId }) {
  const project = getProject(projectId);
  return <PageHeader href={project.href} title={project.title} kicker={[]} description={project.summary} />;
}
