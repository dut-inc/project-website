// Shared wrapper for the three quiz steps: a subtle translucent panel that
// sits directly on the page background instead of a pinned paper card.
export default function FishCard({
  children,
  ariaLive,
}: {
  children: React.ReactNode;
  ariaLive?: "polite";
}) {
  return (
    <section
      className="mx-auto max-w-2xl animate-fade-up rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-cream sm:p-8"
      aria-live={ariaLive}
    >
      {children}
    </section>
  );
}