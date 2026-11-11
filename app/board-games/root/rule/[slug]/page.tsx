import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import CopyLinkButton from "@/components/root/CopyLinkButton";
import RuleEntry, { FactionChip, PageLink } from "@/components/root/RuleEntry";
import RuleText, { RuleTitle } from "@/components/root/RuleText";
import { pageMetadata } from "@/lib/metadata";
import {
  SOURCE,
  allRules,
  ancestorsOf,
  chapterLabel,
  chapterOf,
  citedBy,
  getRule,
  getSection,
  neighbours,
  ruleLabel,
  targetHref,
  targetLabel,
  verificationOf,
  type Rule,
} from "@/lib/root/law";
import { plainText } from "@/lib/root/markup";
import { chapterHref, pdfPageHref, ruleHref, ruleSlug, searchHref, topicHref } from "@/lib/root/paths";
import { topicsOfRule } from "@/lib/root/topics";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return allRules().map((rule) => ({ slug: ruleSlug(rule.id) }));
}

export async function generateMetadata({ params }: Params) {
  const rule = getRule(`rule-${(await params).slug}`);
  if (!rule) return {};
  const text = plainText(rule.text);
  return pageMetadata(ruleHref(rule.id), {
    title: `${ruleLabel(rule)} · Root`,
    description: text.length > 200 ? `${text.slice(0, 197).trimEnd()}…` : text || ruleLabel(rule),
  });
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-studio-muted">{title}</h2>
      {children}
    </section>
  );
}

function RuleLinkList({ rules }: { rules: Rule[] }) {
  return (
    <ul className="space-y-1.5">
      {rules.map((rule) => (
        <li key={rule.id}>
          <Link href={ruleHref(rule.id)} className="text-studio-text hover:text-studio-link">
            {rule.rule_number && <span className="mr-2 font-mono text-[13px] text-studio-link">{rule.rule_number}</span>}
            {rule.title ? <RuleTitle title={rule.title} /> : ruleLabel(rule)}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function RulePage({ params }: Params) {
  const rule = getRule(`rule-${(await params).slug}`);
  if (!rule) notFound();

  const chapter = chapterOf(rule.section_id);
  const section = getSection(rule.section_id)!;
  const ancestors = ancestorsOf(rule);
  const verification = verificationOf(rule.id);
  const cites = [...new Set(rule.cross_references.map((r) => r.target_id).filter((id): id is string => Boolean(id)))];
  const citing = citedBy(rule.id);
  const { previous, next } = neighbours(rule);
  const page = rule.source_page_start;
  const topicTags = topicsOfRule(rule.id);

  // Where this rule sits: chapter › section › parent rules.
  const trail = [
    { href: chapterHref(chapter.id), label: chapterLabel(chapter) },
    ...(section.level === 2 ? [{ href: chapterHref(chapter.id, section.id), label: `${section.number} ${section.title}` }] : []),
    ...ancestors.map((a) => ({ href: ruleHref(a.id), label: ruleLabel(a) })),
  ];

  return (
    <div className="text-studio-text">
      <PageHeader
        href={ruleHref(rule.id)}
        back={{ href: chapterHref(chapter.id, rule.id), label: chapterLabel(chapter) }}
        title={ruleLabel(rule)}
        actions={
          <Link href={searchHref()} className="hover:text-studio-link">
            Search the Law
          </Link>
        }
        kicker={[
          <span key="file" className="normal-case tracking-normal text-studio-text">root.law</span>,
          rule.rule_type === "glossary" ? "Glossary" : rule.rule_type === "sub-rule" ? "Sub-rule" : "Rule",
          `PDF p. ${rule.source_page_end !== page ? `${page}–${rule.source_page_end}` : page}`,
        ]}
      >
        <nav aria-label="Where this rule is" className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-studio-muted">
          {trail.map((item, index) => (
            <span key={item.href} className="inline-flex items-center gap-1.5">
              {index > 0 && <span aria-hidden>›</span>}
              <Link href={item.href} className="hover:text-studio-link">
                {item.label}
              </Link>
            </span>
          ))}
        </nav>
      </PageHeader>

      <div className="max-w-3xl">
        {ancestors.length > 0 && (
          <Panel title={ancestors.length > 1 ? "Parent rules" : "Parent rule"}>
            <div className="space-y-3 rounded-lg border border-studio-border bg-white/[0.02] p-4 text-[14.5px] leading-relaxed">
              {ancestors.map((a) => (
                <div key={a.id}>
                  <Link href={ruleHref(a.id)} className="font-mono text-[13px] text-studio-link hover:underline">
                    {a.rule_number}
                  </Link>{" "}
                  {a.title && (
                    <span className="font-semibold text-studio-bright">
                      <RuleTitle title={a.title} />
                    </span>
                  )}
                  {a.text && <RuleText text={a.text} references={a.cross_references} className="mt-1 text-studio-text/90" />}
                </div>
              ))}
            </div>
          </Panel>
        )}

        <section aria-label="Rule text" className="mt-8 rounded-lg border border-studio-border bg-studio-chrome/60 p-5 text-[16px] leading-[1.7] sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-studio-muted">
            <span>Rule text</span>
            <span aria-hidden className="h-3 w-px bg-studio-border" />
            <span className="normal-case tracking-normal">
              {SOURCE.title}, {SOURCE.printed_date}
            </span>
            <PageLink rule={rule} className="ml-auto normal-case tracking-normal" />
          </div>
          {/* The record and its sub-rules, as in the book. Its own number is the page title. */}
          <RuleEntry rule={rule} heading={false} markers={false} />
        </section>

        {rule.layout_flags?.includes("inline-icon") && (
          <p className="mt-3 text-[13px] text-studio-muted">
            This rule&apos;s title in the PDF contains an icon that can&apos;t be shown here. See{" "}
            <a href={pdfPageHref(page)} target="_blank" rel="noopener noreferrer" className="text-studio-link hover:underline">
              page {page}
            </a>
            .
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[12px] text-studio-muted">
          <Link href={chapterHref(chapter.id, rule.id)} className="hover:text-studio-link">
            Read in context
          </Link>
          <a href={pdfPageHref(page)} target="_blank" rel="noopener noreferrer" className="hover:text-studio-link">
            Open PDF page {page} ↗
          </a>
          <CopyLinkButton className="hover:text-studio-link" />
          <span className="ml-auto">
            {verification.status === "verified" ? (
              <span title={verification.review.method} className="text-[#7fc490]">
                ✓ Text checked against the PDF ({verification.review.date})
              </span>
            ) : (
              <span title="Extracted from the PDF automatically. It passes automated checks but hasn't been compared by hand.">
                Extracted automatically, not checked by hand
              </span>
            )}
          </span>
        </div>

        {topicTags.length > 0 && (
          <Panel title="Topics">
            <div className="flex flex-wrap items-center gap-2">
              {topicTags.map((topic) => (
                <Link
                  key={topic.id}
                  href={topicHref(topic.id)}
                  className="rounded-full border border-studio-border bg-studio-chrome px-2.5 py-0.5 text-[13px] text-studio-text hover:border-studio-muted hover:text-studio-bright"
                >
                  {topic.name}
                </Link>
              ))}
              <span className="text-[12px] text-studio-muted">
                Editorial grouping, not part of the Law
                {topicTags.some((t) => t.status !== "reviewed") && " (draft)"}
              </span>
            </div>
          </Panel>
        )}

        {rule.faction_markers.length > 0 && (
          <Panel title="Faction icons on this rule">
            <p className="mb-3 text-[14px] leading-relaxed">
              The Law prints these factions&apos; icons on this rule. In its words, faction icons “mark rules modified by
              Faction Rules and Abilities sections”: check that faction&apos;s chapter for how it changes this rule.
            </p>
            <div className="flex flex-wrap gap-2">
              {rule.faction_markers.map((id) => (
                <FactionChip key={id} id={id} />
              ))}
            </div>
          </Panel>
        )}

        {cites.length > 0 && (
          <Panel title="Rules this rule cites">
            <ul className="space-y-1.5">
              {cites.map((id) => (
                <li key={id}>
                  <Link href={targetHref(id)} className="text-studio-text hover:text-studio-link">
                    {targetLabel(id)}
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {citing.length > 0 && (
          <Panel title="Cited by">
            <RuleLinkList rules={citing} />
          </Panel>
        )}

        <nav aria-label="Neighbouring rules" className="mt-10 grid gap-3 border-t border-studio-border pt-5 sm:grid-cols-2">
          {previous ? (
            <Link href={ruleHref(previous.id)} className="rounded-lg border border-studio-border p-3 hover:border-studio-muted">
              <span className="block font-mono text-[11px] text-studio-muted">← Previous in the Law</span>
              <span className="text-studio-bright">{ruleLabel(previous)}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={ruleHref(next.id)} className="rounded-lg border border-studio-border p-3 text-right hover:border-studio-muted">
              <span className="block font-mono text-[11px] text-studio-muted">Next in the Law →</span>
              <span className="text-studio-bright">{ruleLabel(next)}</span>
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
