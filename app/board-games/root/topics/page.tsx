import Link from "next/link";
import { RootPage } from "@/components/root/ui";
import { EditorialNote, StatusBadge } from "@/components/root/Editorial";
import { pageMetadata } from "@/lib/metadata";
import { LAW_HREF, TOPICS_HREF, topicHref } from "@/lib/root/paths";
import { editorialStatus, topicMembers, topics } from "@/lib/root/topics";

const DESCRIPTION = "Rules from across the Law grouped by subject: battle, movement, crafting, scoring and more.";

export const metadata = pageMetadata(TOPICS_HREF, { title: "Topics · Root", description: DESCRIPTION });

export default function TopicsPage() {
  const { drafted, reviewed } = editorialStatus();
  return (
    <RootPage back={{ href: LAW_HREF, label: "Lawbook" }} title="Topics">

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
              className="group flex h-full flex-col rounded-lg border border-root-line bg-root-ink/[0.025] p-4 transition-colors hover:border-root-muted"
            >
              <span className="flex items-center gap-2">
                <span className="font-semibold text-root-ink group-hover:text-root-link">{topic.name}</span>
                <span className="font-rootlabel text-[11px] text-root-muted">{topicMembers(topic.id).all.length}</span>
                <span className="ml-auto">
                  <StatusBadge status={topic.status} />
                </span>
              </span>
              <span className="mt-1 text-[13px] leading-relaxed text-root-muted">{topic.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </RootPage>
  );
}
