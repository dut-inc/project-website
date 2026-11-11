import Link from "next/link";
import CaseHeader from "@/components/CaseHeader";
import { sectionMetadata } from "@/lib/metadata";
import { childProjects } from "@/lib/projects";

export const metadata = sectionMetadata("board-games");

const features = [
  {
    href: "/board-games/tierlist",
    tag: "Live",
    title: "Board Games Tier List",
    blurb:
      "our group's personal rankings of board games we've played",
  },
  {
    href: "/board-games/root",
    tag: "Live",
    title: "Root Rules Encyclopedia",
    blurb: "every rule in the Law of Root, by chapter and by number",
  },
];

export default function BoardGamesPage() {
  // Nested sections (The Pack) are listed like any other page here.
  const nested = childProjects("board-games").map(([, child]) => ({
    href: child.href,
    tag: child.status,
    title: child.title,
    blurb: child.summary,
  }));

  return (
    <div>
      <CaseHeader projectId="board-games" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[...features, ...nested].map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-pinGreen/50 hover:bg-white/[0.06]"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-pinGreen/80">{f.tag}</span>
            <h2 className="mt-2 font-display text-xl text-cream transition-colors group-hover:text-white">
              {f.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-cream/55">{f.blurb}</p>
            <span className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-cream/40 transition-colors group-hover:text-pinGreen">
              Open <span aria-hidden>→</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}