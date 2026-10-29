import Link from "next/link";
import NavLinks from "./NavLinks";
import { topLevelProjects } from "@/lib/projects";

export default function Nav() {
  // Nested sections (The Pack → Board Games) are reached through their parent.
  const links = topLevelProjects().map(([id, p]) => ({ id, href: p.href, title: p.title }));

  return (
    <header className="relative z-20">
      <div className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-5 sm:px-8 sm:py-6">
        <Link href="/" className="font-display text-xl italic tracking-tight text-cream">
          The Clubhouse
        </Link>
        <NavLinks links={links} />
      </div>
    </header>
  );
}
