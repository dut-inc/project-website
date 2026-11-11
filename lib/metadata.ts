import type { Metadata } from "next";
import { getProject, type ProjectId } from "@/lib/projects";
import { resolvePath } from "@/lib/workspace";

// Link previews (title and description shown when a page's URL is shared).
// app/layout.tsx uses the site defaults; each page passes its own text.
export const SITE_NAME = "Perpetual Studio";
export const SITE_DESCRIPTION = "View our projects";

export function siteMetadata(): Metadata {
  return {
    title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
    description: SITE_DESCRIPTION,
    openGraph: { title: SITE_NAME, description: SITE_DESCRIPTION, siteName: SITE_NAME, type: "website" },
    twitter: { card: "summary", title: SITE_NAME, description: SITE_DESCRIPTION },
  };
}

// `title` defaults to the page's title in the explorer (lib/workspace.ts).
export function pageMetadata(href: string, { title, description }: { title?: string; description?: string } = {}): Metadata {
  const pageTitle = title ?? resolvePath(href).title;
  const fullTitle = `${pageTitle} · ${SITE_NAME}`;
  const text = description ?? SITE_DESCRIPTION;
  return {
    title: pageTitle,
    description: text,
    openGraph: { title: fullTitle, description: text, siteName: SITE_NAME, type: "website" },
    twitter: { card: "summary", title: fullTitle, description: text },
  };
}

// A section's own (folder) page: its title and summary from lib/projects.ts.
export function sectionMetadata(projectId: ProjectId): Metadata {
  const project = getProject(projectId);
  return pageMetadata(project.href, { title: project.title, description: project.summary });
}
