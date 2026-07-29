import Link from "next/link";
import Pin from "./Pin";
import type { Project } from "@/lib/projects";

const statusColor: Record<Project["status"], string> = {
  ACTIVE: "text-pinTeal",
  PLANNING: "text-pinGold",
  OPEN: "text-pinRed",
};

export default function PinnedNote({ project }: { project: Project }) {
  const paperClass = project.paper === "kraft" ? "bg-kraft" : "bg-cream";

  return (
    <Link
      href={project.href}
      className="group relative block transition-transform hover:-translate-y-0.5"
      style={{ transform: `rotate(${project.rotation}deg)` }}
    >
      {!project.taped && <Pin color={project.pin} />}
      {project.taped && (
        <span
          className="absolute -top-2 left-6 z-10 h-5 w-16 rotate-[-4deg] bg-pinGold/70"
          style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
          aria-hidden
        />
      )}
      <div
        className={`paper-torn ${paperClass} p-5 shadow-[0_10px_20px_-6px_rgba(0,0,0,0.5)]`}
      >
        <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-ink2">
          <span>Case №{project.case}</span>
          <span className={statusColor[project.status]}>{project.status}</span>
        </div>
        <h3 className="font-display text-2xl text-ink group-hover:text-pinTeal">
          {project.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/80">{project.summary}</p>
        <div className="mt-4 font-mono text-[10px] uppercase tracking-widest text-ink2">
          Logged {project.logged}
        </div>
      </div>
    </Link>
  );
}
