"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ruleHref, ruleIdFromNumber } from "@/lib/root/paths";
import {
  CORNER_LIMIT,
  cardCounts,
  cornerStarters,
  reachCheck,
  type Entry,
  type FactionSetup,
  type ReachTable,
  type SetupCard,
} from "@/lib/root/setupPlan";
import { Sword } from "./ui";

// Shared pieces of the reach calculator and the advanced draft.

export type ById = Record<string, FactionSetup>;

const colour = (c: string) => ({ "--c": c }) as CSSProperties;

// A rule citation: "5.2" or a rule id such as "rule-5-intro".
export function RuleRef({ rule, label }: { rule: string; label?: string }) {
  const id = rule.startsWith("rule-") ? rule : ruleIdFromNumber(rule);
  if (!id) return <>{label ?? rule}</>;
  return (
    <Link href={ruleHref(id)} className="font-rootlabel text-root-link underline decoration-root-link/30 underline-offset-2 hover:decoration-root-link">
      {label ?? rule}
    </Link>
  );
}

// Militant factions get the setup card's sword; insurgents get nothing.
export function CardBadge({ card, className = "h-3.5 w-3.5" }: { card: SetupCard; className?: string }) {
  return card === "militant" ? (
    <span title="Militant" className="inline-flex text-root-militant">
      <Sword className={className} />
      <span className="sr-only">militant</span>
    </span>
  ) : (
    <span className="sr-only">insurgent</span>
  );
}

export function entryName(e: Entry, byId: ById, short = false): string {
  const f = byId[e.factionId];
  const name = short ? f.short : f.name;
  return e.second ? `${name} (2nd)` : name;
}

export function Pip({ color, className = "" }: { color: string; className?: string }) {
  return <span aria-hidden className={`root-pip ${className}`} style={colour(color)} />;
}

// A cardboard faction token you can switch on and off.
export function FactionChip({
  faction,
  label,
  extra,
  on,
  onClick,
}: {
  faction: FactionSetup;
  label?: string;
  extra?: ReactNode;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} title={faction.name} className="root-token" style={colour(faction.color)}>
      <Pip color={faction.color} />
      <span>{label ?? faction.short}</span>
      <CardBadge card={faction.card} className="h-3 w-3" />
      {extra}
    </button>
  );
}

// The reach total on a score track, like the one around the board: filled up
// to the total, with a marker at the recommended minimum.
export function ReachTrack({ total, needed, max = 30 }: { total: number; needed: number | null; max?: number }) {
  const length = Math.max(max, total, needed ?? 0);
  const meets = needed !== null && total >= needed;
  const fill = needed === null ? "rgb(var(--root-ochre))" : meets ? "rgb(var(--root-ok))" : "rgb(var(--root-accent))";
  return (
    <div>
      <div className="root-track pt-2" style={{ "--fill": fill } as CSSProperties} aria-hidden>
        {Array.from({ length }, (_, i) => (
          <span key={i} data-filled={i < total} data-mark={needed !== null && i === needed - 1} />
        ))}
      </div>
      <div className="mt-0.5 flex justify-between font-rootlabel text-[11px] text-root-muted" aria-hidden>
        <span>1</span>
        <span>{Math.round(length / 2)}</span>
        <span>{length}</span>
      </div>
    </div>
  );
}

// Reach (Law 5.2), the group's militant count, and the corner rule (chapter 5).
export function SetupSummary({ entries, byId, table }: { entries: Entry[]; byId: ById; table: ReachTable }) {
  const reach = reachCheck(entries, byId, table);
  const counts = cardCounts(entries, byId);
  const corners = cornerStarters(entries, byId);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <p className="font-rootdisplay text-[1.35rem] leading-none text-root-ink">
          Reach{" "}
          <span className={reach.meets === false ? "text-root-warn" : reach.meets ? "text-root-ok" : ""}>
            {reach.total}
            {reach.needed !== null && <span className="text-root-muted"> / {reach.needed}+</span>}
          </span>
          {reach.meets && <span className="ml-1 text-root-ok">✓</span>}
        </p>
        <p className="text-[14px]" title="Our own count, not a rule">
          <span className="inline-flex items-center gap-1 font-semibold text-root-militant">
            <Sword className="h-3.5 w-3.5" />
            {counts.militant} militant
          </span>
          <span className="text-root-muted"> · </span>
          <span className="font-semibold text-root-ink2">{counts.insurgent} insurgent</span>
        </p>
        <p className="text-[14px] text-root-muted">
          {corners.length} corner {corners.length === 1 ? "start" : "starts"}
        </p>
        <span className="ml-auto text-[13px]">
          <RuleRef rule="5.2" />
        </span>
      </div>
      <ReachTrack total={reach.total} needed={reach.needed} />
      {reach.needed === null && entries.length > 0 && (
        <p className="text-[13px] italic text-root-muted">The reach table covers 2–6 players.</p>
      )}
      {reach.meets === false && (
        <p className="text-[13px] italic text-root-muted">
          {reach.needed! - reach.total} short of the recommendation.{" "}
          {reach.adventurous
            ? `The Law welcomes adventurous groups to play any mix with ${table.adventurous}+.`
            : `Also under the ${table.adventurous}+ the Law allows adventurous groups.`}
        </p>
      )}
      {corners.length >= CORNER_LIMIT && (
        <p className="text-[13px] text-root-warn">
          {corners.length} factions start in corners: the Law requires the Advanced Setup with {CORNER_LIMIT} or more (
          <RuleRef rule="rule-5-intro" label="5" />
          ).
        </p>
      )}
    </div>
  );
}

// A faction's setup steps, folded: "1. (A) ● Marquise de Cat ........ 6.3".
export function SetupStep({
  index,
  letter,
  faction,
  name,
  who,
  open = false,
  children,
}: {
  index: number;
  letter?: string;
  faction: FactionSetup;
  name: string;
  who?: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={open} className="group border-b border-dashed border-root-line last:border-b-0">
      <summary className="flex cursor-pointer items-center gap-2.5 py-2 text-[15px]">
        <span className="w-5 text-right font-rootlabel text-[14px] text-root-muted">{index}.</span>
        {letter && (
          <span
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-root-ink/70 bg-root-cream font-rootdisplay text-[14px] text-root-ink shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)]"
            title="Setup letter"
          >
            {letter}
          </span>
        )}
        <Pip color={faction.color} />
        <span className="min-w-0 truncate font-rootdisplay text-[1.1rem] text-root-ink group-hover:text-root-link">{name}</span>
        {who && <span className="shrink-0 font-rootlabel text-[13px] text-root-muted">{who}</span>}
        <span aria-hidden className="mx-1 min-w-4 flex-1 translate-y-[-0.2em] border-b-2 border-dotted border-root-muted/30" />
        <span className="shrink-0 font-rootlabel text-[13px] text-root-muted">{faction.setupSection.number}</span>
        <span aria-hidden className="w-3 text-root-muted transition-transform group-open:rotate-90">
          ›
        </span>
      </summary>
      <div className="mb-3 ml-7 border-l-2 border-root-line pl-4 text-[15px]">{children}</div>
    </details>
  );
}

export function loadState<T>(key: string): T | null {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? "null") as T | null;
  } catch {
    return null;
  }
}

export function saveState(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
