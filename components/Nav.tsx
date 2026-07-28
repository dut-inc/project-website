import Link from "next/link";

const links = [
  { href: "/fish-quiz", label: "Fish Quiz" },
  { href: "/sports", label: "Sports Lab" },
  { href: "/conservation", label: "Field Watch" },
  { href: "/board", label: "The Board" },
];

export default function Nav() {
  return (
    <header className="border-b border-paper/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-xl tracking-tight text-paper">
          The Log<span className="text-stamp">.</span>
        </Link>
        <nav className="flex gap-6 font-mono text-xs uppercase tracking-widest text-paper2">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-moss">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
