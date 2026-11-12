import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import ChapterBody, { verificationNote } from "@/components/root/ChapterBody";
import { StatusBadge } from "@/components/root/Editorial";
import RuleCard, { GroupHeading, RuleLinks } from "@/components/root/RuleCard";
import SearchBox from "@/components/root/SearchBox";
import { RuleTitle } from "@/components/root/RuleText";
import { RootPage, TableLink } from "@/components/root/ui";
import { pageMetadata } from "@/lib/metadata";
import { factionStyle } from "@/lib/root/factionStyle";
import { abilitiesSection, rulesModifiedBy, rulesNaming, type Mention } from "@/lib/root/factions";
import {
  SOURCE,
  allRules,
  chapterLabel,
  chapterOf,
  factions,
  getFaction,
  pageRange,
  ruleLabel,
  rulesInChapter,
  sectionsOf,
  verificationOf,
} from "@/lib/root/law";
import { LAW_HREF, askHref, chapterHref, factionHref, pdfPageHref, ruleHref, searchHref, topicHref } from "@/lib/root/paths";
import { generalRulesFor } from "@/lib/root/topics";

type Params = { params: Promise<{ faction: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return factions().map((faction) => ({ faction: faction.id }));
}

export async function generateMetadata({ params }: Params) {
  const faction = getFaction((await params).faction);
  if (!faction) return {};
  return pageMetadata(factionHref(faction.id), {
    title: `${faction.name} · Root`,
    description: `The ${faction.name}'s rules from the Law of Root (${SOURCE.printed_date}), the general rules that apply to it, and the rules elsewhere that it changes or that name it.`,
  });
}

function MentionList({ mentions }: { mentions: Mention[] }) {
  // Grouped by chapter, in book order.
  const groups = new Map<string, Mention[]>();
  for (const m of mentions) {
    const id = chapterOf(m.rule.section_id).id;
    groups.set(id, [...(groups.get(id) ?? []), m]);
  }
  return (
    <div className="max-w-3xl space-y-6">
      {[...groups].map(([chapterId, items]) => (
        <section key={chapterId}>
          <h3 className="mb-2 text-[13px] font-semibold text-root-ink">
            <Link href={chapterHref(chapterId)} className="hover:text-root-link">
              {chapterLabel(chapterOf(chapterId))}
            </Link>
          </h3>
          <ul className="space-y-3">
            {items.map(({ rule, excerpt }) => (
              <li key={rule.id} className="text-[14px] leading-relaxed">
                <Link href={ruleHref(rule.id)} className="text-root-ink2 hover:text-root-link">
                  {rule.rule_number && <span className="mr-2 font-rootlabel text-[13px] text-root-link">{rule.rule_number}</span>}
                  {rule.title ? <RuleTitle title={rule.title} /> : ruleLabel(rule)}
                </Link>
                <p className="mt-0.5 text-root-muted">
                  {excerpt.before}
                  <mark className="rounded-sm bg-root-ochre/25 px-0.5 text-root-ink">{excerpt.match}</mark>
                  {excerpt.after}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 flex flex-wrap items-center gap-2 text-[15px] font-semibold text-root-ink">{children}</h3>;
}

export default async function FactionPage({ params }: Params) {
  const faction = getFaction((await params).faction);
  if (!faction) notFound();

  const chapter = chapterOf(faction.chapter_section_id);
  const sections = sectionsOf(chapter.id);
  const records = rulesInChapter(chapter.id);
  const { start, end } = pageRange(records);
  const { color } = factionStyle(faction.id);
  const abilities = abilitiesSection(faction.id);
  const general = generalRulesFor(faction.id);
  const modified = rulesModifiedBy(faction.id);
  const mentions = rulesNaming(faction.id);
  const verified = records.filter((r) => verificationOf(r.id).status === "verified").length;

  const nav = [
    { href: "#general", label: "General rules that apply", count: general.cited.length + general.topics.length + general.extras.length },
    { href: "#changes", label: `Rules the ${faction.name} changes`, count: modified.length },
    { href: "#named", label: "Named elsewhere", count: mentions.length },
  ];

  return (
    <RootPage
      back={{ href: LAW_HREF, label: "Lawbook" }}
      title={
        <span className="inline-flex items-center gap-3">
          <span aria-hidden className="root-pip !h-6 !w-6" style={{ "--c": color } as CSSProperties} />
          {faction.name}
        </span>
      }
      meta={
        <>
          Chapter {chapter.number} ·{" "}
          <a href={pdfPageHref(start)} target="_blank" rel="noopener noreferrer" className="hover:text-root-cream">
            {start === end ? `PDF p. ${start}` : `PDF pp. ${start}–${end}`}
          </a>
          {faction.expansion && <> · {faction.expansion}</>}
        </>
      }
      actions={<TableLink href={askHref(faction.id)}>Ask as the {factionStyle(faction.id).short}</TableLink>}
    >

      <div className="mb-8">
        <SearchBox
          ids={allRules().map((r) => r.id)}
          faction={faction.id}
          label={`Search the ${faction.name}'s rules`}
          placeholder="A word, a phrase, or a rule number"
        />
        <p className="mt-1.5 text-[12px] text-root-muted">
          Covers this page&apos;s faction rules, the rules it changes and the rules that name it.{" "}
          <Link href={searchHref()} className="text-root-link hover:underline">
            Search all rules
          </Link>
        </p>
      </div>

      <nav aria-label="On this page" className="mb-10 rounded-lg border border-root-line bg-root-ink/[0.025] p-4">
        <h2 className="mb-2 root-kicker">On this page</h2>
        <ol className="space-y-2 text-[14px]">
          <li>
            <a href="#faction-rules" className="font-semibold text-root-ink hover:text-root-link">
              Faction rules
            </a>
            <span className="text-root-muted"> · chapter {chapter.number}</span>
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 pl-4 text-[13px]">
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="hover:text-root-link">
                    <span className="font-rootlabel text-root-muted">{section.number}</span> {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </li>
          {nav.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="font-semibold text-root-ink hover:text-root-link">
                {item.label}
              </a>
              <span className="text-root-muted"> · {item.count}</span>
            </li>
          ))}
        </ol>
      </nav>

      <GroupHeading id="faction-rules" title="Faction rules">
        From{" "}
        <Link href={chapterHref(chapter.id)} className="text-root-link hover:underline">
          {chapterLabel(chapter)}
        </Link>
        , in book order. {verificationNote(verified, records.length, "chapter")}
      </GroupHeading>
      <ChapterBody chapter={chapter} headingLevel={3} />

      <section className="mt-14">
        <GroupHeading id="general" title="General rules that apply">
          Rules outside the {faction.name}&apos;s chapter that its own rules rely on.
        </GroupHeading>
        <div className="max-w-3xl space-y-8 text-[14px] leading-relaxed">
          {general.cited.length > 0 && (
            <div>
              <SubHeading>
                Cited by its rules
                <span className="font-rootlabel text-[10px] font-normal uppercase tracking-[0.12em] text-root-muted">from the Law</span>
              </SubHeading>
              <p className="mb-2 text-root-muted">The {faction.name}&apos;s chapter refers to these rules by number.</p>
              <RuleLinks rules={general.cited} />
            </div>
          )}

          {general.topics.length > 0 && (
            <div>
              <SubHeading>By topic</SubHeading>
              <p className="mb-3 text-root-muted">
                Editorial: where the {faction.name} has its own rule on a topic (such as a Battle action), the general rules for
                that topic apply as well. Not part of the Law.
              </p>
              <ul className="space-y-4">
                {general.topics.map(({ topic, factionRules, general: rules }) => (
                  <li key={topic.id} className="rounded-lg border border-root-line bg-root-ink/[0.025] p-3">
                    <p className="flex flex-wrap items-center gap-2">
                      <Link href={topicHref(topic.id)} className="font-semibold text-root-ink hover:text-root-link">
                        {topic.name}
                      </Link>
                      <StatusBadge status={topic.status} />
                    </p>
                    <p className="mt-1 text-[13px] text-root-muted">
                      Because of{" "}
                      {factionRules.map((r, i) => (
                        <span key={r.id}>
                          {i > 0 && ", "}
                          <Link href={ruleHref(r.id)} className="text-root-link hover:underline">
                            {r.rule_number ?? ruleLabel(r)}
                          </Link>
                        </span>
                      ))}
                    </p>
                    <div className="mt-2">
                      <RuleLinks rules={rules} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {general.extras.map((extra) => (
            <div key={extra.section.id}>
              <SubHeading>
                <Link href={chapterHref(extra.section.id)} className="hover:text-root-link">
                  {chapterLabel(extra.section)}
                </Link>
                <StatusBadge status={extra.status} />
              </SubHeading>
              <p className="text-root-muted">Editorial: {extra.reason}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <GroupHeading id="changes" title={`Rules the ${faction.name} changes`} count={modified.length}>
          {modified.length > 0 ? (
            <>
              The Law prints the {faction.name} icon on these rules. Its key says faction icons “mark rules modified by
              Faction Rules and Abilities sections”, so{" "}
              {abilities ? (
                <Link href={chapterHref(chapter.id, abilities.id)} className="text-root-link hover:underline">
                  {abilities.number} {abilities.title}
                </Link>
              ) : (
                "this faction's chapter"
              )}{" "}
              says how.
            </>
          ) : (
            <>The Law doesn&apos;t print the {faction.name} icon on any rule outside its own chapter.</>
          )}
        </GroupHeading>
        {modified.length > 0 && (
          <div className="max-w-3xl space-y-4 text-[15.5px] leading-[1.7]">
            {modified.map((rule) => (
              <RuleCard key={rule.id} rule={rule} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-14">
        <GroupHeading id="named" title="Named elsewhere" count={mentions.length}>
          Other rules whose text names the {faction.name}, found by matching its name. A rule that names the faction
          doesn&apos;t necessarily change how it plays: read the rule.
        </GroupHeading>
        {mentions.length > 0 ? (
          <MentionList mentions={mentions} />
        ) : (
          <p className="text-[14px] text-root-muted">No other rule names this faction.</p>
        )}
      </section>
    </RootPage>
  );
}
