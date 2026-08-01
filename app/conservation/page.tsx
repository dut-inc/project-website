import CaseHeader from "@/components/CaseHeader";
import FieldWatch from "@/components/FieldWatch";

export default function ConservationPage() {
  return (
    <div>
      <CaseHeader
        caseNumber="003"
        title="Field Watch"
        status="PLANNING"
        pin="navy"
        description="A citizen-science log for the group — upload a photo from a hike or fishing trip, get a species ID, watch the shared map fill in."
      />
      <div className="mx-auto mt-8 max-w-xl space-y-3 font-mono text-sm text-cream/60">
        <p>
          &gt; species ID model: v0 stub live (planned handover to a real
          classifier)
        </p>
        <p>&gt; shared sighting map: live · seeded with PNW starter pins</p>
        <p>&gt; weekly digest agent: not started</p>
      </div>
      <div className="mx-auto mt-10 max-w-6xl">
        <FieldWatch />
      </div>
    </div>
  );
}
