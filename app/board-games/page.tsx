"use client";

import { useCallback, useRef, useState } from "react";
import BoardGameTierList from "@/components/board-games/BoardGameTierList";
import DeveloperAccess from "@/components/board-games/DeveloperAccess";
import { getProject } from "@/lib/projects";

export default function BoardGamesPage() {
  const project = getProject("board-games");
  const [isEditable, setIsEditable] = useState(false);
  const [isAccessOpen, setIsAccessOpen] = useState(false);
  const developerAccessTriggerRef = useRef<HTMLButtonElement>(null);
  const handleUnlocked = useCallback(() => setIsEditable(true), []);
  const handleLocked = useCallback(() => setIsEditable(false), []);
  const openDeveloperAccess = useCallback(() => setIsAccessOpen(true), []);
  const handleAccessChange = useCallback((open: boolean) => setIsAccessOpen(open), []);

  return (
    <div>
      <DeveloperAccess
        caseNumber={project.case}
        isUnlocked={isEditable}
        isOpen={isAccessOpen}
        triggerRef={developerAccessTriggerRef}
        onOpenChange={handleAccessChange}
        onUnlocked={handleUnlocked}
        onLocked={handleLocked}
      />
      <BoardGameTierList
        isEditable={isEditable}
        developerAccessTriggerRef={developerAccessTriggerRef}
        onOpenDeveloperAccess={openDeveloperAccess}
      />
    </div>
  );
}
