import Link from "next/link";
import { projects } from "@/lib/projects";

export default function Nav() {
  return (
    <header className="relative z-20">
      <div className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-4 px-4 py-6 sm:px-8">
        <Link href="/" className="font-display text-xl italic tracking-tight text-cream">
          The Board
        </Link>
        <nav aria-label="Primary navigation" className="flex flex-wrap justify-end gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-cream/60">
          {[...projects.values()].map((p) => (
            <Link key={p.href} href={p.href} className="transition-colors hover:text-cream">
              {p.title}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
