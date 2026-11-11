import PageHeader from "@/components/PageHeader";
import CreateOrJoinRoom from "@/components/the-pack/CreateOrJoinRoom";
import { pageMetadata } from "@/lib/metadata";
import { getProject } from "@/lib/projects";

export const metadata = pageMetadata("/board-games/the-pack", { description: getProject("the-pack").summary });

export default function ThePackPage() {
  return (
    <div>
      <PageHeader href="/board-games/the-pack" description={getProject("the-pack").summary} />
      <CreateOrJoinRoom />
    </div>
  );
}
