import CaseHeader from "@/components/CaseHeader";
import { sectionMetadata } from "@/lib/metadata";

export const metadata = sectionMetadata("board");

export default function BoardPage() {
  return (
    <div>
      <CaseHeader projectId="board" />
      <div className="space-y-3 font-mono text-sm text-cream/60">
        <p>&gt; shared links list: not started</p>
        <p>&gt; notes/scratchpad: not started</p>
      </div>
    </div>
  );
}
