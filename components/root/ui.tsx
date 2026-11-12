import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

// Root Assistant building blocks: paper sheets on the table, the page header
// written on the table, and small inked icons. Styles: root-theme.css.

type Edge = "a" | "b" | "c";

export function Paper({
  children,
  className = "",
  innerClassName = "",
  tone = "paper",
  edge = "a",
  small = false,
  flat = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  tone?: "paper" | "cream" | "kraft";
  edge?: Edge;
  // Shallower tears, for small slips of paper.
  small?: boolean;
  // No drop shadow (slips of paper lying flat, like sent questions).
  flat?: boolean;
  style?: CSSProperties;
}) {
  const toneClass = tone === "kraft" ? "root-paper-kraft" : tone === "cream" ? "root-paper-cream" : "";
  return (
    <div className={`root-sheet ${flat ? "root-sheet-flat" : ""} ${className}`} style={style}>
      {/* Top and bottom tears on this layer, left and right on the paper itself. */}
      <div className={`root-torn torn-${edge} ${small ? "root-torn-sm" : ""}`}>
        <div className={`root-paper root-torn-sides ${toneClass} ${innerClassName}`}>{children}</div>
      </div>
    </div>
  );
}

export type Back = { href: string; label: string };

// The title, written on the table above the paper.
export function RootHeader({
  back,
  title,
  meta,
  actions,
}: {
  back?: Back;
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-7">
      {back && (
        <Link
          href={back.href}
          className="mb-1.5 inline-flex items-center gap-1.5 font-rootlabel text-[14px] tracking-wide text-root-cream/60 transition-colors hover:text-root-cream"
        >
          <span aria-hidden>←</span> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <h1 className="font-rootdisplay text-[2.4rem] leading-[1.05] tracking-tight text-root-cream [text-shadow:0_2px_0_rgb(0_0_0/0.4)] sm:text-5xl">
          {title}
        </h1>
        {meta && <div className="pb-1.5 font-rootlabel text-[14px] text-root-cream/60">{meta}</div>}
        {actions && <div className="ml-auto flex flex-wrap items-center gap-3 pb-1">{actions}</div>}
      </div>
    </header>
  );
}

// A small kraft label link for the header (on the table).
export function TableLink({ href, children, external = false }: { href: string; children: ReactNode; external?: boolean }) {
  const className =
    "inline-flex items-center gap-1 rounded-md border-[1.5px] border-root-ink bg-root-kraft px-3 py-1 font-rootlabel text-[14px] font-bold text-root-ink shadow-[0_2px_0_rgb(var(--root-ink))] transition-transform hover:-translate-y-px active:translate-y-px";
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children} <span aria-hidden>↗</span>
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

// A standard Root page: header on the table, content on one sheet.
export function RootPage({
  back,
  title,
  meta,
  actions,
  children,
  edge = "a",
}: {
  back?: Back;
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  edge?: Edge;
}) {
  return (
    <div>
      <RootHeader back={back} title={title} meta={meta} actions={actions} />
      <Paper edge={edge} innerClassName="px-5 pb-10 pt-9 sm:px-10 sm:pb-12 sm:pt-11">
        {children}
      </Paper>
    </div>
  );
}

// A sword, as printed beside militant faction names on the setup cards (A.8.2).
export function Sword({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden fill="currentColor">
      {/* An upright sword (pointed blade, crossguard, grip, pommel), tipped 40°. */}
      <g transform="translate(8 8) rotate(40) scale(0.92) translate(-8 -8)">
        <path d="M8 0.4 9.25 2.4 9.25 10.4 6.75 10.4 6.75 2.4Z" />
        <rect x="4.2" y="10.4" width="7.6" height="1.6" rx="0.7" />
        <rect x="7.25" y="12" width="1.5" height="2.3" />
        <circle cx="8" cy="15" r="1.05" />
      </g>
    </svg>
  );
}

// A section heading with an inked squiggle beneath.
export function InkHeading({ children, as: Tag = "h2", className = "" }: { children: ReactNode; as?: "h2" | "h3"; className?: string }) {
  return (
    <div className={className}>
      <Tag className="font-rootdisplay text-[1.55rem] leading-tight text-root-ink">{children}</Tag>
      <div className="root-squiggle mt-1 w-40 max-w-full" aria-hidden />
    </div>
  );
}
