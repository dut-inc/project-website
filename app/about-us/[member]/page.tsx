import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader, { HeaderLink } from "@/components/PageHeader";
import { ItemIcon } from "@/components/workspace/icons";
import { MEMBERS, getMember } from "@/lib/members";
import { pageMetadata } from "@/lib/metadata";
import { resolvePath, workspaceFiles, type ResolvedFile } from "@/lib/workspace";

export function generateStaticParams() {
  return MEMBERS.map((member) => ({ member: member.slug }));
}

// A folder page's files (folderIds ends with the folder's own id).
function filesIn(folder: ResolvedFile) {
  const id = folder.folderIds[folder.folderIds.length - 1];
  return workspaceFiles().filter((file) => file.href !== folder.href && file.folderIds.includes(id));
}

function ProjectRow({ file, note, nested = false }: { file: ResolvedFile; note?: string; nested?: boolean }) {
  return (
    <Link
      href={file.href}
      className={`group flex items-start gap-3 rounded-md px-2 transition-colors hover:bg-studio-hover ${
        nested ? "py-1.5" : "py-3"
      }`}
    >
      <ItemIcon icon={file.icon} tone={file.tone} className={`shrink-0 ${nested ? "mt-px h-4 w-4" : "mt-0.5 h-5 w-5"}`} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span
            className={`group-hover:text-studio-link ${nested ? "text-[13px] text-studio-text" : "text-[15px] text-studio-bright"}`}
          >
            {file.title}
          </span>
          {file.tone ? null : <span className="font-mono text-[11px] text-studio-muted">{file.name}</span>}
        </span>
        {note ? <span className="mt-1 block text-[13px] leading-relaxed text-studio-muted">{note}</span> : null}
      </span>
    </Link>
  );
}

type Params = { params: Promise<{ member: string }> };

// The preview uses the start of the member's bio, else the site description.
export async function generateMetadata({ params }: Params) {
  const member = getMember((await params).member);
  return member ? pageMetadata(`/about-us/${member.slug}`, { title: member.name, description: member.bio?.[0] }) : {};
}

export default async function MemberPage({ params }: Params) {
  const { member: slug } = await params;
  const member = getMember(slug);

  if (!member) notFound();

  const projects = (member.projects ?? []).map((project) => ({ ...project, file: resolvePath(project.href) }));

  return (
    <div>
      {/* No kicker: the file name is already in the tab and breadcrumbs. */}
      <PageHeader href={`/about-us/${member.slug}`} title={member.name} kicker={[]}>
        {member.links?.length ? (
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-studio-muted">
            {member.links.map((link) => (
              <HeaderLink key={link.href} href={link.href}>
                {link.label}
              </HeaderLink>
            ))}
          </div>
        ) : null}
      </PageHeader>

      {member.bio?.length ? (
        <div className="max-w-2xl space-y-4 text-[17px] leading-relaxed text-studio-text">
          {member.bio.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      ) : (
        <p className="font-mono text-sm text-studio-muted">Nothing here yet.</p>
      )}

      <section aria-labelledby="member-projects" className="mt-12 max-w-2xl">
        <h2 id="member-projects" className="font-mono text-[11px] uppercase tracking-[0.18em] text-studio-muted">
          What I&apos;ve worked on
        </h2>
        {projects.length ? (
          <ul className="mt-3 divide-y divide-studio-border border-y border-studio-border">
            {projects.map(({ file, note }) => {
              const children = file.tone ? filesIn(file) : [];
              return (
                <li key={file.href} className="py-1">
                  <ProjectRow file={file} note={note} />
                  {children.length ? (
                    <ul className="mb-2 ml-[1.15rem] border-l border-studio-border pl-3">
                      {children.map((child) => (
                        <li key={child.href}>
                          <ProjectRow file={child} nested />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 border-y border-studio-border px-2 py-3 font-mono text-sm text-studio-muted">
            Nothing listed yet.
          </p>
        )}
      </section>
    </div>
  );
}
