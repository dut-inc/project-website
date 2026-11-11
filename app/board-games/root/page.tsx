import Link from "next/link";
import PageHeader, { HeaderLink } from "@/components/PageHeader";
import SearchBox from "@/components/root/SearchBox";
import { pageMetadata } from "@/lib/metadata";
import { factionStyle } from "@/lib/root/factionStyle";
import {
  SOURCE,
  allRules,
  chapterGroup,
  chapters,
  getFaction,
  pageRange,
  rulesInChapter,
  sectionsOf,
  verificationOf,
  type Section,
} from "@/lib/root/law";
import { CONNECT_HREF, LAW_PDF_HREF, ROOT_HREF, TOPICS_HREF, chapterHref, factionHref, topicHref } from "@/lib/root/paths";
import { topics } from "@/lib/root/topics";

const DESCRIPTION = `Every rule in the Law of Root (${SOURCE.printed_date}), in book order. Search it, or open any rule by its number.`;

export const metadata = pageMetadata(ROOT_HREF, { description: DESCRIPTION });

function pagesLabel(chapter: Section) {
  const { start, end } = pageRange(rulesInChapter(chapter.id));
  return start === end ? `p. ${start}` : `pp. ${start}–${end}`;
}

function ChapterCard({ chapter }: { chapter: Section }) {
  const sections = sectionsOf(chapter.id);
  return (
    <li className="rounded-lg border border-studio-border bg-white/[0.02] p-4">
      <Link href={chapterHref(chapter.id)} className="group flex items-baseline gap-3">
        <span className="w-7 shrink-0 font-mono text-sm text-studio-muted">{chapter.number ?? "·"}</span>
        <span className="font-semibold text-studio-bright group-hover:text-studio-link">{chapter.title}</span>
        <span className="ml-auto shrink-0 font-mono text-[11px] text-studio-muted">{pagesLabel(chapter)}</span>
      </Link>
      {sections.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 pl-10 text-[13px]">
          {sections.map((section) => (
            <li key={section.id}>
              <Link href={chapterHref(chapter.id, section.id)} className="text-studio-text hover:text-studio-link">
                <span className="font-mono text-studio-muted">{section.number}</span> {section.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-studio-muted">{title}</h2>
      {children}
    </section>
  );
}

export default function RootEncyclopediaPage() {
  const all = chapters();
  const core = all.filter((c) => chapterGroup(c) === "core");
  const factionChapters = all.filter((c) => chapterGroup(c) === "faction");
  const appendices = all.filter((c) => chapterGroup(c) === "appendix");
  const rules = allRules();
  const verified = rules.filter((r) => verificationOf(r.id).status === "verified").length;

  return (
    <div className="text-studio-text">
      <PageHeader
        href={ROOT_HREF}
        meta={[`Law of Root · ${SOURCE.printed_date}`, `${rules.length} entries`]}
        description={DESCRIPTION}
        actions={
          <>
            <Link href={CONNECT_HREF} className="hover:text-studio-link">
              Use with your AI
            </Link>
            <HeaderLink href={LAW_PDF_HREF}>Law PDF</HeaderLink>
          </>
        }
      />

      <SearchBox ids={rules.map((r) => r.id)} />

      <Group title="Core rules">
        <ul className="grid gap-3">
          {core.map((chapter) => (
            <ChapterCard key={chapter.id} chapter={chapter} />
          ))}
        </ul>
      </Group>

      <Group title="Factions">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {factionChapters.map((chapter) => {
            const faction = getFaction(chapter.faction_id!);
            const { color } = factionStyle(chapter.faction_id!);
            return (
              <li key={chapter.id}>
                <Link
                  href={factionHref(chapter.faction_id!)}
                  className="group flex h-full items-start gap-3 rounded-lg border border-studio-border bg-white/[0.02] p-4 transition-colors hover:border-studio-muted"
                >
                  <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <span className="min-w-0">
                    <span className="block font-semibold text-studio-bright group-hover:text-studio-link">
                      {faction?.name ?? chapter.title}
                    </span>
                    <span className="mt-0.5 block font-mono text-[11px] text-studio-muted">
                      Chapter {chapter.number} · {pagesLabel(chapter)}
                      {faction?.expansion && <> · {faction.expansion.replace(/^The /, "")}</>}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Group>

      <Group title="Topics">
        <p className="mb-3 text-[13px] text-studio-muted">
          Rules grouped by subject.{" "}
          <Link href={TOPICS_HREF} className="text-studio-link hover:underline">
            All topics
          </Link>{" "}
          · an editorial grouping, not part of the Law.
        </p>
        <ul className="flex flex-wrap gap-2">
          {topics().map((topic) => (
            <li key={topic.id}>
              <Link
                href={topicHref(topic.id)}
                className="inline-flex rounded-full border border-studio-border bg-white/[0.02] px-3 py-1 text-[14px] text-studio-text hover:border-studio-muted hover:text-studio-bright"
              >
                {topic.name}
              </Link>
            </li>
          ))}
        </ul>
      </Group>

      <Group title="Appendices">
        <ul className="grid gap-3">
          {appendices.map((chapter) => (
            <ChapterCard key={chapter.id} chapter={chapter} />
          ))}
        </ul>
      </Group>

      <footer className="mt-12 space-y-2 border-t border-studio-border pt-5 text-[13px] leading-relaxed text-studio-muted">
        <p>
          Rule text: <em>The Law of Root</em> ({SOURCE.printed_date}) by Leder Games. This is an unofficial
          reference. Every entry links to its page in the{" "}
          <a href={LAW_PDF_HREF} target="_blank" rel="noopener noreferrer" className="text-studio-link hover:underline">
            original PDF
          </a>
          .
        </p>
        <p>
          The text was extracted from the PDF automatically. {verified} of {rules.length} entries have also been checked
          by hand against it; each rule page says which.
        </p>
      </footer>
    </div>
  );
}
