import PlayingCard from "./PlayingCard";
import type { Card } from "@/lib/thePack";

export default function CommunityCards({ cards }: { cards: Card[] }) {
  const slots = Array.from({ length: 5 }, (_, i) => cards[i] ?? null);

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-shelf-ink/60">Community cards</p>
      <div className="mt-2 flex gap-2">
        {slots.map((card, i) => (
          <PlayingCard key={i} card={card ?? undefined} faceDown={!card} />
        ))}
      </div>
    </div>
  );
}
