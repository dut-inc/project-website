import { rulesIn, sectionsOf, type Section } from "@/lib/root/law";
import RuleEntry from "./RuleEntry";

// A chapter's text in book order: its introduction, then each section with its
// rules (sub-rules nest inside their parent). Used by the chapter page and the
// faction page. Section headings are anchors (#section-6-2).

function topLevel(sectionId: string) {
  return rulesIn(sectionId).filter((rule) => !rule.parent_rule_id);
}

export default function ChapterBody({ chapter, headingLevel = 2 }: { chapter: Section; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const intro = topLevel(chapter.id);
  return (
    <div className="max-w-3xl text-[15.5px] leading-[1.7]">
      {intro.length > 0 && (
        <div className="mb-10 space-y-5">
          {intro.map((rule) => (
            <RuleEntry key={rule.id} rule={rule} />
          ))}
        </div>
      )}

      {sectionsOf(chapter.id).map((section) => (
        <section key={section.id} id={section.id} className="mb-12 scroll-mt-28">
          <Heading
            className={`mb-4 flex items-baseline gap-3 border-b border-studio-border pb-2 font-display text-studio-bright ${
              headingLevel === 2 ? "text-2xl" : "text-xl"
            }`}
          >
            <span className="font-mono text-base text-studio-muted">{section.number}</span>
            {section.title}
          </Heading>
          <div className="space-y-6">
            {topLevel(section.id).map((rule) => (
              <RuleEntry key={rule.id} rule={rule} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function verificationNote(verified: number, total: number, scope: string): string {
  if (verified === total) return `Every entry in this ${scope} has been checked by hand against the PDF.`;
  if (verified > 0)
    return `${verified} of ${total} entries in this ${scope} have been checked by hand against the PDF. The rest were extracted automatically.`;
  return `This ${scope}'s text was extracted from the PDF automatically and hasn't been checked by hand.`;
}

export function SectionNav({ sections, label = "In this chapter" }: { sections: Section[]; label?: string }) {
  return (
    <nav aria-label={label} className="mb-8 rounded-lg border border-studio-border bg-white/[0.02] p-4">
      <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-studio-muted">{label}</h2>
      <ul className="grid gap-x-6 gap-y-1 text-[14px] sm:grid-cols-2">
        {sections.map((section) => (
          <li key={section.id}>
            <a href={`#${section.id}`} className="hover:text-studio-link">
              <span className="font-mono text-studio-muted">{section.number}</span> {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
