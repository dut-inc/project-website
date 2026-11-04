import PageHeader from "@/components/PageHeader";
import SportsDashboard from "@/components/sports/dashboard/SportsDashboard";

export default function SportsDashboardPage() {
  return (
    <div>
      <PageHeader
        href="/sports/dashboard"
        title="Seattle Sports Center"
        description="a hub for seattle sports data and live game tracking"
      />
      <SportsDashboard />
    </div>
  );
}
