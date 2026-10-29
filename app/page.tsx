import ClubhouseRoom from "@/components/clubhouse/ClubhouseRoom";

export default function HomePage() {
  return (
    <div className="relative">
      <div className="mb-5 text-center sm:mb-6">
        <h1 className="font-display text-4xl italic text-cream sm:text-5xl">welcome to the clubhouse</h1>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-cream/55">
          everything in here leads somewhere — click or tap to poke around
        </p>
      </div>

      <ClubhouseRoom />
    </div>
  );
}
