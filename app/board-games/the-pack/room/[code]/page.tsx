import PageHeader from "@/components/PageHeader";
import ThePackRoom from "@/components/the-pack/ThePackRoom";

export default async function ThePackRoomPage({ params }: { params: Promise<{ code: string }> }) {
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
