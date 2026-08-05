import CaseHeader from "@/components/CaseHeader";
import SportsDashboard from "@/components/sports/dashboard/SportsDashboard";

export default function SportsDashboardPage() {
  return (
    <div>
      <CaseHeader
        caseNumber="002"
        title="Seattle Sports Dashboard"
        status="ACTIVE"
        pin="gold"
        backHref="/sports"
        backLabel="Back to Sports Lab"
        description="Every major Seattle pro team on one board — live scores, schedules, standings, and season stats. Rendered through a frontend TeamService that currently serves mock data and will swap to Supabase when the backend lands."
      />
      <SportsDashboard />
    </div>
  );
}
