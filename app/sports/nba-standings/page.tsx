import Link from "next/link";
import StandingsPool from "@/components/sports/nba-standings/StandingsPool";

export const metadata = {
  title: "Gradey Dick Fan Club Predictions",
  description: "Seven friends predict the NBA standings, scored live against the real table.",
};

export default function NbaStandingsPage() {
  return (
    <div className="mx-auto max-w-5xl pb-10">
      <div className="mb-6 inline-block -rotate-1">
        <Link
          href="/sports"
          className="inline-block rounded-[6px_3px_8px_4px] border-2 border-ink/70 bg-cream px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-ink shadow-[3px_3px_0_rgba(0,0,0,0.4)] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_rgba(0,0,0,0.4)]"
        >
          ← Back to Sports Lab
        </Link>
      </div>

      <StandingsPool />
    </div>
  );
}
