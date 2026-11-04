import Link from "next/link";
import CaseHeader from "@/components/CaseHeader";
import { MEMBERS } from "@/lib/members";

export default function AboutUsPage() {
  return (
    <div>
      <CaseHeader projectId="about-us" />
      <div className="grid gap-4 sm:grid-cols-2">
        {MEMBERS.map((member) => (
          <Link
            key={member.slug}
            href={`/about-us/${member.slug}`}
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-pinGreen/50 hover:bg-white/[0.06]"
          >
            <span className="font-mono text-[10px] normal-case tracking-normal text-cream/50">{member.slug}.md</span>
            <h2 className="mt-2 font-display text-xl text-cream transition-colors group-hover:text-white">
              {member.name}
            </h2>
            <span className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-cream/40 transition-colors group-hover:text-pinGreen">
              Open <span aria-hidden>→</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
