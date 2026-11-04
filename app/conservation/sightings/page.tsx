import PageHeader from "@/components/PageHeader";
import ConservationMap from "@/components/conservation/ConservationMap";

export default function ConservationSightingsPage() {
  return (
    <div>
      <PageHeader href="/conservation/sightings" description="shared geotagged map of animal sightings that we see" />
      <ConservationMap />
    </div>
  );
}
