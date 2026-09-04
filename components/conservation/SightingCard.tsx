import Image from "next/image";
import { CATEGORY_META, type Sighting } from "@/lib/sightings";

export default function SightingCard({
  sighting,
  selected,
  onSelect,
}: {
  sighting: Sighting;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const meta = CATEGORY_META[sighting.category];

  return (
    <button
      type="button"
      onClick={() => onSelect(sighting.id)}
      className={`group w-full rounded-xl border bg-cream p-3 text-left shadow-[0_6px_14px_rgba(0,0,0,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_18px_rgba(0,0,0,0.3)] ${
        selected ? "border-pinNavy ring-2 ring-pinNavy" : "border-ink/10"
      }`}
      aria-pressed={selected}
    >
      <div className="relative h-20 w-full overflow-hidden rounded-lg bg-ink/5">
        <Image
          src={sighting.photo}
          alt={`${sighting.species} photo`}
          fill
          sizes="16rem"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="mt-2.5 flex items-start justify-between gap-2">
        <h3 className="font-display text-base leading-tight text-ink">{sighting.species}</h3>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-cream"
          style={{ backgroundColor: meta.color }}
        >
          {meta.label}
        </span>
      </div>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink2">
        {sighting.location}
      </p>
      <p className="mt-1 text-xs italic leading-snug text-ink/75">“{sighting.note}”</p>
      <p className="mt-1.5 font-mono text-[10px] text-ink2">
        {sighting.date} · {sighting.observer}
      </p>
    </button>
  );
}
