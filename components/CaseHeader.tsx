import Link from "next/link";
import Pin from "./Pin";
import { statusColor, type PinColor, type Status } from "@/lib/projects";

export default function CaseHeader({
  caseNumber,
  title,
  status,
  description,
  pin = "gold",
}: {
  caseNumber: string;
  title: string;
  status: Status;
  description: string;
  pin?: PinColor;
}) {
  return (
    <div>
      <Link
        href="/"
        className="mb-6 inline-block rounded-sm font-mono text-xs uppercase tracking-widest text-cream/60 transition-colors hover:text-cream"
      >
        &larr; Back to the board
      </Link>
      <div className="relative mx-auto max-w-xl -rotate-1">
        <Pin color={pin} />
        <div className="paper-torn bg-cream p-6 text-ink shadow-[0_14px_28px_-8px_rgba(0,0,0,0.55)] sm:p-7">
          <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-ink2">
            <span>Case №{caseNumber}</span>
            <span className={statusColor[status]}>{status}</span>
          </div>
          <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/80">{description}</p>
        </div>
      </div>
    </div>
  );
}
