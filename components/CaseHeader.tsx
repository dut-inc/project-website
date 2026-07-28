import Link from "next/link";
import StampBadge from "./StampBadge";
import type { Status } from "@/lib/projects";

export default function CaseHeader({
  caseNumber,
  title,
  status,
  description,
}: {
  caseNumber: string;
  title: string;
  status: Status;
  description: string;
}) {
  return (
    <div className="mb-10 border-b border-paper/10 pb-8">
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-widest text-paper2 hover:text-moss"
      >
        &larr; Back to the log
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <span className="font-mono text-xs text-paper2">CASE &#8470; {caseNumber}</span>
        <StampBadge status={status} />
      </div>
      <h1 className="mt-3 font-display text-4xl text-paper">{title}</h1>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-paper2">{description}</p>
    </div>
  );
}
