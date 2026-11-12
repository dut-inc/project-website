import Link from "next/link";
import type { ReactNode } from "react";
import { ancestorsOf, chapterLabel, chapterOf, getSection, ruleLabel, type Rule } from "@/lib/root/law";
import { chapterHref, ruleHref } from "@/lib/root/paths";
import RuleEntry from "./RuleEntry";
import { RuleTitle } from "./RuleText";

// A rule shown away from its chapter (faction and topic pages): where it sits
// in the book, an optional note on why it's listed, then the rule itself.

// "4. Key Actions › 4.3 Battle › 4.3.5 Ambush"
export function Where({ rule }: { rule: Rule }) {
  const chapter = chapterOf(rule.section_id);
  const section = getSection(rule.section_id)!;
  const parts = [
    { href: chapterHref(chapter.id), label: chapterLabel(chapter) },
    ...(section.level === 2 && section.number !== rule.rule_number
      ? [{ href: chapterHref(chapter.id, section.id), label: `${section.number} ${section.title}` }]
      : []),
    ...ancestorsOf(rule).map((a) => ({ href: ruleHref(a.id), label: ruleLabel(a) })),
  ];
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-[12px] text-root-muted">
      {parts.map((part, index) => (
        <span key={part.href} className="inline-flex items-center gap-1.5">
          {index > 0 && <span aria-hidden>›</span>}
          <Link href={part.href} className="hover:text-root-link">
            {part.label}
          </Link>
        </span>
      ))}
    </p>
  );
}

export default function RuleCard({ rule, note }: { rule: Rule; note?: ReactNode }) {
  return (
    <div className="rounded-lg border border-root-line bg-root-ink/[0.025] p-4">
      <Where rule={rule} />
      {note}
      <div className="mt-1.5">
        {(rule.rule_type === "section-text" || rule.rule_type === "chapter-text") && (
          // Section text has no heading of its own; give it its section's number.
          <h3 className="flex items-baseline gap-2.5">
            <Link href={ruleHref(rule.id)} className="font-rootlabel text-[13px] text-root-link hover:underline">
              {rule.rule_number ?? "Introduction"}
            </Link>
            {rule.title && (
              <span className="font-semibold text-root-ink">
                <RuleTitle title={rule.title} />
              </span>
            )}
          </h3>
        )}
        <RuleEntry rule={rule} />
      </div>
    </div>
  );
}

export function GroupHeading({
  id,
  title,
  count,
  badge,
  children,
}: {
  id: string;
  title: string;
  count?: number;
  badge?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div id={id} className="mb-5 scroll-mt-28 border-b border-root-line pb-3">
      <h2 className="flex flex-wrap items-baseline gap-3 font-rootdisplay text-3xl text-root-ink">
        {title}
        {count !== undefined && <span className="font-rootlabel text-sm text-root-muted">{count}</span>}
        {badge}
      </h2>
      {children && <div className="mt-2 max-w-3xl text-[14px] leading-relaxed">{children}</div>}
    </div>
  );
}

// A compact list of links to rules: "4.3 Battle", "G.13 Item".
export function RuleLinks({ rules }: { rules: Rule[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1">
      {rules.map((rule) => (
        <li key={rule.id}>
          <Link href={ruleHref(rule.id)} className="text-root-ink2 hover:text-root-link">
            {rule.rule_number && <span className="mr-1.5 font-rootlabel text-[12.5px] text-root-link">{rule.rule_number}</span>}
            {rule.title ? <RuleTitle title={rule.title} /> : ruleLabel(rule)}
          </Link>
        </li>
      ))}
    </ul>
  );
}
