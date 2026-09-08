import Link from "next/link";
import CaseHeader from "@/components/CaseHeader";
import { getProject } from "@/lib/projects";

const features = [
  {
    href: "/fish-stuff/personality",
    tag: "Live",
    title: "Which Pacific Northwest Fish Are You?",
    blurb:
      "find out what fish you are!1!1!1!!!!",
  },
];

const comingSoon = [
  {
    title: "Identify the fish quiz",
    blurb:
      "name that fish!",
  },
  {
    title: "Species ID Model",
    blurb:
      "image classification model to identify fish species",
  },
];

export default function FishStuffPage() {
  const project = getProject("fish-stuff");

  return (
    <div>
      <CaseHeader
        caseNumber={project.case}
        title={project.title}
        status={project.status}
        pin={project.pin}
        paper={project.paper}
        rotation={project.rotation}
        description={project.summary}
      />
      <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
        {features.map((f) => (
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
        {comingSoon.map((f) => (
          <div
            key={f.title}
            aria-disabled="true"
            className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/[0.03] p-5 opacity-55"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-pinGold/70">Not started</span>
            <h2 className="mt-2 font-display text-xl text-cream/70">{f.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-cream/40">{f.blurb}</p>
            <span className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-cream/30">
              Coming soon
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}