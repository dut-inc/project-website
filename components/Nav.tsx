import Link from "next/link";

const links = [
  { href: "/fish-quiz", label: "Fish Quiz" },
  { href: "/sports", label: "Sports Lab" },
  { href: "/conservation", label: "Field Watch" },
  { href: "/board", label: "Loose Ends" },
];

export default function Nav() {
  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-8">
        <Link href="/" className="font-display text-xl italic tracking-tight text-cream">
          The Board
        </Link>
        <nav className="flex gap-5 font-mono text-[11px] uppercase tracking-widest text-cream/50">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-pinGold">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
