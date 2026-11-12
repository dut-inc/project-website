import Link from "next/link";
import { childrenOf, getFaction, type Rule } from "@/lib/root/law";
import { factionStyle } from "@/lib/root/factionStyle";
import { factionHref, pdfPageHref, ruleHref } from "@/lib/root/paths";
import RuleText, { RuleTitle } from "./RuleText";

// One record as it appears in a chapter (and nested sub-rules beneath it).

export function FactionChip({ id }: { id: string }) {
  const faction = getFaction(id);
  const { short, color } = factionStyle(id);
  const label = faction?.name ?? short;
  return (
    <Link
      href={faction ? factionHref(faction.id) : "#"}
      title={label}
      className="inline-flex items-center gap-1.5 rounded-full border border-root-line bg-root-inset px-2 py-0.5 font-rootlabel text-[11px] text-root-ink2 transition-colors hover:border-root-muted hover:text-root-ink"
    >
      <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {short}
    </Link>
  );
}

// The faction icons printed after a rule. The Law: "Faction icons mark rules
// modified by Faction Rules and Abilities sections."
export function FactionMarkers({ ids }: { ids: string[] }) {
  if (ids.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="root-kicker" title="The Law prints these faction icons on rules that the faction's own rules modify.">
        Modified by
      </span>
      {ids.map((id) => (
        <FactionChip key={id} id={id} />
      ))}
    </div>
  );
}

export function PageLink({ rule, className = "" }: { rule: Rule; className?: string }) {
  const { source_page_start: start, source_page_end: end } = rule;
  return (
    <a
      href={pdfPageHref(start)}
      target="_blank"
      rel="noopener noreferrer"
      title="Open this page of the Law PDF"
      className={`font-rootlabel text-[11px] text-root-muted transition-colors hover:text-root-link ${className}`}
    >
      {end && end !== start ? `pp. ${start}–${end}` : `p. ${start}`}
    </a>
  );
}

export default function RuleEntry({
  rule,
  depth = 0,
  heading = true,
  markers = true,
}: {
  rule: Rule;
  depth?: number;
  // The rule page shows the number, title and faction icons itself.
  heading?: boolean;
  markers?: boolean;
}) {
  const children = childrenOf(rule.id);
  const numbered = heading && rule.rule_type !== "section-text" && rule.rule_type !== "chapter-text";
  return (
    <article id={rule.id} className={`scroll-mt-28 ${depth > 0 ? "border-l border-root-line pl-4" : ""}`}>
      {numbered && (
        <h4 className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <Link
            href={ruleHref(rule.id)}
            className="font-rootlabel text-[13px] text-root-link hover:underline"
            title="Open this rule on its own page"
          >
            {rule.rule_number}
          </Link>
          {rule.title && (
            <span className="font-semibold text-root-ink">
              <RuleTitle title={rule.title} />
            </span>
          )}
          <PageLink rule={rule} className="ml-auto" />
        </h4>
      )}
      <RuleText text={rule.text} references={rule.cross_references} className={numbered ? "mt-1" : ""} />
      {markers && <FactionMarkers ids={rule.faction_markers} />}
      {children.length > 0 && (
        <div className="mt-3 space-y-3">
          {children.map((child) => (
            <RuleEntry key={child.id} rule={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </article>
  );
}
