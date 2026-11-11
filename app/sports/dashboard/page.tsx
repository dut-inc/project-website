import PageHeader from "@/components/PageHeader";
import SportsDashboard from "@/components/sports/dashboard/SportsDashboard";
import { pageMetadata } from "@/lib/metadata";

const DESCRIPTION = "a hub for seattle sports data and live game tracking";

export const metadata = pageMetadata("/sports/dashboard", { description: DESCRIPTION, title: "Seattle Sports Center" });

export default function SportsDashboardPage() {
  return (
    <div>
      <PageHeader
        href="/sports/dashboard"
        title="Seattle Sports Center"
        description={DESCRIPTION}
      />
      <SportsDashboard />
    </div>
  );
}
