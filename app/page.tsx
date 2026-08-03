import Board from "@/components/Board";
import PinnedNote from "@/components/PinnedNote";
import { PennantSticker, AnchorSticker, RainDropSticker } from "@/components/Stickers";
import { projects } from "@/lib/projects";
import type { ReactElement } from "react";

export default function HomePage() {
  const projectCards: ReactElement[] = [];
  for (const project of projects.values()) {
    projectCards.push(<PinnedNote key={project.case} project={project} />);
  }

  return (
    <div className="relative">
      <PennantSticker className="pointer-events-none absolute -left-4 -top-8 hidden w-28 lg:block xl:-left-10 xl:w-32" />
      <AnchorSticker className="pointer-events-none absolute -right-2 top-16 hidden w-24 lg:block xl:-right-8 xl:w-28" />
      <RainDropSticker className="pointer-events-none absolute -left-6 bottom-10 hidden w-20 xl:block" />

      <div className="mb-8 text-center">
        <h1 className="mt-2 font-display text-4xl italic text-cream sm:text-5xl">
          what we're up to
        </h1>
      </div>

      <Board>
        <div className="grid gap-x-6 gap-y-10 pt-4 sm:grid-cols-2">
          {projectCards}
        </div>
      </Board>
    </div>
  );
}
