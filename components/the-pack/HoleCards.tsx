import PlayingCard from "./PlayingCard";
import type { Card } from "@/lib/thePack";

export default function HoleCards({ cards }: { cards: Card[] | null }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-shelf-ink/60">Your hand</p>
      <div className="mt-2 flex gap-2">
        {cards ? (
          cards.map((card, i) => <PlayingCard key={`${card}-${i}`} card={card} />)
        ) : (
          <>
            <PlayingCard faceDown />
            <PlayingCard faceDown />
          </>
        )}
      </div>
    </div>
  );
}
