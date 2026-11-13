import PageHeader from "@/components/PageHeader";
import DoomScatter from "@/components/sports/doom-score/DoomScatter";
import { pageMetadata } from "@/lib/metadata";
import type { DoomTeam } from "@/lib/sports/doomScore";
import data from "@/data/sports/doom-score-teams.json";

const DESCRIPTION = "doom score vs. winning percentage for every NBA, NHL, NFL, MLB and WNBA team";

export const metadata = pageMetadata("/sports/doom-score", { description: DESCRIPTION });

export default function DoomScorePage() {
  return (
    <div>
      <PageHeader
        href="/sports/doom-score"
        description={DESCRIPTION}
        meta={["sample data"]}
      />
      <DoomScatter teams={data.teams as DoomTeam[]} />
    </div>
  );
}
