import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/lib/projects";

export default function HomePage() {
  return (
    <div>
      <div className="ledger-rule mb-12 border-b border-paper/10 pb-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-moss">
          Entry log &middot; {projects.length} open cases
        </p>
        <h1 className="mt-3 font-display text-4xl italic text-paper sm:text-5xl">
          The Log
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-paper2">
          A shared clubhouse for whatever we're building — quizzes, models,
          and field notes, all logged as they open.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {projects.map((p) => (
          <ProjectCard key={p.case} project={p} />
        ))}
      </div>
    </div>
  );
}
