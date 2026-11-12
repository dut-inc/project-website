import { RootPage, TableLink } from "@/components/root/ui";
import { setupStepsByFaction } from "@/components/root/FactionSetupSteps";
import SetupHelper from "@/components/root/SetupHelper";
import { pageMetadata } from "@/lib/metadata";
import { DRAFT_HREF, ROOT_HREF, SETUP_HREF } from "@/lib/root/paths";
import { factionSetups, reachTable } from "@/lib/root/setup";

const DESCRIPTION = "Pick the factions in play: check their reach, count militant and insurgent factions, and see who sets up in what order and what each one does.";

export const metadata = pageMetadata(SETUP_HREF, { title: "Setup & reach · Root", description: DESCRIPTION });

export default function SetupPage() {
  const factions = factionSetups();
  const { thresholds, adventurous } = reachTable();
  return (
    <RootPage
      back={{ href: ROOT_HREF, label: "Root Assistant" }}
      title="Setup & reach"
      actions={<TableLink href={DRAFT_HREF}>Advanced setup draft</TableLink>}
    >
      <div className="max-w-3xl">
        <SetupHelper
          factions={factions}
          table={{ thresholds, adventurous }}
          steps={setupStepsByFaction(factions.map((f) => f.id))}
        />
      </div>
    </RootPage>
  );
}
