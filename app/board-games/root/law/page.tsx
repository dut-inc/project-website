import Link from "next/link";
import type { CSSProperties } from "react";
import SearchBox from "@/components/root/SearchBox";
import { InkHeading, RootPage, TableLink } from "@/components/root/ui";
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
import { LAW_HREF, LAW_PDF_HREF, ROOT_HREF, TOPICS_HREF, chapterHref, factionHref, topicHref } from "@/lib/root/paths";
import { topics } from "@/lib/root/topics";

// The lawbook's contents, set like a printed table of contents: chapter,
// dotted leader, page. The dashboard (/board-games/root) links here.

export const metadata = pageMetadata(LAW_HREF, {
  title: "The Law of Root",
  description: `Every rule in the Law of Root (${SOURCE.printed_date}), in book order. Search it, or open any rule by its number.`,
});

function pagesLabel(chapter: Section) {
  const { start, end } = pageRange(rulesInChapter(chapter.id));
  return start === end ? `${start}` : `${start}–${end}`;
}

// "Golden Rules ........ 2–3"
function ContentsLine({ chapter }: { chapter: Section }) {
  const sections = sectionsOf(chapter.id);
  return (
    <li className="py-1.5">
      <Link href={chapterHref(chapter.id)} className="group flex items-baseline gap-2">
        <span className="w-6 shrink-0 font-rootlabel text-[15px] text-root-muted">{chapter.number ?? "❧"}</span>
        <span className="font-rootdisplay text-[1.2rem] leading-snug text-root-ink group-hover:text-root-link">{chapter.title}</span>
        <span aria-hidden className="mx-1 min-w-6 flex-1 translate-y-[-0.3em] border-b-2 border-dotted border-root-muted/35" />
        <span className="shrink-0 font-rootlabel text-[14px] text-root-muted">{pagesLabel(chapter)}</span>
      </Link>
      {sections.length > 0 && (
        <ul className="mt-0.5 flex flex-wrap gap-x-3.5 gap-y-0.5 pl-8 text-[14px]">
          {sections.map((section) => (
            <li key={section.id}>
              <Link href={chapterHref(chapter.id, section.id)} className="text-root-ink2 hover:text-root-link hover:underline">
                <span className="font-rootlabel text-root-muted">{section.number}</span> {section.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function LawbookPage() {
  const all = chapters();
  const core = all.filter((c) => chapterGroup(c) === "core");
  const factionChapters = all.filter((c) => chapterGroup(c) === "faction");
  const appendices = all.filter((c) => chapterGroup(c) === "appendix");
  const rules = allRules();
  const verified = rules.filter((r) => verificationOf(r.id).status === "verified").length;

  return (
    <RootPage
      back={{ href: ROOT_HREF, label: "Root Assistant" }}
      title="The Law of Root"
      actions={
        <TableLink href={LAW_PDF_HREF} external>
          PDF
        </TableLink>
      }
    >
      <SearchBox ids={rules.map((r) => r.id)} label="Find a rule" />

      <div className="mt-9 grid gap-x-12 gap-y-9 lg:grid-cols-2">
        <section>
          <InkHeading>Core rules</InkHeading>
          <ol className="mt-3">
            {core.map((chapter) => (
              <ContentsLine key={chapter.id} chapter={chapter} />
            ))}
          </ol>
        </section>

        <section>
          <InkHeading>Factions</InkHeading>
          <ul className="mt-3">
            {factionChapters.map((chapter) => {
              const faction = getFaction(chapter.faction_id!);
              return (
                <li key={chapter.id} className="py-1">
                  <Link href={factionHref(chapter.faction_id!)} className="group flex items-baseline gap-2">
                    <span className="w-6 shrink-0 font-rootlabel text-[15px] text-root-muted">{chapter.number}</span>
                    <span
                      aria-hidden
                      className="root-pip self-center"
                      style={{ "--c": factionStyle(chapter.faction_id!).color } as CSSProperties}
                    />
                    <span className="font-rootdisplay text-[1.2rem] leading-snug text-root-ink group-hover:text-root-link">
                      {faction?.name ?? chapter.title}
                    </span>
                    <span aria-hidden className="mx-1 min-w-6 flex-1 translate-y-[-0.3em] border-b-2 border-dotted border-root-muted/35" />
                    <span className="shrink-0 font-rootlabel text-[14px] text-root-muted">{pagesLabel(chapter)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <InkHeading>Appendices</InkHeading>
          <ol className="mt-3">
            {appendices.map((chapter) => (
              <ContentsLine key={chapter.id} chapter={chapter} />
            ))}
          </ol>
        </section>

        <section>
          <InkHeading>Topics</InkHeading>
          <p className="mt-2 text-[14px] italic text-root-muted">Our own grouping, not part of the Law.</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {topics().map((topic) => (
              <li key={topic.id}>
                <Link href={topicHref(topic.id)} className="root-token !pl-2.5">
                  {topic.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href={TOPICS_HREF} className="inline-flex px-2 py-1 text-[14px] text-root-link hover:underline">
                All topics →
              </Link>
            </li>
          </ul>
        </section>
      </div>

      <footer className="mt-12 border-t border-root-line pt-4 text-center text-[13px] italic leading-relaxed text-root-muted">
        Rule text from <span className="not-italic">The Law of Root</span> by Leder Games; an unofficial reference. Extracted
        from the PDF automatically; {verified} of {rules.length} entries also checked by hand.
      </footer>
    </RootPage>
  );
}
