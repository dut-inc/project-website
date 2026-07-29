import CaseHeader from "@/components/CaseHeader";

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
      <div className="mx-auto mt-10 max-w-xl space-y-3 font-mono text-sm text-cream/60">
        <p>&gt; species ID model: shared with Fish Quiz (case 001)</p>
        <p>&gt; shared sighting map: not started</p>
        <p>&gt; weekly digest agent: not started</p>
      </div>
    </div>
  );
}
