import Link from "next/link";
import CaseHeader from "@/components/CaseHeader";
import SportsDashboard from "@/components/sports/dashboard/SportsDashboard";

export default function SportsPage() {
  return (
    <div>
      <CaseHeader
        caseNumber="002"
        title="Seattle Sports Dashboard"
        status="ACTIVE"
        pin="gold"
        description="Every major Seattle pro team on one board — live scores, schedules, standings, and season stats. Rendered through a frontend TeamService that currently serves mock data and will swap to Supabase when the backend lands."
      />
      <SportsDashboard />
      <div className="mt-10 border-t border-white/5 pt-6 text-center font-mono text-[11px] uppercase tracking-widest text-cream/40">
        <Link href="/sports/offensive-profiles" className="transition-colors hover:text-pinGold">
          basketball &amp; baseball analytics →
        </Link>
      </div>
    </div>
  );
}
