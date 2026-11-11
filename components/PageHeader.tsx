import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { parentOf, resolvePath } from "@/lib/workspace";

// The shared header at the top of every page in the editor: a back link to the
// page's folder, a mono kicker line, the title and a short description. Each
// tool's own UI renders below it in its own style.
export default function PageHeader({
  href,
  title,
  kicker,
  meta = [],
  description,
  actions,
  back,
  compact = false,
  children,
}: {
  // A small back link above a smaller title, with meta and actions on the title's row. No kicker.
  compact?: boolean;
  // This page's route. Supplies the back link, the file name in the kicker and
  // the default title (all from lib/workspace.ts).
  href: string;
  title?: string;
  // Replaces the kicker (otherwise the explorer file name, then `meta`).
  kicker?: ReactNode[];
  meta?: ReactNode[];
  description?: ReactNode;
  // Small links on the right of the back-link row (e.g. GitHub).
  actions?: ReactNode;
  // Overrides the back link; null hides it (the welcome page).
  back?: { href: string; label: string } | null;
  children?: ReactNode;
}) {
  const page = resolvePath(href);
  const parent = back === undefined ? parentOf(href) : back;
  const items = kicker ?? [<span key="file" className="normal-case tracking-normal text-studio-text">{page.name}</span>, ...meta];

  if (compact) {
    return (
      <header className="mb-5 border-b border-studio-border pb-3">
        {parent && (
          <Link
            href={parent.href}
            className="mb-1 inline-flex items-center gap-1.5 font-mono text-xs text-studio-muted transition-colors hover:text-studio-link"
          >
            <span aria-hidden>&larr;</span> {parent.label}
          </Link>
        )}
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="font-display text-2xl leading-tight tracking-tight text-studio-bright sm:text-3xl">
            {title ?? page.title}
          </h1>
          {meta.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] text-studio-muted">
              {meta.map((item, index) => (
                <Fragment key={index}>
                  {index > 0 && <span aria-hidden className="h-3 w-px bg-studio-border" />}
                  <span>{item}</span>
                </Fragment>
              ))}
            </div>
          )}
          {actions && (
            <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-studio-muted">
              {actions}
            </div>
          )}
        </div>
        {description && <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-studio-muted">{description}</p>}
        {children}
      </header>
    );
  }

  return (
    <header className="mb-8 border-b border-studio-border pb-7">
      {(parent || actions) && (
        <div className="mb-6 flex items-center justify-between gap-4">
          {parent && (
            <Link
              href={parent.href}
              className="inline-flex items-center gap-1.5 font-mono text-xs text-studio-muted transition-colors hover:text-studio-link"
            >
              <span aria-hidden>&larr;</span> {parent.label}
            </Link>
          )}
          {actions && <div className="ml-auto flex items-center gap-4 font-mono text-xs text-studio-muted">{actions}</div>}
        </div>
      )}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.16em] text-studio-muted">
          {items.map((item, index) => (
            <Fragment key={index}>
              {index > 0 && <span aria-hidden className="h-3 w-px bg-studio-border" />}
              <span>{item}</span>
            </Fragment>
          ))}
        </div>
      )}
      <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-studio-bright sm:text-5xl">
        {title ?? page.title}
      </h1>
      {description && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-studio-text">{description}</p>}
      {children}
    </header>
  );
}

// A small external link for the header's actions slot.
export function HeaderLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 transition-colors hover:text-studio-link"
    >
      {children} <span aria-hidden>↗</span>
    </a>
  );
}
