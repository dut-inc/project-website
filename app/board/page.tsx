import CaseHeader from "@/components/CaseHeader";

export default function BoardPage() {
  return (
    <div>
      <CaseHeader
        caseNumber="004"
        title="Loose Ends"
        status="OPEN"
        pin="red"
        description="The catch-all — shared links, notes, and whatever doesn't need its own case file yet."
      />
      <div className="mx-auto mt-10 max-w-xl space-y-3 font-mono text-sm text-cream/60">
        <p>&gt; shared links list: not started</p>
        <p>&gt; notes/scratchpad: not started</p>
      </div>
    </div>
  );
}
