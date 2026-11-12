import { Suspense } from "react";
import { RootPage } from "@/components/root/ui";
import RootSearch from "@/components/root/RootSearch";
import { pageMetadata } from "@/lib/metadata";
import { factionStyle } from "@/lib/root/factionStyle";
import { SOURCE, factions } from "@/lib/root/law";
import { LAW_HREF, searchHref } from "@/lib/root/paths";
import { buildSearchIndex, chapterOptions, topicOptions } from "@/lib/root/searchIndex";

const DESCRIPTION = `Search every rule in the Law of Root (${SOURCE.printed_date}) by number, word or phrase.`;

export const metadata = pageMetadata(searchHref(), { title: "Search · Root", description: DESCRIPTION });

export default function RootSearchPage() {
  // Built once at build time and sent with the page; searching runs in the browser.
  const index = buildSearchIndex();
  const factionOptions = factions().map((f) => ({ id: f.id, name: f.name, color: factionStyle(f.id).color }));

  return (
    <RootPage back={{ href: LAW_HREF, label: "Lawbook" }} title="Search the Law">
      <Suspense fallback={<p className="text-root-muted">Loading search…</p>}>
        <RootSearch index={index} factions={factionOptions} chapters={chapterOptions()} topics={topicOptions()} />
      </Suspense>
    </RootPage>
  );
}
