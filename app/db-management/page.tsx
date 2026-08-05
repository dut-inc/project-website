import CaseHeader from "@/components/CaseHeader";
import DatabaseManager from "@/components/DatabaseManager";
import { getProject } from "@/lib/projects";

export default function DatabaseManagementPage() {
  const project = getProject("board-games");

  return (
    <div>
      <CaseHeader
        caseNumber={project.case}
        title="Database Management"
        status="OPEN"
        pin="gold"
        description="A prototype control room for the board-game shelf — inspect rows, update rules, and keep the shared database tidy."
      />
      <DatabaseManager />
    </div>
  );
}
