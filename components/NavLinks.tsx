"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { id: string; href: string; title: string };

export default function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      aria-label="Primary navigation"
      className="-mx-1.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-widest text-cream/60 sm:justify-end sm:gap-x-4"
    >
      {links.map((link) => {
        // A section stays highlighted on its sub-pages (e.g. /board-games/the-pack).
        const isCurrent = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.id}
            href={link.href}
            aria-current={isCurrent ? "page" : undefined}
            className={`rounded px-1.5 py-1.5 transition-colors hover:text-cream ${
              isCurrent ? "text-pinGold underline decoration-pinGold/60 underline-offset-4" : ""
            }`}
          >
            {link.title}
          </Link>
        );
      })}
    </nav>
  );
}
