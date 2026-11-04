import PageHeader from "@/components/PageHeader";
import DleGameShell from "@/components/dle/DleGameShell";
import GenshinDle from "@/components/dle/GenshinDle";
import WuwaDle from "@/components/dle/WuwaDle";
import { DLE_GAMES, getDleGame } from "@/lib/dleGames";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return DLE_GAMES.map((game) => ({ slug: game.slug }));
}

export default async function DleGamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getDleGame(slug);

  if (!game) notFound();

  return (
    <div>
      <PageHeader href={`/dle/${game.slug}`} title={game.title} meta={[game.world]} description={game.description} />
      {game.slug === "genshin-impact" ? (
        <GenshinDle />
      ) : game.slug === "wuthering-waves" ? (
        <WuwaDle />
      ) : (
        <DleGameShell game={game} />
      )}
    </div>
  );
}
