import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ChapterBody, { verificationNote } from "@/components/root/ChapterBody";
import { StatusBadge } from "@/components/root/Editorial";
import RuleCard, { GroupHeading, RuleLinks } from "@/components/root/RuleCard";
import SearchBox from "@/components/root/SearchBox";
import { RuleTitle } from "@/components/root/RuleText";
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
import { ROOT_HREF, chapterHref, factionHref, pdfPageHref, ruleHref, searchHref, topicHref } from "@/lib/root/paths";
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
          <h3 className="mb-2 text-[13px] font-semibold text-studio-bright">
            <Link href={chapterHref(chapterId)} className="hover:text-studio-link">
              {chapterLabel(chapterOf(chapterId))}
            </Link>
          </h3>
          <ul className="space-y-3">
            {items.map(({ rule, excerpt }) => (
              <li key={rule.id} className="text-[14px] leading-relaxed">
                <Link href={ruleHref(rule.id)} className="text-studio-text hover:text-studio-link">
                  {rule.rule_number && <span className="mr-2 font-mono text-[13px] text-studio-link">{rule.rule_number}</span>}
                  {rule.title ? <RuleTitle title={rule.title} /> : ruleLabel(rule)}
                </Link>
                <p className="mt-0.5 text-studio-muted">
                  {excerpt.before}
                  <mark className="rounded-sm bg-[#c9a66b]/20 px-0.5 text-studio-bright">{excerpt.match}</mark>
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
  return <h3 className="mb-2 flex flex-wrap items-center gap-2 text-[15px] font-semibold text-studio-bright">{children}</h3>;
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
    <div className="text-studio-text">
      <PageHeader
        href={factionHref(faction.id)}
        back={{ href: ROOT_HREF, label: "root.law" }}
        title={faction.name}
        meta={[
          `Chapter ${chapter.number}`,
          <a key="pages" href={pdfPageHref(start)} target="_blank" rel="noopener noreferrer" className="hover:text-studio-link">
            {start === end ? `PDF p. ${start}` : `PDF pp. ${start}–${end}`}
          </a>,
          ...(faction.expansion ? [faction.expansion] : []),
        ]}
        description={`The ${faction.name}'s own rules, the general rules that apply to it, and the rules elsewhere that it changes or that name it.`}
      >
        <div aria-hidden className="mt-4 h-1 w-16 rounded-full" style={{ backgroundColor: color }} />
      </PageHeader>

      <div className="mb-8">
        <SearchBox
          ids={allRules().map((r) => r.id)}
          faction={faction.id}
          label={`Search the ${faction.name}'s rules`}
          placeholder="A word, a phrase, or a rule number"
        />
        <p className="mt-1.5 text-[12px] text-studio-muted">
          Covers this page&apos;s faction rules, the rules it changes and the rules that name it.{" "}
          <Link href={searchHref()} className="text-studio-link hover:underline">
            Search all rules
          </Link>
        </p>
      </div>

      <nav aria-label="On this page" className="mb-10 rounded-lg border border-studio-border bg-white/[0.02] p-4">
        <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-studio-muted">On this page</h2>
        <ol className="space-y-2 text-[14px]">
          <li>
            <a href="#faction-rules" className="font-semibold text-studio-bright hover:text-studio-link">
              Faction rules
            </a>
            <span className="text-studio-muted"> · chapter {chapter.number}</span>
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 pl-4 text-[13px]">
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="hover:text-studio-link">
                    <span className="font-mono text-studio-muted">{section.number}</span> {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </li>
          {nav.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="font-semibold text-studio-bright hover:text-studio-link">
                {item.label}
              </a>
              <span className="text-studio-muted"> · {item.count}</span>
            </li>
          ))}
        </ol>
      </nav>

      <GroupHeading id="faction-rules" title="Faction rules">
        From{" "}
        <Link href={chapterHref(chapter.id)} className="text-studio-link hover:underline">
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
                <span className="font-mono text-[10px] font-normal uppercase tracking-[0.12em] text-studio-muted">from the Law</span>
              </SubHeading>
              <p className="mb-2 text-studio-muted">The {faction.name}&apos;s chapter refers to these rules by number.</p>
              <RuleLinks rules={general.cited} />
            </div>
          )}

          {general.topics.length > 0 && (
            <div>
              <SubHeading>By topic</SubHeading>
              <p className="mb-3 text-studio-muted">
                Editorial: where the {faction.name} has its own rule on a topic (such as a Battle action), the general rules for
                that topic apply as well. Not part of the Law.
              </p>
              <ul className="space-y-4">
                {general.topics.map(({ topic, factionRules, general: rules }) => (
                  <li key={topic.id} className="rounded-lg border border-studio-border bg-white/[0.02] p-3">
                    <p className="flex flex-wrap items-center gap-2">
                      <Link href={topicHref(topic.id)} className="font-semibold text-studio-bright hover:text-studio-link">
                        {topic.name}
                      </Link>
                      <StatusBadge status={topic.status} />
                    </p>
                    <p className="mt-1 text-[13px] text-studio-muted">
                      Because of{" "}
                      {factionRules.map((r, i) => (
                        <span key={r.id}>
                          {i > 0 && ", "}
                          <Link href={ruleHref(r.id)} className="text-studio-link hover:underline">
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
                <Link href={chapterHref(extra.section.id)} className="hover:text-studio-link">
                  {chapterLabel(extra.section)}
                </Link>
                <StatusBadge status={extra.status} />
              </SubHeading>
              <p className="text-studio-muted">Editorial: {extra.reason}</p>
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
                <Link href={chapterHref(chapter.id, abilities.id)} className="text-studio-link hover:underline">
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
          <p className="text-[14px] text-studio-muted">No other rule names this faction.</p>
        )}
      </section>
    </div>
  );
}
