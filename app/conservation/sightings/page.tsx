import Link from "next/link";
import ConservationMap from "@/components/conservation/ConservationMap";

export default function ConservationSightingsPage() {
  return (
    <div>
      <Link
        href="/conservation"
        className="mb-6 inline-block font-mono text-xs uppercase tracking-widest text-cream/50 hover:text-pinGold"
      >
        &larr; Back to Nature and Conservation
      </Link>
      <ConservationMap />
    </div>
  );
}