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
        <Link href="/sports" className="scrap cutout">
          <span className="scrap-cut-c block bg-cream px-5 py-2 font-mono text-[10px] uppercase tracking-widest text-ink">
            ← Back to Sports Lab
          </span>
        </Link>
      </div>

      <StandingsPool />
    </div>
  );
}
