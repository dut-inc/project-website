import Link from "next/link";
import CaseHeader from "@/components/CaseHeader";

const features = [
  {
    href: "/sports/dashboard",
    tag: "Flagship",
    title: "Seattle Sports Dashboard",
    blurb:
      "Live scores, schedules, standings, and season stats for every major Seattle pro team — reorderable cards, saved to your browser.",
  },
  {
    href: "/sports/offensive-profiles",
    tag: "Analytics",
    title: "Offensive Archetypes",
    blurb:
      "Basketball and baseball shot-archetype clustering — win probability, scouting recaps, and a fantasy assistant for the group.",
  },
];

export default function SportsPage() {
  return (
    <div>
      <CaseHeader
        caseNumber="002"
        title="Sports Lab"
        status="ACTIVE"
        pin="gold"
        description="Where the group's Seattle sports work lives — the team dashboard on the front end, and basketball/baseball models in the data pipeline."
      />
      <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-pinGold/50 hover:bg-white/[0.06]"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-pinGold/80">{f.tag}</span>
            <h2 className="mt-2 font-display text-xl text-cream transition-colors group-hover:text-white">
              {f.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-cream/55">{f.blurb}</p>
            <span className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-cream/40 transition-colors group-hover:text-pinGold">
              Open <span aria-hidden>→</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
