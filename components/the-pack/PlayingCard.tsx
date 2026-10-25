import { parseCard, type Card, type Suit } from "@/lib/thePack";

const SUIT_GLYPH: Record<Suit, string> = {
  S: "♠",
  H: "♥",
  D: "♦",
  C: "♣",
};

const SUIT_NAME: Record<Suit, string> = {
  S: "spades",
  H: "hearts",
  D: "diamonds",
  C: "clubs",
};

const RANK_LABEL: Record<string, string> = { T: "10" };
const RED_SUITS = new Set<Suit>(["H", "D"]);

export type PlayingCardProps = {
  card?: Card;
  faceDown?: boolean;
  size?: "sm" | "md";
};

export default function PlayingCard({ card, faceDown = false, size = "md" }: PlayingCardProps) {
  const dimensionClass = size === "sm" ? "w-12 sm:w-14" : "w-16 sm:w-20";

  if (faceDown || !card) {
    return (
      <div
        className={`aspect-[5/7] ${dimensionClass} rounded-[0.5rem] border-2 border-shelf-paperDark/60 bg-shelf-walnut/40`}
        aria-hidden
      />
    );
  }

  const { rank, suit } = parseCard(card);
  const glyph = SUIT_GLYPH[suit];
  const rankLabel = RANK_LABEL[rank] ?? rank;
  const color = RED_SUITS.has(suit) ? "#9f302f" : "#29201c";

  return (
    <div
      className={`relative aspect-[5/7] ${dimensionClass} overflow-hidden rounded-[0.5rem] border-2 border-shelf-paperDark/70 bg-[#f4ead6] shadow-[0_3px_0_-1px_rgba(38,24,15,0.85),0_6px_10px_rgba(0,0,0,0.35),inset_0_0_0_1px_rgba(255,255,255,0.72)]`}
      role="img"
      aria-label={`${rankLabel} of ${SUIT_NAME[suit]}`}
    >
      <span className="absolute left-1 top-0.5 font-mono text-xs font-bold leading-none sm:text-sm" style={{ color }}>
        {rankLabel}
      </span>
      <span className="absolute left-1 top-4 font-serif text-xs leading-none sm:top-5 sm:text-sm" style={{ color }} aria-hidden>
        {glyph}
      </span>
      <span className="absolute inset-0 flex items-center justify-center font-serif text-2xl sm:text-3xl" style={{ color }} aria-hidden>
        {glyph}
      </span>
      <span className="absolute bottom-0.5 right-1 rotate-180 font-mono text-xs font-bold leading-none sm:text-sm" style={{ color }}>
        {rankLabel}
      </span>
    </div>
  );
}
