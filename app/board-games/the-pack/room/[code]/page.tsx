import ThePackRoom from "@/components/the-pack/ThePackRoom";

export default async function ThePackRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <ThePackRoom code={code} />;
}
