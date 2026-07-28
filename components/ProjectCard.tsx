import Link from "next/link";
import StampBadge from "./StampBadge";
import type { Project } from "@/lib/projects";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={project.href}
      className="group relative block rounded-sm border border-paper/10 bg-surface p-6 transition-colors hover:border-moss/40"
    >
      <div className="mb-4 flex items-start justify-between">
        <span className="font-mono text-xs text-paper2">
          CASE&nbsp;№&nbsp;{project.case}
        </span>
        <StampBadge status={project.status} />
      </div>
      <h3 className="font-display text-2xl text-paper group-hover:text-moss">
        {project.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-paper2">{project.summary}</p>
      <div className="mt-5 font-mono text-[11px] uppercase tracking-widest text-paper2/70">
        Logged {project.logged}
      </div>
    </Link>
  );
}
