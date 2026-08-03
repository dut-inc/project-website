import FishCard from "./FishCard";
import FishIcon from "./FishIcon";
import { FISHES } from "@/lib/fishQuiz";

export default function FishIntro({ onStart }: { onStart: () => void }) {
  return (
    <FishCard>
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink2">
        Case 001 · personality profile
      </p>
      <h2 className="mt-2 font-display text-3xl italic text-ink sm:text-4xl">
        Which Pacific Northwest fish are you?
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-ink/80">
        Six questions, one very important answer. The water&apos;s fine — and
        there&apos;s no wrong way to be a fish.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2" aria-hidden>
        {FISHES.map((f) => (
          <span
            key={f.id}
            title={f.name}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 ring-1 ring-ink/10"
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
