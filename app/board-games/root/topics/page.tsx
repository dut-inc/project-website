import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { EditorialNote, StatusBadge } from "@/components/root/Editorial";
import { pageMetadata } from "@/lib/metadata";
import { ROOT_HREF, TOPICS_HREF, topicHref } from "@/lib/root/paths";
import { editorialStatus, topicMembers, topics } from "@/lib/root/topics";

const DESCRIPTION = "Rules from across the Law grouped by subject: battle, movement, crafting, scoring and more.";

export const metadata = pageMetadata(TOPICS_HREF, { title: "Topics · Root", description: DESCRIPTION });

export default function TopicsPage() {
  const { drafted, reviewed } = editorialStatus();
  return (
    <div className="text-studio-text">
      <PageHeader href={TOPICS_HREF} back={{ href: ROOT_HREF, label: "root.law" }} title="Topics" description={DESCRIPTION} />

      <EditorialNote status={reviewed === drafted ? "reviewed" : "draft"}>
        <p>
          Topics are not part of the Law. An editor grouped the rules; each topic page says why every rule is there.
          {reviewed === drafted ? " The project owner has reviewed them." : ` ${reviewed} of ${drafted} groupings have been reviewed so far.`}
        </p>
      </EditorialNote>

      <ul className="grid max-w-4xl gap-3 sm:grid-cols-2">
        {topics().map((topic) => (
          <li key={topic.id}>
            <Link
              href={topicHref(topic.id)}
              className="group flex h-full flex-col rounded-lg border border-studio-border bg-white/[0.02] p-4 transition-colors hover:border-studio-muted"
            >
              <span className="flex items-center gap-2">
                <span className="font-semibold text-studio-bright group-hover:text-studio-link">{topic.name}</span>
                <span className="font-mono text-[11px] text-studio-muted">{topicMembers(topic.id).all.length}</span>
                <span className="ml-auto">
                  <StatusBadge status={topic.status} />
                </span>
              </span>
              <span className="mt-1 text-[13px] leading-relaxed text-studio-muted">{topic.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
