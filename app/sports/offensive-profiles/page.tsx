import PageHeader, { HeaderLink } from "@/components/PageHeader";
import PlayerSearchModern from "@/components/sports/PlayerSearchModern";
import { archetypeData } from "@/lib/archetypes";
import { pageMetadata } from "@/lib/metadata";

const DESCRIPTION = "search an NBA player to see their offensive profile";

export const metadata = pageMetadata("/sports/offensive-profiles", { description: DESCRIPTION, title: "Offensive Profiles" });

export default function OffensiveProfilesPage() {
  return (
    <div className="pb-8">
      <PageHeader
        href="/sports/offensive-profiles"
        title="Offensive Profiles"
        meta={[`Season ${archetypeData.season}`, `${archetypeData.players.length} players`]}
        description={DESCRIPTION}
        actions={<HeaderLink href="https://github.com/l0stpanda/sports-analytics-portfolio">GitHub</HeaderLink>}
      >
        {archetypeData.sample && (
          <p className="mt-4 w-fit rounded-full border border-sports-accent/30 bg-sports-accent/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest text-sports-accent">
            Sample data — run the notebook against a real season to replace this
          </p>
        )}
      </PageHeader>

      <PlayerSearchModern players={archetypeData.players} />
    </div>
  );
}
