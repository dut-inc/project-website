import type { FileIcon, FolderTone } from "@/lib/workspace";

// Decorative icons for the workspace chrome. Nothing here knows about routes:
// files and folders reference an icon by kind (lib/workspace.ts), so this file
// can be restyled or replaced freely.

type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function LogoMark({ className = "h-5 w-5" }: IconProps) {
  // A loop that never ends: the "perpetual" mark.
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="1" y="1" width="22" height="22" rx="6" fill="#0d2438" stroke="#3794ff" strokeOpacity="0.5" />
      <path
        d="M6.6 12c0-1.6 1.1-2.7 2.5-2.7 2.4 0 3.4 5.4 5.8 5.4 1.4 0 2.5-1.1 2.5-2.7s-1.1-2.7-2.5-2.7c-2.4 0-3.4 5.4-5.8 5.4-1.4 0-2.5-1.1-2.5-2.7Z"
        fill="none"
        stroke="#3794ff"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronIcon({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path d="M6 4l4 4-4 4" {...stroke} />
    </svg>
  );
}

export function CloseIcon({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" {...stroke} />
    </svg>
  );
}

export function MenuIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <path d="M3.5 6h13M3.5 10h13M3.5 14h13" {...stroke} />
    </svg>
  );
}

export function SearchIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <circle cx="7" cy="7" r="4.25" {...stroke} />
      <path d="M10.2 10.2l3.3 3.3" {...stroke} />
    </svg>
  );
}

export function SidebarIcon({ className = "h-4 w-4", open = true }: IconProps & { open?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="1.5" {...stroke} />
      <path d="M6 2.75v10.5" {...stroke} />
      {open && <rect x="2.5" y="3.5" width="3" height="9" fill="currentColor" opacity="0.45" />}
    </svg>
  );
}

export function CollapseAllIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" {...stroke} />
      <path d="M5.5 8h5" {...stroke} />
    </svg>
  );
}

const folderTones: Record<FolderTone, string> = {
  teal: "#5fb8a6",
  orange: "#e98a4f",
  green: "#86b46a",
  sand: "#c7b48a",
  red: "#d0675a",
  violet: "#a08ad8",
  gold: "#e2b34b",
  blue: "#3794ff",
};

export function FolderIcon({ tone, open, className = "h-4 w-4" }: IconProps & { tone: FolderTone; open: boolean }) {
  const color = folderTones[tone];
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      {open ? (
        <>
          <path d="M1.5 4a1 1 0 0 1 1-1h3.3l1.4 1.5h5.3a1 1 0 0 1 1 1V6H4.2a1 1 0 0 0-.95.7L1.5 12V4Z" fill={color} opacity="0.55" />
          <path d="M3.25 6.7A1 1 0 0 1 4.2 6h10.3a.6.6 0 0 1 .57.8l-1.7 5.5a1 1 0 0 1-.96.7H1.5l1.75-6.3Z" fill={color} />
        </>
      ) : (
        <>
          <path d="M1.5 4a1 1 0 0 1 1-1h3.3l1.4 1.5h6.3a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4Z" fill={color} opacity="0.9" />
          <path d="M1.5 6h13" stroke="#000" strokeOpacity="0.25" />
        </>
      )}
    </svg>
  );
}

// Each file kind gets a small glyph and its own restrained color.
const fileColors: Record<FileIcon, string> = {
  welcome: "#3794ff",
  quiz: "#5fb8a6",
  live: "#e5675b",
  notebook: "#e98a4f",
  table: "#86b46a",
  model: "#b996e6",
  map: "#6cc0b0",
  rank: "#d9a35b",
  cards: "#e2b34b",
  puzzle: "#a08ad8",
  person: "#7cb7e8",
  law: "#c9a66b",
  file: "#9a978d",
};

function FileGlyph({ icon }: { icon: FileIcon }) {
  switch (icon) {
    case "welcome":
      return <path d="M8 2.5l1.6 3.4 3.7.4-2.8 2.5.8 3.7L8 10.6l-3.3 1.9.8-3.7L2.7 6.3l3.7-.4L8 2.5Z" fill="currentColor" />;
    case "quiz":
      return (
        <>
          <circle cx="8" cy="8" r="5.75" {...stroke} />
          <path d="M6.3 6.4a1.8 1.8 0 1 1 2.5 1.7c-.5.2-.8.6-.8 1.1v.4" {...stroke} />
          <circle cx="8" cy="11.4" r=".8" fill="currentColor" />
        </>
      );
    case "live":
      return (
        <>
          <circle cx="8" cy="8" r="1.8" fill="currentColor" />
          <path d="M5 5a4.2 4.2 0 0 0 0 6M11 5a4.2 4.2 0 0 1 0 6M3 3a7 7 0 0 0 0 10M13 3a7 7 0 0 1 0 10" {...stroke} />
        </>
      );
    case "notebook":
      return (
        <>
          <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" {...stroke} />
          <path d="M5 11V8.5M8 11V5.5M11 11V7" {...stroke} />
        </>
      );
    case "table":
      return (
        <>
          <rect x="2.5" y="3" width="11" height="10" rx="1" {...stroke} />
          <path d="M2.5 6.5h11M2.5 9.75h11M6.5 3v10" {...stroke} />
        </>
      );
    case "model":
      return (
        <>
          <circle cx="4" cy="4.5" r="1.5" {...stroke} />
          <circle cx="4" cy="11.5" r="1.5" {...stroke} />
          <circle cx="12" cy="8" r="1.75" {...stroke} />
          <path d="M5.4 5.2l4.9 2.2M5.4 10.8l4.9-2.2" {...stroke} />
        </>
      );
    case "map":
      return (
        <>
          <path d="M8 14s-4.25-4-4.25-7.25a4.25 4.25 0 0 1 8.5 0C12.25 10 8 14 8 14Z" {...stroke} />
          <circle cx="8" cy="6.75" r="1.5" fill="currentColor" />
        </>
      );
    case "rank":
      return (
        <>
          <path d="M2.5 4h2M2.5 8h2M2.5 12h2" {...stroke} />
          <path d="M6.5 4h7M6.5 8h5M6.5 12h3" {...stroke} />
        </>
      );
    case "cards":
      return (
        <>
          <rect x="5.5" y="2.5" width="7" height="10" rx="1.2" transform="rotate(12 9 7.5)" {...stroke} />
          <path d="M3.4 4.6 2.6 12a1 1 0 0 0 .9 1.1l4.3.5" {...stroke} />
          <path d="M9.4 6.2c.9.8 1.6 1.4 1.6 2.1a1 1 0 0 1-1.7.7l.2 1h-1l.2-1a1 1 0 0 1-1.7-.7c0-.7.7-1.3 1.6-2.1h.8Z" fill="currentColor" transform="rotate(12 9 7.5)" />
        </>
      );
    case "puzzle":
      return (
        <>
          <rect x="2.5" y="3" width="11" height="10.5" rx="1.5" {...stroke} />
          <path d="M2.5 6h11M5.5 1.75v2.5M10.5 1.75v2.5" {...stroke} />
          <path d="M6.75 9.6 7.8 10.6l1.9-2.3" {...stroke} />
        </>
      );
    case "person":
      return (
        <>
          <circle cx="8" cy="5.5" r="2.75" {...stroke} />
          <path d="M3 13.5c.6-2.6 2.6-4 5-4s4.4 1.4 5 4" {...stroke} />
        </>
      );
    case "law":
      // An open book.
      return (
        <>
          <path d="M8 4.5C6.6 3.4 4.6 3 2.5 3.2v9c2.1-.2 4.1.2 5.5 1.3 1.4-1.1 3.4-1.5 5.5-1.3v-9C11.4 3 9.4 3.4 8 4.5Z" {...stroke} />
          <path d="M8 4.5v9" {...stroke} />
        </>
      );
    default:
      return <path d="M3.5 2.5h6l3 3v8h-9v-11Z" {...stroke} />;
  }
}

export function FileTypeIcon({ icon, className = "h-4 w-4" }: IconProps & { icon: FileIcon }) {
  return (
    <svg viewBox="0 0 16 16" className={className} style={{ color: fileColors[icon] }} aria-hidden>
      <FileGlyph icon={icon} />
    </svg>
  );
}

// A page's icon: its folder for a section page, otherwise its file glyph.
export function ItemIcon({ icon, tone, className = "h-4 w-4" }: IconProps & { icon: FileIcon; tone?: FolderTone }) {
  if (tone) return <FolderIcon tone={tone} open={false} className={className} />;
  return <FileTypeIcon icon={icon} className={className} />;
}
