import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { FolderIcon, ItemIcon } from "@/components/workspace/icons";
import { getProject, statusColor } from "@/lib/projects";
import { WORKSPACE_TREE, workspaceFiles, type WorkspaceFolder } from "@/lib/workspace";

// welcome.md — the workspace's start page. Everything listed here comes from
// lib/projects.ts and lib/workspace.ts, so it stays in step with the explorer.

const sections = WORKSPACE_TREE.filter((node): node is WorkspaceFolder => node.kind === "folder");

// Every page inside a section (top-level folders are listed under Sections).
const tools = workspaceFiles().filter((file) => file.trail.length > 0);

export default function WelcomePage() {
  return (
    <div className="pb-8">
      <PageHeader
        href="/"
        back={null}
        title="Perpetual Studio"
        description="What we're working on"
      />

      <div className="grid gap-12 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section aria-labelledby="welcome-sections">
          <h2 id="welcome-sections" className="font-mono text-[11px] uppercase tracking-[0.18em] text-studio-muted">
            Sections
          </h2>
          <ul className="mt-3 divide-y divide-studio-border border-y border-studio-border">
            {sections.map((folder) => {
              const project = getProject(folder.projectId);
              return (
                <li key={folder.id}>
                  <Link
                    href={project.href}
                    className="group flex items-start gap-3 px-2 py-3.5 transition-colors hover:bg-studio-hover"
                  >
                    <FolderIcon tone={folder.tone} open={false} className="mt-0.5 h-5 w-5 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="text-[15px] text-studio-bright group-hover:text-studio-link">{project.title}</span>
                        <span className={`font-mono text-[10px] uppercase tracking-widest ${statusColor[project.status]}`}>
                          {project.status}
                        </span>
                      </span>
                      <span className="mt-1 block text-[13px] leading-relaxed text-studio-muted">{project.summary}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="space-y-12">
          <section aria-labelledby="welcome-open">
            <h2 id="welcome-open" className="font-mono text-[11px] uppercase tracking-[0.18em] text-studio-muted">
              Open a file
            </h2>
            <ul className="mt-3 space-y-0.5">
              {tools.map((file) => (
                <li key={file.href}>
                  <Link
                    href={file.href}
                    className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-studio-hover"
                  >
                    <ItemIcon icon={file.icon} tone={file.tone} className="h-4 w-4 shrink-0" />
                    <span className="text-studio-text group-hover:text-studio-bright">{file.title}</span>
                    <span className="ml-auto truncate pl-3 font-mono text-[11px] text-studio-muted">
                      {file.trail.join("/")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="welcome-keys">
            <h2 id="welcome-keys" className="font-mono text-[11px] uppercase tracking-[0.18em] text-studio-muted">
              Shortcuts
            </h2>
            <dl className="mt-3 space-y-2 text-[13px] text-studio-text">
              {[
                ["Go to file", "Ctrl / ⌘ P"],
                ["Show or hide the explorer", "Ctrl / ⌘ B"],
                ["Close a tab", "Middle-click"],
                ["Move through the explorer", "↑ ↓ ← →"],
              ].map(([label, keys]) => (
                <div key={label} className="flex items-center justify-between gap-4 px-2">
                  <dt>{label}</dt>
                  <dd className="font-mono text-[11px] text-studio-muted">{keys}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
