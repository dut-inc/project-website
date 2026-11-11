// Topics and a faction's "general rules that apply". Editorial: built from
// data/root/editorial/topics.json, which is drafted by an editor and reviewed by
// the project owner. Pages label this as editorial and show its review status;
// it is never presented as rule text. Server only.

import topicsData from "../../data/root/editorial/topics.json" with { type: "json" };
import {
  allRules,
  ancestorsOf,
  chapterGroup,
  chapterOf,
  getFaction,
  getRule,
  getSection,
  type Rule,
  type Section,
} from "./law.ts";

export type TopicStatus = "draft" | "reviewed";

export type Topic = {
  id: string;
  name: string;
  description: string;
  sections: string[];
  section_titles?: string[];
  rules: { id: string; reason: string }[];
  title_terms: string[];
  status: TopicStatus;
};

type FactionExtra = { faction: string; section: string; reason: string; status: TopicStatus };

const DATA = topicsData as unknown as { topics: Topic[]; faction_extras: FactionExtra[] };

export function topics(): Topic[] {
  return DATA.topics;
}

export function getTopic(id: string): Topic | undefined {
  return DATA.topics.find((t) => t.id === id);
}

// How a rule came to be in a topic.
export type Via =
  | { kind: "section"; sectionId: string }
  | { kind: "editor"; reason: string }
  | { kind: "title"; term: string };

export type Member = { rule: Rule; via: Via };

function titleTermPattern(terms: string[]): RegExp | null {
  if (terms.length === 0) return null;
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).sort((a, b) => b.length - a.length);
  return new RegExp(String.raw`\b(?:${escaped.join("|")})\b`);
}

function plainTitle(rule: Rule): string {
  return (rule.title ?? "").replace(/\{item:([a-z]+)\}/g, "$1").replace(/\{icon\}/g, "").replace(/\*/g, "");
}

// A section assignment covers the section's own records, or for a chapter
// every record in it.
function inSection(rule: Rule, section: Section): boolean {
  if (section.level === 1) return chapterOf(rule.section_id).id === section.id;
  return rule.section_id === section.id;
}

function directVia(topic: Topic, rule: Rule): Via | null {
  for (const sectionId of topic.sections) {
    const section = getSection(sectionId);
    if (section && inSection(rule, section)) return { kind: "section", sectionId };
  }
  if (topic.section_titles?.length) {
    const section = getSection(rule.section_id);
    if (section && section.level === 2 && topic.section_titles.includes(section.title)) {
      return { kind: "section", sectionId: section.id };
    }
  }
  const pick = topic.rules.find((r) => r.id === rule.id);
  if (pick) return { kind: "editor", reason: pick.reason };
  const pattern = titleTermPattern(topic.title_terms);
  const match = pattern?.exec(plainTitle(rule));
  if (match) return { kind: "title", term: match[0] };
  return null;
}

const MEMBERS = new Map<string, Member[]>();
for (const topic of DATA.topics) {
  const direct: Member[] = [];
  for (const rule of allRules()) {
    const via = directVia(topic, rule);
    if (via) direct.push({ rule, via });
  }
  MEMBERS.set(topic.id, direct);
}

// A topic's records in book order. A record whose ancestor is also in the topic
// is left out of `top` (pages show it inside its parent) but kept in `all`.
export function topicMembers(topicId: string): { all: Member[]; top: Member[] } {
  const all = MEMBERS.get(topicId) ?? [];
  const ids = new Set(all.map((m) => m.rule.id));
  const top = all.filter((m) => !ancestorsOf(m.rule).some((a) => ids.has(a.id)));
  return { all, top };
}

// Topics a record belongs to, directly or through an ancestor (a sub-rule of
// 4.3.1 is about battle too).
export function topicsOfRule(ruleId: string): Topic[] {
  const rule = getRule(ruleId);
  if (!rule) return [];
  const chain = new Set([rule.id, ...ancestorsOf(rule).map((a) => a.id)]);
  return DATA.topics.filter((t) => (MEMBERS.get(t.id) ?? []).some((m) => chain.has(m.rule.id)));
}

export type MemberGroup = { key: "core" | "glossary" | "faction" | "appendix"; label: string; members: Member[] };

// Group a topic's top-level members for its page.
export function groupMembers(members: Member[]): MemberGroup[] {
  const groups: MemberGroup[] = [
    { key: "core", label: "Core rules", members: [] },
    { key: "faction", label: "Faction rules", members: [] },
    { key: "glossary", label: "Glossary", members: [] },
    { key: "appendix", label: "Appendices", members: [] },
  ];
  for (const m of members) {
    const chapter = chapterOf(m.rule.section_id);
    const key = chapter.id === "section-g" ? "glossary" : chapterGroup(chapter);
    groups.find((g) => g.key === key)!.members.push(m);
  }
  return groups.filter((g) => g.members.length > 0);
}

// --- A faction's "general rules that apply" ---------------------------------

export type GeneralTopic = {
  topic: Topic;
  // The faction's own rules in this topic (by title, section heading or editor's pick).
  factionRules: Rule[];
  // The topic's records in core chapters and the glossary.
  general: Rule[];
};

export type GeneralRules = {
  // From the PDF: general rules the faction's chapter cites.
  cited: Rule[];
  // Editorial: via topics the faction's own rules belong to.
  topics: GeneralTopic[];
  extras: { section: Section; reason: string; status: TopicStatus }[];
};

function isGeneral(rule: Rule): boolean {
  const chapter = chapterOf(rule.section_id);
  return chapter.id === "section-g" || chapterGroup(chapter) === "core";
}

export function generalRulesFor(factionId: string): GeneralRules {
  const faction = getFaction(factionId);
  if (!faction) return { cited: [], topics: [], extras: [] };
  const own = allRules().filter((r) => chapterOf(r.section_id).id === faction.chapter_section_id);
  const ownIds = new Set(own.map((r) => r.id));

  const citedIds = new Set<string>();
  for (const rule of own) {
    for (const ref of rule.cross_references) {
      const target = ref.target_id && getRule(ref.target_id);
      if (target && !ownIds.has(target.id) && isGeneral(target)) citedIds.add(target.id);
    }
  }
  const cited = allRules().filter((r) => citedIds.has(r.id));

  const general: GeneralTopic[] = [];
  for (const topic of DATA.topics) {
    const members = MEMBERS.get(topic.id) ?? [];
    const factionRules = members.filter((m) => ownIds.has(m.rule.id)).map((m) => m.rule);
    if (factionRules.length === 0) continue;
    const { top } = topicMembers(topic.id);
    const generalRules = top.filter((m) => isGeneral(m.rule)).map((m) => m.rule);
    if (generalRules.length === 0) continue;
    general.push({ topic, factionRules, general: generalRules });
  }

  const extras = DATA.faction_extras
    .filter((e) => e.faction === factionId)
    .map((e) => ({ section: getSection(e.section)!, reason: e.reason, status: e.status }));

  return { cited, topics: general, extras };
}

export function editorialStatus(): { drafted: number; reviewed: number } {
  const all = [...DATA.topics.map((t) => t.status), ...DATA.faction_extras.map((e) => e.status)];
  return { drafted: all.length, reviewed: all.filter((s) => s === "reviewed").length };
}
