import CaseHeader from "@/components/CaseHeader";
import BoardGameTierList from "@/components/board-games/BoardGameTierList";
import { getProject } from "@/lib/projects";

export default function BoardGamesPage() {
  const project = getProject("board-games");

  return (
    <div>
      <CaseHeader
        caseNumber={project.case}
        title={project.title}
        status={project.status}
        pin={project.pin}
        description="A living ranking of the shelf — add games, make the case, and leave notes for the next game night."
      />
      <BoardGameTierList />
    </div>
  );
}
