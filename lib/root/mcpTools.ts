// The Root rules MCP server's tools, as plain functions returning text, so
// they can be tested without HTTP. app/api/root/mcp/route.ts registers them.
// Read-only: every tool looks up the canonical rule store; nothing is written.
//
// Text conventions for the connecting AI:
// - rule text is the Law's own words; *asterisks* mark the Law's italic
//   reminder text, [boots] marks an item icon, [icon] an icon the PDF shows
//   but the extractor could not read;
// - every rule says whether its text was checked by hand against the PDF;
// - editorial data (topics) is labelled as editorial, never as rule text.

import { abilitiesSection, rulesModifiedBy, rulesNaming } from "./factions.ts";
import {
  SOURCE,
  allRules,
  ancestorsOf,
  chapterLabel,
  chapterOf,
  childrenOf,
  citedBy,
  getFaction,
  getRule,
  getSection,
  rulesIn,
  ruleLabel,
  sectionsOf,
  targetLabel,
  verificationOf,
  type Rule,
} from "./law.ts";
import { chapterHref, LAW_PDF_HREF, factionHref, pdfPageHref, ruleHref, ruleIdFromNumber, topicHref } from "./paths.ts";
import { search, type Filters } from "./search.ts";
import { buildSearchIndex } from "./searchIndex.ts";
import { generalRulesFor, getTopic, topicsOfRule } from "./topics.ts";

export const SERVER_INSTRUCTIONS = `This server gives read-only access to the official rulebook for the board game Root: the Law of Root (${SOURCE.printed_date} edition), stored rule by rule with its printed numbers (e.g. 6.2.3, 4.3.5.II, G.20).

When answering a Root rules question:
1. Look the rules up with these tools before answering. Do not answer Root rules questions from memory or general knowledge; if the tools don't support an answer, say you can't determine it from the Law and give the closest rules you found.
2. Use search_rules to find candidates, then get_rule for the full text of every rule you rely on. Interactions often span several rules: check faction rules (get_faction_rules) and related rules (get_related_rules) too.
3. Cite the exact rule numbers you used, with their links. Prefer short paraphrases with citations over long quotes. Keep the Law's text separate from your interpretation.
4. Each rule says whether its text was checked by hand against the PDF. If your answer depends on a rule that was not, say so briefly (the extraction is automated and passed automated checks, but nobody compared it by hand).
5. Topics are an editorial grouping, not part of the Law. Never cite a topic as a rule.
6. If the question is ambiguous, ask one clarifying question or state your assumption. If rules seem to conflict, show both and explain the interaction without inventing a resolution. The Law's own precedence rule is 1.1.1.
7. This edition has no card text, hireling card text, landmark card text or Clockwork bot rules. Don't claim it does.

Suggested answer shape: Short answer, then Why (how the rules interact), then the rules used (number and title, with links).`;

const INDEX = buildSearchIndex();

// --- Formatting --------------------------------------------------------------

// Stored markup -> text an AI can read: items as [boots], unreadable icons as [icon].
export function forAI(text: string): string {
  return text.replace(/\{item:([a-z]+)\}/g, "[$1]").replace(/\{icon\}/g, "[icon: see the PDF page]");
}

function textStatus(rule: Rule): string {
  return verificationOf(rule.id).status === "verified"
    ? "checked by hand against the PDF"
    : "extracted automatically, not checked by hand";
}

function shortStatus(rule: Rule): string {
  return verificationOf(rule.id).status === "verified" ? "checked" : "not checked by hand";
}

function title(rule: Rule): string {
  return rule.title ? forAI(rule.title) : "";
}

// "6.2.3 Field Hospitals"
function label(rule: Rule): string {
  return forAI(ruleLabel(rule)).replace(/\{icon\}/g, "");
}

function where(rule: Rule): string {
  const chapter = chapterOf(rule.section_id);
  const section = getSection(rule.section_id)!;
  const parts = [chapterLabel(chapter)];
  if (section.level === 2 && section.number !== rule.rule_number) parts.push(`${section.number} ${section.title}`);
  return parts.join(" › ");
}

function pages(rule: Rule): string {
  const { source_page_start: start, source_page_end: end } = rule;
  return start === end ? `p. ${start}` : `pp. ${start}–${end}`;
}

// One rule and its sub-rules, as in the book.
function ruleBlock(rule: Rule, depth = 0, withHeading = true): string {
  const indent = "  ".repeat(depth);
  const lines: string[] = [];
  const numbered = rule.rule_type !== "section-text" && rule.rule_type !== "chapter-text";
  if (withHeading && numbered) lines.push(`${indent}**${rule.rule_number}${rule.title ? ` ${title(rule)}` : ""}**`);
  if (rule.text) lines.push(...forAI(rule.text).split("\n").map((line) => (line ? indent + line : line)));
  if (rule.faction_markers.length) {
    const names = rule.faction_markers.map((id) => getFaction(id)?.name ?? id).join(", ");
    lines.push(`${indent}(Faction icons printed on this rule: ${names})`);
  }
  for (const child of childrenOf(rule.id)) lines.push(ruleBlock(child, depth + 1));
  return lines.join("\n");
}

function absolute(origin: string, path: string): string {
  return `${origin}${path}`;
}

// --- Lookups -------------------------------------------------------------------

// "6.2.3", "4.3.5.II", "G.20", "rule-6-2-3", "4.3" (section text), "6-intro".
export function resolveRule(input: string): Rule | undefined {
  const value = input.trim();
  if (!value) return undefined;
  const direct = getRule(value.startsWith("rule-") ? value : `rule-${value}`);
  if (direct) return direct;
  const byNumber = ruleIdFromNumber(value);
  return byNumber ? getRule(byNumber) : undefined;
}

function notFound(input: string): string {
  return `No rule "${input}" in the Law of Root (${SOURCE.printed_date}). Use search_rules to find the right number. Rule numbers look like 6.2.3, 4.3.5.II, 9.2.9.IIIa or G.20.`;
}

// --- Tools ---------------------------------------------------------------------

export type SearchInput = { query: string; faction?: string; topic?: string; chapter?: string; limit?: number };

export function searchRulesText({ query, faction, topic, chapter, limit = 8 }: SearchInput, origin: string): string {
  const filters: Filters = { faction, topic, chapter: chapter ? normaliseChapter(chapter) : undefined };
  const results = search(INDEX, query, filters);
  const scope = [
    faction && `faction: ${getFaction(faction)?.name ?? faction}`,
    topic && `topic: ${getTopic(topic)?.name ?? topic} (editorial)`,
    filters.chapter && `chapter: ${chapterLabel(getSection(filters.chapter)!)}`,
  ]
    .filter(Boolean)
    .join(", ");
  if (results.length === 0) {
    return `No rules match "${query}"${scope ? ` (${scope})` : ""}. Try fewer or different words, a rule number, or drop the filters.`;
  }
  const shown = results.slice(0, Math.max(1, Math.min(limit, 25)));
  const lines = [
    `${results.length} result${results.length === 1 ? "" : "s"} for "${query}"${scope ? ` (${scope})` : ""}${results.length > shown.length ? `; showing the first ${shown.length}` : ""}. Call get_rule for the full text before relying on any of them.`,
    "",
  ];
  shown.forEach(({ record }, i) => {
    const rule = getRule(record.id)!;
    lines.push(`${i + 1}. ${label(rule)} (${where(rule)}, ${pages(rule)}, ${shortStatus(rule)})`);
    const text = record.text.length > 220 ? `${record.text.slice(0, 217).trimEnd()}…` : record.text;
    if (text) lines.push(`   ${text}`);
    lines.push(`   ${absolute(origin, ruleHref(rule.id))}`);
  });
  return lines.join("\n");
}

function normaliseChapter(chapter: string): string | undefined {
  const value = chapter.trim().toLowerCase().replace(/^section-/, "").replace(/^appendix\s+/, "").replace(/\.$/, "");
  const id = `section-${value}`;
  return getSection(id)?.level === 1 ? id : undefined;
}

export function getRuleText(input: string, origin: string): string {
  const rule = resolveRule(input);
  if (!rule) return notFound(input);
  const out: string[] = [];
  out.push(`# ${label(rule)}`);
  out.push(`Location: ${[where(rule), ...ancestorsOf(rule).map(label)].join(" › ")}`);
  out.push(`Source: The Law of Root (${SOURCE.printed_date}), ${pages(rule)}: ${absolute(origin, pdfPageHref(rule.source_page_start))}`);
  out.push(`Web page: ${absolute(origin, ruleHref(rule.id))}`);
  out.push(`Text status: ${textStatus(rule)}.`);

  const ancestors = ancestorsOf(rule);
  if (ancestors.length) {
    out.push("", "## Parent rules (context)");
    for (const a of ancestors) out.push(`**${label(a)}**`, a.text ? forAI(a.text) : "");
  }

  out.push("", "## Rule text (the Law's words)", ruleBlock(rule, 0, false) || "(This entry has no text of its own; see its sub-rules.)");

  const cites = [...new Set(rule.cross_references.map((r) => r.target_id).filter((id): id is string => Boolean(id)))];
  if (cites.length) out.push("", `Cites: ${cites.map(targetLabel).join("; ")}`);
  const citing = citedBy(rule.id);
  if (citing.length) out.push(`Cited by: ${citing.map(label).join("; ")}`);
  if (rule.faction_markers.length) {
    out.push(
      "",
      "Faction icons: the Law prints these factions' icons on this rule, meaning their Faction Rules and Abilities sections modify it:",
      ...rule.faction_markers.map((id) => {
        const faction = getFaction(id);
        const abilities = abilitiesSection(id);
        return `- ${faction?.name ?? id}${abilities ? ` (see ${abilities.number} ${abilities.title})` : ""}`;
      }),
    );
  }
  const topics = topicsOfRule(rule.id);
  if (topics.length) out.push("", `Topics (editorial grouping, not part of the Law): ${topics.map((t) => t.name).join(", ")}`);
  return out.join("\n");
}

export function getRelatedRulesText(input: string, origin: string): string {
  const rule = resolveRule(input);
  if (!rule) return notFound(input);
  const line = (r: Rule) => `- ${label(r)} (${shortStatus(r)}): ${absolute(origin, ruleHref(r.id))}`;
  const out = [`# Rules related to ${label(rule)}`, "", "From the Law itself:"];

  const ancestors = ancestorsOf(rule);
  if (ancestors.length) out.push("", "Parent rules:", ...ancestors.map(line));
  const children = childrenOf(rule.id);
  if (children.length) out.push("", "Sub-rules:", ...children.map(line));
  const cites = [...new Set(rule.cross_references.map((r) => r.target_id).filter((id): id is string => Boolean(id)))];
  if (cites.length) {
    out.push(
      "",
      "Rules and sections it cites:",
      ...cites.map((id) => {
        const target = getRule(id);
        return target ? line(target) : `- ${targetLabel(id)}`;
      }),
    );
  }
  const citing = citedBy(rule.id);
  if (citing.length) out.push("", "Rules that cite it:", ...citing.map(line));
  if (rule.faction_markers.length) {
    out.push(
      "",
      "Factions whose icon is printed on it (their abilities modify it):",
      ...rule.faction_markers.map((id) => {
        const abilities = abilitiesSection(id);
        return `- ${getFaction(id)?.name ?? id}${abilities ? `: ${abilities.number} ${abilities.title}, ${absolute(origin, chapterHref(abilities.parent_section_id!, abilities.id))}` : ""}`;
      }),
    );
  }
  const section = getSection(rule.section_id)!;
  const siblings = rulesIn(section.id).filter((r) => r.id !== rule.id && r.parent_rule_id === rule.parent_rule_id);
  if (siblings.length) out.push("", `Other rules in ${section.number ? `${section.number} ` : ""}${section.title}:`, ...siblings.slice(0, 12).map(line));

  const topics = topicsOfRule(rule.id);
  if (topics.length) {
    out.push("", "Editorial (not part of the Law), reviewed by the site owner:");
    for (const topic of topics) out.push(`- Topic: ${topic.name}: ${absolute(origin, topicHref(topic.id))}`);
  }
  if (out.length === 3) out.push("", "No related rules recorded.");
  return out.join("\n");
}

export function getFactionRulesText(factionId: string, detail: "full" | "outline", origin: string): string {
  const faction = getFaction(factionId);
  if (!faction) return `Unknown faction "${factionId}".`;
  const chapter = chapterOf(faction.chapter_section_id);
  const out: string[] = [
    `# ${faction.name}`,
    `Chapter ${chapter.number} of the Law of Root (${SOURCE.printed_date})${faction.expansion ? `, ${faction.expansion}` : ""}.`,
    `Web page: ${absolute(origin, factionHref(faction.id))}`,
    `PDF: ${absolute(origin, LAW_PDF_HREF)}`,
    "",
    `## Faction rules (chapter ${chapter.number})`,
  ];
  const own = allRules().filter((r) => chapterOf(r.section_id).id === chapter.id);
  const checked = own.filter((r) => verificationOf(r.id).status === "verified").length;
  out.push(
    checked === own.length
      ? "Every entry in this chapter was checked by hand against the PDF."
      : checked === 0
        ? `None of the ${own.length} entries in this chapter were checked by hand; all were extracted automatically.`
        : `${checked} of ${own.length} entries in this chapter were checked by hand against the PDF; the rest were extracted automatically.`,
  );
  const top = (sectionId: string) => rulesIn(sectionId).filter((r) => !r.parent_rule_id);
  // In an outline, a section's own text is already named by its heading.
  const listed = (rule: Rule) => rule.rule_type !== "section-text" && rule.rule_type !== "chapter-text";
  for (const rule of top(chapter.id)) if (detail === "full") out.push("", ruleBlock(rule));
  for (const section of sectionsOf(chapter.id)) {
    out.push("", `### ${section.number} ${section.title}`);
    for (const rule of top(section.id)) {
      if (detail === "full") out.push("", ruleBlock(rule));
      else if (listed(rule)) out.push(`- ${label(rule)}`, ...childrenOf(rule.id).map((c) => `  - ${label(c)}`));
    }
  }

  const general = generalRulesFor(faction.id);
  out.push("", "## General rules that apply");
  if (general.cited.length) out.push("Cited by the faction's own rules (from the Law):", ...general.cited.map((r) => `- ${label(r)}`));
  if (general.topics.length) {
    out.push("By topic (editorial grouping, reviewed by the site owner; the rules themselves are the Law's):");
    for (const t of general.topics) {
      out.push(
        `- ${t.topic.name}, because of ${t.factionRules.map((r) => r.rule_number ?? label(r)).join(", ")}: ${t.general.map(label).join("; ")}`,
      );
    }
  }
  for (const extra of general.extras) out.push(`- ${chapterLabel(extra.section)} (editorial: ${extra.reason})`);

  const modified = rulesModifiedBy(faction.id);
  out.push("", `## Rules the ${faction.name} changes`);
  out.push(
    modified.length
      ? `The Law prints the ${faction.name} icon on these rules outside its chapter ("Faction icons mark rules modified by Faction Rules and Abilities sections"):`
      : `The Law prints the ${faction.name} icon on no rule outside its own chapter.`,
    ...modified.map((r) => `- ${label(r)}`),
  );

  const mentions = rulesNaming(faction.id);
  out.push("", "## Named elsewhere (text match; naming the faction doesn't mean the rule applies)");
  out.push(...(mentions.length ? mentions.map(({ rule }) => `- ${label(rule)}`) : ["None."]));
  out.push("", "Use get_rule for the full text of any rule listed above.");
  return out.join("\n");
}
