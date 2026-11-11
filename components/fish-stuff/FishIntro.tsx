import FishCard from "./FishCard";
import FishIcon from "./FishIcon";
import { FISHES } from "@/lib/fishStuff";

export default function FishIntro({ onStart }: { onStart: () => void }) {
  return (
    <FishCard>
      <div className="flex flex-wrap items-center gap-2" aria-hidden>
        {FISHES.map((f) => (
          <span
            key={f.id}
            title={f.name}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10"
          >
            <FishIcon variant={f.id} className="h-5 w-8" />
          </span>
        ))}
      </div>

      <button
        onClick={onStart}
        className="mt-8 min-h-11 inline-flex items-center gap-2 rounded-full bg-pinTeal px-6 py-3 font-mono text-xs uppercase tracking-widest text-cream transition-all hover:-translate-y-0.5 hover:bg-[#3A9284] hover:shadow-lg"
      >
        Take the quiz &rarr;
      </button>
    </FishCard>
  );
}