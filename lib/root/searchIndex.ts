// Builds the search index the search page sends to the browser. Server only.

import { rulesModifiedBy, rulesNaming } from "./factions.ts";
import { allRules, chapterGroup, chapterLabel, chapterOf, childrenOf, chapters, factions, type Rule } from "./law.ts";
import { plainText } from "./markup.ts";
import type { IndexRecord } from "./search.ts";
import { topics, topicsOfRule } from "./topics.ts";

// Every record a faction's page lists: its chapter, the rules printed with its
// icon (with their sub-rules, which the page shows inside them), and the rules
// that name it. Search "within a faction" means within this set.
export function factionScopes(): Map<string, Set<string>> {
  const scopes = new Map<string, Set<string>>();
  const add = (factionId: string, rule: Rule) => {
    const set = scopes.get(factionId) ?? new Set<string>();
    set.add(rule.id);
    scopes.set(factionId, set);
  };
  const withDescendants = (factionId: string, rule: Rule) => {
    add(factionId, rule);
    childrenOf(rule.id).forEach((child) => withDescendants(factionId, child));
  };
  for (const faction of factions()) {
    for (const rule of allRules()) if (chapterOf(rule.section_id).faction_id === faction.id) add(faction.id, rule);
    rulesModifiedBy(faction.id).forEach((rule) => withDescendants(faction.id, rule));
    rulesNaming(faction.id).forEach(({ rule }) => add(faction.id, rule));
  }
  return scopes;
}

export function buildSearchIndex(): IndexRecord[] {
  const scopes = factionScopes();
  return allRules().map((rule) => ({
    id: rule.id,
    number: rule.rule_number,
    title: rule.title ? plainText(rule.title.replace(/\{icon\}/g, "icon")) : rule.rule_type === "chapter-text" ? "Introduction" : "",
    text: plainText(rule.text),
    chapterId: chapterOf(rule.section_id).id,
    core: chapterGroup(chapterOf(rule.section_id)) === "core",
    factionScope: [...scopes].filter(([, ids]) => ids.has(rule.id)).map(([id]) => id),
    topics: topicsOfRule(rule.id).map((t) => t.id),
    page: rule.source_page_start,
    order: rule.order,
    type: rule.rule_type,
  }));
}

export type ChapterOption = { id: string; label: string; group: "core" | "faction" | "appendix" };

export function topicOptions(): { id: string; name: string }[] {
  return topics().map((t) => ({ id: t.id, name: t.name }));
}

export function chapterOptions(): ChapterOption[] {
  return chapters().map((c) => ({ id: c.id, label: chapterLabel(c), group: chapterGroup(c) }));
}
