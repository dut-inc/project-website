import CaseHeader from "@/components/CaseHeader";

export default function BoardPage() {
  return (
    <div>
      <CaseHeader
        caseNumber="004"
        title="The Board"
        status="OPEN"
        description="The catch-all — shared links, notes, and whatever doesn't need its own case file yet."
      />
      <div className="space-y-4 font-mono text-sm text-paper2">
        <p>&gt; shared links list: not started</p>
        <p>&gt; notes/scratchpad: not started</p>
      </div>
    </div>
  );
}
