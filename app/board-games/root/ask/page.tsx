import RulesChat from "@/components/root/RulesChat";
import { Paper, RootHeader } from "@/components/root/ui";
import { pageMetadata } from "@/lib/metadata";
import { factions } from "@/lib/root/law";
import { ASK_HREF, ROOT_HREF } from "@/lib/root/paths";

export const metadata = pageMetadata(ASK_HREF, {
  title: "Ask the rules · Root",
  description: "Ask a rules question in your own words. The AI looks the answer up in the Law of Root and cites the rules it used.",
});

export default function AskPage() {
  return (
    <div>
      <RootHeader back={{ href: ROOT_HREF, label: "Root Assistant" }} title="Ask the rules" />
      <div className="mx-auto h-[calc(100dvh-var(--ps-titlebar-h)-14rem)] min-h-[28rem] max-w-3xl">
        <Paper className="h-full" innerClassName="h-full px-6 pb-6 pt-8 sm:px-9">
          <RulesChat factions={factions().map((f) => ({ id: f.id, name: f.name }))} />
        </Paper>
      </div>
    </div>
  );
}
