import Link from "next/link";
import AdvancedDraft from "@/components/root/AdvancedDraft";
import { setupStepsByFaction } from "@/components/root/FactionSetupSteps";
import RulesChat from "@/components/root/RulesChat";
import SetupHelper from "@/components/root/SetupHelper";
import { Paper, RootHeader, TableLink } from "@/components/root/ui";
import { pageMetadata } from "@/lib/metadata";
import { factions } from "@/lib/root/law";
import { DRAFT_HREF, LAW_HREF, ROOT_HREF, SETUP_HREF } from "@/lib/root/paths";
import { factionSetups, reachTable } from "@/lib/root/setup";

// The Root Assistant dashboard, laid out as papers on a table: the rules chat
// on a tall sheet (left), the advanced setup draft (top right) and the reach
// calculator (bottom right). Wider than the editor's usual max width
// (.ps-wide, app/globals.css). The lawbook is one link away.

export const metadata = pageMetadata(ROOT_HREF, {
  title: "Root Assistant",
  description: "AI help with the rules, advanced setup, and reach calculator.",
});

function SheetTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
      <div>
        <h2 className="font-rootdisplay text-[1.6rem] leading-none text-root-ink">{title}</h2>
        <div className="root-squiggle mt-1.5 w-36" aria-hidden />
      </div>
      <Link href={href} className="pb-0.5 text-[13px] italic text-root-muted hover:text-root-link">
        open on its own page →
      </Link>
    </div>
  );
}

export default function RootAssistant() {
  const setups = factionSetups();
  const { thresholds, adventurous } = reachTable();
  const table = { thresholds, adventurous };
  const steps = setupStepsByFaction(setups.map((f) => f.id));

  return (
    <div className="ps-wide">
      <RootHeader
        back={{ href: "/board-games", label: "Board Games" }}
        title="Root Assistant"
        actions={<TableLink href={LAW_HREF}>The Lawbook</TableLink>}
      />

      <div className="grid gap-9 lg:grid-cols-2 lg:items-start lg:gap-10">
        <div className="h-[78dvh] min-h-[26rem] min-w-0 lg:sticky lg:top-[calc(var(--ps-titlebar-h)+5.5rem)] lg:h-[calc(100dvh-var(--ps-titlebar-h)-15rem)]">
          <Paper edge="a" className="h-full" innerClassName="h-full px-6 pb-6 pt-8 sm:px-8">
            <RulesChat factions={factions().map((f) => ({ id: f.id, name: f.name }))} />
          </Paper>
        </div>

        <div className="min-w-0 space-y-10">
          <Paper edge="b" innerClassName="px-6 pb-8 pt-8 sm:px-8">
            <SheetTitle title="Advanced setup draft" href={DRAFT_HREF} />
            <AdvancedDraft factions={setups} table={table} steps={steps} />
          </Paper>
          <Paper edge="c" innerClassName="px-6 pb-8 pt-8 sm:px-8">
            <SheetTitle title="Reach & setup order" href={SETUP_HREF} />
            <SetupHelper factions={setups} table={table} steps={steps} />
          </Paper>
        </div>
      </div>
    </div>
  );
}
