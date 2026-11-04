import PageHeader from "@/components/PageHeader";
import ThePackRoom from "@/components/the-pack/ThePackRoom";
import { pageMetadata } from "@/lib/metadata";
import { getProject } from "@/lib/projects";

type Params = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Params) {
  const { code } = await params;
  return pageMetadata(`/board-games/the-pack/room/${code}`, { description: getProject("the-pack").summary });
}

export default async function ThePackRoomPage({ params }: Params) {
  const { code } = await params;
  return (
    <div>
      <PageHeader
        href={`/board-games/the-pack/room/${code}`}
        back={{ href: "/board-games/the-pack", label: "the-pack.deal" }}
      />
      <ThePackRoom code={code} />
    </div>
  );
}
