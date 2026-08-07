"use client";

import { useCallback, useRef, useState } from "react";
import CaseHeader from "@/components/CaseHeader";
import BoardGameTierList from "@/components/board-games/BoardGameTierList";
import DeveloperAccess from "@/components/board-games/DeveloperAccess";
import { getProject } from "@/lib/projects";

export default function BoardGamesPage() {
  const project = getProject("board-games");
  const [isEditable, setIsEditable] = useState(false);
  const [isAccessOpen, setIsAccessOpen] = useState(false);
  const caseStudyRef = useRef<HTMLDivElement>(null);
  const handleUnlocked = useCallback(() => setIsEditable(true), []);
  const handleLocked = useCallback(() => setIsEditable(false), []);
  const openDeveloperAccess = useCallback(() => setIsAccessOpen(true), []);
  const handleAccessChange = useCallback((open: boolean) => setIsAccessOpen(open), []);

  return (
    <div>
      <CaseHeader
        caseNumber={project.case}
        title={project.title}
        status={project.status}
        pin={project.pin}
        description="A living ranking of the shelf — add games, make the case, and leave notes for the next game night."
        caseStudyRef={caseStudyRef}
        onCaseStudyClick={openDeveloperAccess}
        caseStudyLabel="Open developer access for the board-game case"
      />
      <DeveloperAccess
        caseNumber={project.case}
        isUnlocked={isEditable}
        isOpen={isAccessOpen}
        triggerRef={caseStudyRef}
        onOpenChange={handleAccessChange}
        onUnlocked={handleUnlocked}
        onLocked={handleLocked}
      />
      <BoardGameTierList isEditable={isEditable} />
    </div>
  );
}
