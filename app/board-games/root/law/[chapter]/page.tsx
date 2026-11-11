import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ChapterBody, { SectionNav, verificationNote } from "@/components/root/ChapterBody";
import { pageMetadata } from "@/lib/metadata";
import { factionStyle } from "@/lib/root/factionStyle";
import {
  SOURCE,
  chapterGroup,
  chapterLabel,
  chapters,
  getFaction,
  pageRange,
  rulesInChapter,
  sectionsOf,
  verificationOf,
  type Section,
} from "@/lib/root/law";
import { ROOT_HREF, chapterHref, chapterSlug, factionHref, pdfPageHref, searchHref } from "@/lib/root/paths";

type Params = { params: Promise<{ chapter: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return chapters().map((chapter) => ({ chapter: chapterSlug(chapter.id) }));
}

function findChapter(slug: string): Section | undefined {
  return chapters().find((chapter) => chapterSlug(chapter.id) === slug);
}

function describe(chapter: Section): string {
  const faction = chapter.faction_id ? getFaction(chapter.faction_id) : undefined;
  const group = chapterGroup(chapter);
  const kind = group === "faction" ? "Faction rules" : group === "appendix" ? "Appendix" : "Core rules";
  return `${kind} from the Law of Root (${SOURCE.printed_date})${faction?.expansion ? `, ${faction.expansion}` : ""}.`;
}

export async function generateMetadata({ params }: Params) {
  const chapter = findChapter((await params).chapter);
  if (!chapter) return {};
  return pageMetadata(chapterHref(chapter.id), { title: `${chapterLabel(chapter)} · Root`, description: describe(chapter) });
}

export default async function ChapterPage({ params }: Params) {
  const chapter = findChapter((await params).chapter);
  if (!chapter) notFound();

  const all = chapters();
  const index = all.findIndex((c) => c.id === chapter.id);
  const previous = all[index - 1];
  const next = all[index + 1];
  const sections = sectionsOf(chapter.id);
  const records = rulesInChapter(chapter.id);
  const { start, end } = pageRange(records);
  const verified = records.filter((r) => verificationOf(r.id).status === "verified").length;
  const faction = chapter.faction_id ? getFaction(chapter.faction_id) : undefined;

  return (
    <div className="text-studio-text">
      <PageHeader
        href={chapterHref(chapter.id)}
        back={{ href: ROOT_HREF, label: "root.law" }}
        title={chapterLabel(chapter)}
        meta={[
          <a key="pages" href={pdfPageHref(start)} target="_blank" rel="noopener noreferrer" className="hover:text-studio-link">
            {start === end ? `PDF p. ${start}` : `PDF pp. ${start}–${end}`}
          </a>,
          ...(chapter.expansion ? [chapter.expansion] : []),
        ]}
        description={describe(chapter)}
        actions={
          <>
            <Link href={searchHref({ chapter: chapter.id })} className="hover:text-studio-link">
              Search this chapter
            </Link>
            {faction && (
              <Link href={factionHref(faction.id)} className="hover:text-studio-link">
                {faction.name} page →
              </Link>
            )}
          </>
        }
      >
        {faction && (
          <div aria-hidden className="mt-4 h-1 w-16 rounded-full" style={{ backgroundColor: factionStyle(faction.id).color }} />
        )}
      </PageHeader>

      {sections.length > 2 && <SectionNav sections={sections} />}

      <ChapterBody chapter={chapter} />

      <p className="mt-8 max-w-3xl text-[13px] text-studio-muted">{verificationNote(verified, records.length, "chapter")}</p>

      <nav aria-label="Chapters" className="mt-6 grid gap-3 border-t border-studio-border pt-5 sm:grid-cols-2">
        {previous ? (
          <Link href={chapterHref(previous.id)} className="rounded-lg border border-studio-border p-3 hover:border-studio-muted">
            <span className="block font-mono text-[11px] text-studio-muted">← Previous</span>
            <span className="text-studio-bright">{chapterLabel(previous)}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={chapterHref(next.id)} className="rounded-lg border border-studio-border p-3 text-right hover:border-studio-muted">
            <span className="block font-mono text-[11px] text-studio-muted">Next →</span>
            <span className="text-studio-bright">{chapterLabel(next)}</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
