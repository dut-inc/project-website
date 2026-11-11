import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import RootSearch from "@/components/root/RootSearch";
import { pageMetadata } from "@/lib/metadata";
import { factionStyle } from "@/lib/root/factionStyle";
import { SOURCE, factions } from "@/lib/root/law";
import { ROOT_HREF, searchHref } from "@/lib/root/paths";
import { buildSearchIndex, chapterOptions, topicOptions } from "@/lib/root/searchIndex";

const DESCRIPTION = `Search every rule in the Law of Root (${SOURCE.printed_date}) by number, word or phrase.`;

export const metadata = pageMetadata(searchHref(), { title: "Search · Root", description: DESCRIPTION });

export default function RootSearchPage() {
  // Built once at build time and sent with the page; searching runs in the browser.
  const index = buildSearchIndex();
  const factionOptions = factions().map((f) => ({ id: f.id, name: f.name, color: factionStyle(f.id).color }));

  return (
    <div className="text-studio-text">
      <PageHeader
        href={searchHref()}
        back={{ href: ROOT_HREF, label: "root.law" }}
        title="Search the Law"
        meta={[`Law of Root · ${SOURCE.printed_date}`]}
      />
      <Suspense fallback={<p className="text-studio-muted">Loading search…</p>}>
        <RootSearch index={index} factions={factionOptions} chapters={chapterOptions()} topics={topicOptions()} />
      </Suspense>
    </div>
  );
}
