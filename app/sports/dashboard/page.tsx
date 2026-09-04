import Link from "next/link";
import SportsDashboard from "@/components/sports/dashboard/SportsDashboard";

export default function SportsDashboardPage() {
  return (
    <div>
      <Link
        href="/sports"
        className="mb-6 inline-block font-mono text-xs uppercase tracking-widest text-cream/50 hover:text-pinGold"
      >
        &larr; Back to Sports Lab
      </Link>
      <SportsDashboard />
    </div>
  );
}
