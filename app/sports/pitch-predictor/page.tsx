import Link from "next/link";
import PitchSimulator from "@/components/sports/pitch-predictor/PitchSimulator";
import { pitchPlayerData } from "@/lib/sports/pitchPlayers.ts";

const GITHUB_URL =
  "https://github.com/l0stpanda/sports-analytics-portfolio/tree/main/baseball/pitch-prediction";

export default function PitchPredictorPage() {
  return (
    <div className="-mx-4 -mt-6 min-h-[80vh] bg-sports-bg px-4 pb-24 pt-10 sm:-mx-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/sports"
            className="inline-block font-mono text-xs uppercase tracking-widest text-white/40 hover:text-sports-accent"
          >
            &larr; Back to Sports Lab
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-white/40 hover:text-sports-accent"
          >
            GitHub <span aria-hidden>↗</span>
          </a>
        </div>

        <div className="mb-10 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-sports-accent/80">
            MLB next-pitch model · xgboost v1 · 2026 Statcast rosters
          </p>
          <h1 className="mt-3 font-sign text-5xl font-bold uppercase leading-none tracking-tight text-white sm:text-7xl">
            Behind the Plate
          </h1>
        </div>

        <PitchSimulator pitchers={pitchPlayerData.pitchers} batters={pitchPlayerData.batters} />
      </div>
    </div>
  );
}
