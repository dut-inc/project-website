import PageHeader from "@/components/PageHeader";
import ConservationMap from "@/components/conservation/ConservationMap";
import { pageMetadata } from "@/lib/metadata";

const DESCRIPTION = "shared geotagged map of animal sightings that we see";

export const metadata = pageMetadata("/conservation/sightings", { description: DESCRIPTION });

export default function ConservationSightingsPage() {
  return (
    <div>
      <PageHeader href="/conservation/sightings" description={DESCRIPTION} />
      <ConservationMap />
    </div>
  );
}
