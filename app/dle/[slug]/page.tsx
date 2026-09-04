import DleGameShell from "@/components/dle/DleGameShell";
import GenshinDle from "@/components/dle/GenshinDle";
import { DLE_GAMES, getDleGame } from "@/lib/dleGames";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return DLE_GAMES.map((game) => ({ slug: game.slug }));
}

export default async function DleGamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getDleGame(slug);

  if (!game) notFound();

  if (game.slug === "genshin-impact") return <GenshinDle />;

  return <DleGameShell game={game} />;
}
