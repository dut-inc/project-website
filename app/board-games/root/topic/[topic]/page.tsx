import { notFound } from "next/navigation";
import { RootPage, TableLink } from "@/components/root/ui";
import { EditorialNote, ViaLabel } from "@/components/root/Editorial";
import RuleCard, { GroupHeading } from "@/components/root/RuleCard";
import { FactionChip } from "@/components/root/RuleEntry";
import { pageMetadata } from "@/lib/metadata";
import { chapterOf, factions } from "@/lib/root/law";
import { TOPICS_HREF, searchHref, topicHref } from "@/lib/root/paths";
import { getTopic, groupMembers, topicMembers, topics, type Member } from "@/lib/root/topics";

type Params = { params: Promise<{ topic: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return topics().map((topic) => ({ topic: topic.id }));
}

export async function generateMetadata({ params }: Params) {
  const topic = getTopic((await params).topic);
  if (!topic) return {};
  return pageMetadata(topicHref(topic.id), { title: `${topic.name} · Root`, description: topic.description });
}

function Cards({ members }: { members: Member[] }) {
  return (
    <div className="max-w-3xl space-y-4 text-[15.5px] leading-[1.7]">
      {members.map(({ rule, via }) => (
        <RuleCard key={rule.id} rule={rule} note={<ViaLabel via={via} />} />
      ))}
    </div>
  );
}

export default async function TopicPage({ params }: Params) {
  const topic = getTopic((await params).topic);
  if (!topic) notFound();

  const { top } = topicMembers(topic.id);
  const groups = groupMembers(top);

  return (
    <RootPage
      back={{ href: TOPICS_HREF, label: "Topics" }}
      title={topic.name}
      actions={<TableLink href={searchHref({ topic: topic.id })}>Search this topic</TableLink>}
    >
      <p className="-mt-2 mb-5 max-w-2xl text-[15px] italic text-root-muted">{topic.description}</p>

      <EditorialNote status={topic.status} />

      {groups.map((group) => (
        <section key={group.key} className="mb-14">
          <GroupHeading id={group.key} title={group.label} count={group.members.length} />
          {group.key === "faction" ? (
            <div className="space-y-10">
              {factions()
                .map((faction) => ({
                  faction,
                  members: group.members.filter((m) => chapterOf(m.rule.section_id).faction_id === faction.id),
                }))
                .filter(({ members }) => members.length > 0)
                .map(({ faction, members }) => (
                  <div key={faction.id}>
                    <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-root-ink">
                      <FactionChip id={faction.id} />
                      {faction.name}
                    </h3>
                    <Cards members={members} />
                  </div>
                ))}
            </div>
          ) : (
            <Cards members={group.members} />
          )}
        </section>
      ))}
    </RootPage>
  );
}
