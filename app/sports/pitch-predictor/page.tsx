import PageHeader, { HeaderLink } from "@/components/PageHeader";
import PitchSimulator from "@/components/sports/pitch-predictor/PitchSimulator";
import { pitchPlayerData } from "@/lib/sports/pitchPlayers.ts";
import { pageMetadata } from "@/lib/metadata";

const DESCRIPTION = "predicting an MLB pitcher's next pitch";

export const metadata = pageMetadata("/sports/pitch-predictor", { description: DESCRIPTION, title: "Behind the Plate" });

const GITHUB_URL =
  "https://github.com/l0stpanda/sports-analytics-portfolio/tree/main/baseball/pitch-prediction";

export default function PitchPredictorPage() {
  return (
    <div className="pb-8">
      <PageHeader
        href="/sports/pitch-predictor"
        title="Behind the Plate"
        meta={["MLB next-pitch model", "xgboost v1", "2026 Statcast rosters"]}
        description={DESCRIPTION}
        actions={<HeaderLink href={GITHUB_URL}>GitHub</HeaderLink>}
      />

      <PitchSimulator pitchers={pitchPlayerData.pitchers} batters={pitchPlayerData.batters} />
    </div>
  );
}
