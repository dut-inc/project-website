import { RootPage, TableLink } from "@/components/root/ui";
import AdvancedDraft from "@/components/root/AdvancedDraft";
import { setupStepsByFaction } from "@/components/root/FactionSetupSteps";
import { pageMetadata } from "@/lib/metadata";
import { DRAFT_HREF, ROOT_HREF, SETUP_HREF } from "@/lib/root/paths";
import { factionSetups, reachTable } from "@/lib/root/setup";

const DESCRIPTION = "The Advanced Setup faction draft (Law A.8), dealt on screen: the pool, the lock, who chooses when, and each faction's setup as it's chosen.";

export const metadata = pageMetadata(DRAFT_HREF, { title: "Advanced setup draft · Root", description: DESCRIPTION });

export default function DraftPage() {
  const factions = factionSetups();
  const { thresholds, adventurous } = reachTable();
  return (
    <RootPage
      back={{ href: ROOT_HREF, label: "Root Assistant" }}
      title="Advanced setup draft"
      actions={<TableLink href={SETUP_HREF}>Setup & reach</TableLink>}
    >
      <div className="max-w-3xl">
        <AdvancedDraft
          factions={factions}
          table={{ thresholds, adventurous }}
          steps={setupStepsByFaction(factions.map((f) => f.id))}
        />
      </div>
    </RootPage>
  );
}
