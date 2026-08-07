"use client";

import Link from "next/link";
import Pin from "./Pin";
import { statusColor, type PinColor, type Status } from "@/lib/projects";
import type { KeyboardEvent, Ref, ReactNode } from "react";

export default function CaseHeader({
  caseNumber,
  title,
  status,
  description,
  pin = "gold",
  backHref = "/",
  backLabel = "Back to the board",
  caseNumberControl,
  caseStudyRef,
  onCaseStudyClick,
  caseStudyLabel = "Open case study controls",
}: {
  caseNumber: string;
  title: string;
  status: Status;
  description: string;
  pin?: PinColor;
  backHref?: string;
  backLabel?: string;
  caseNumberControl?: ReactNode;
  caseStudyRef?: Ref<HTMLDivElement>;
  onCaseStudyClick?: () => void;
  caseStudyLabel?: string;
}) {
  function handleCaseStudyKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!onCaseStudyClick || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    onCaseStudyClick();
  }

  return (
    <div>
      <Link
        href={backHref}
        className="mb-6 inline-block font-mono text-xs uppercase tracking-widest text-cream/50 hover:text-pinGold"
      >
        &larr; {backLabel}
      </Link>
      <div
        ref={caseStudyRef}
        className={`relative mx-auto max-w-xl -rotate-1 ${onCaseStudyClick ? "cursor-pointer" : ""}`}
        onClick={onCaseStudyClick}
        onKeyDown={handleCaseStudyKeyDown}
        role={onCaseStudyClick ? "button" : undefined}
        tabIndex={onCaseStudyClick ? 0 : undefined}
        aria-label={onCaseStudyClick ? caseStudyLabel : undefined}
      >
        <Pin color={pin} />
        <div className="paper-torn bg-cream p-6 text-ink shadow-[0_14px_28px_-8px_rgba(0,0,0,0.55)] transition-shadow sm:p-7">
          <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-ink2">
            <span>{caseNumberControl ?? <>Case №{caseNumber}</>}</span>
            <span className={statusColor[status]}>{status}</span>
          </div>
          <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/80">{description}</p>
        </div>
      </div>
    </div>
  );
}
