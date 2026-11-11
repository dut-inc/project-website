import Link from "next/link";
import { chapterOf, getSection } from "@/lib/root/law";
import { chapterHref } from "@/lib/root/paths";
import type { TopicStatus, Via } from "@/lib/root/topics";

// Marks editorial groupings (topics, "general rules that apply") so they are
// never mistaken for rule text, and says whether the owner has reviewed them.

export function StatusBadge({ status }: { status: TopicStatus }) {
  return status === "reviewed" ? (
    <span className="inline-flex items-center rounded-full border border-root-ok/50 px-2 py-0.5 root-kicker text-root-ok">
      Reviewed
    </span>
  ) : (
    <span
      title="Drafted by the editor; the project owner hasn't reviewed it yet."
      className="inline-flex items-center rounded-full border border-root-ochre/60 px-2 py-0.5 root-kicker text-root-ochre"
    >
      Draft
    </span>
  );
}

export function EditorialNote({ status, children }: { status: TopicStatus; children?: React.ReactNode }) {
  return (
    <div className="mb-8 max-w-3xl rounded-lg border border-dashed border-root-line px-4 py-3 text-[13px] leading-relaxed text-root-muted">
      <div className="mb-1 flex items-center gap-2">
        <span className="root-kicker text-root-ink2">Editorial grouping</span>
        <StatusBadge status={status} />
      </div>
      {children ?? (
        <p>
          This grouping is not part of the Law. It collects rules that an editor judged relevant;
          {status === "reviewed" ? " the project owner has reviewed it." : " it hasn't been reviewed yet."}{" "}
          The rule text itself is the Law&apos;s.
        </p>
      )}
    </div>
  );
}

// Why a rule is in a topic.
export function ViaLabel({ via }: { via: Via }) {
  const base = "text-[11px] text-root-muted";
  if (via.kind === "editor") return <p className={`${base} italic`}>Editor: {via.reason}</p>;
  if (via.kind === "title") return <p className={base}>Title contains “{via.term}”</p>;
  const section = getSection(via.sectionId);
  if (!section) return null;
  const chapter = chapterOf(section.id);
  return (
    <p className={base}>
      Whole section:{" "}
      <Link href={chapterHref(chapter.id, section.level === 2 ? section.id : undefined)} className="hover:text-root-link">
        {section.number ? `${section.number} ` : ""}
        {section.title}
      </Link>
    </p>
  );
}
