import Link from "next/link";
import StandingsPool from "@/components/sports/nba-standings/StandingsPool";

export const metadata = {
  title: "Gradey Dick Fan Club Predictions",
  description: "Seven friends predict the NBA standings, scored live against the real table.",
};

export default function NbaStandingsPage() {
  return (
    <div className="mx-auto max-w-5xl pb-10">
      <div className="mb-8">
        <Link
          href="/sports"
          className="inline-block font-mono text-xs uppercase tracking-widest text-white/40 hover:text-sports-accent"
        >
          &larr; Back to Sports Lab
        </Link>
      </div>

      <StandingsPool />
    </div>
  );
}
