import Pin from "@/components/Pin";

// Shared wrapper for the three quiz steps: a pinned, torn-paper card.
export default function FishCard({
  children,
  ariaLive,
}: {
  children: React.ReactNode;
  ariaLive?: "polite";
}) {
  return (
    <section className="relative mx-auto max-w-2xl" aria-live={ariaLive}>
      <Pin color="teal" />
      <div className="paper-torn animate-fade-up bg-cream p-8 text-ink shadow-[0_14px_28px_-8px_rgba(0,0,0,0.55)] sm:p-10">
        {children}
      </div>
    </section>
  );
}
