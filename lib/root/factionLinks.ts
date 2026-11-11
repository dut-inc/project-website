// Which factions a rules question is about, and the Law's rules that link
// them. The rules chat (geminiChat.ts) puts these in front of the model, so a
// question like "as the Vagabond, can I move into a forest with the Knaves in
// it?" can't miss 18.2.1 (the two can't be played in the same game) just
// because the model searched for "forest". Server only.
//
// A rule links factions A and B when it belongs to A's chapter or names A,
// and belongs to B's chapter or names B. Rules that name many factions (the
// reach table, expansion lists) are lists, not links, and are left out.

import { namePattern } from "./factions.ts";
import { allRules, chapterOf, factions, getFaction, type Rule } from "./law.ts";

const MAX_NAMED = 3; // a rule naming more factions than this is a list
const MAX_LINKS = 8;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function nameTest(factionId: string): RegExp[] {
  const faction = getFaction(factionId);
  const short = namePattern(factionId);
  return [
    ...(faction ? [new RegExp(`\\b${escape(faction.name)}\\b`, "i")] : []),
    ...(short ? [new RegExp(short.source, "i")] : []),
  ];
}

// Factions named in a question ("the knaves", "Vagabond", "Lord of the Hundreds").
export function factionsIn(text: string): string[] {
  return factions()
    .filter((f) => nameTest(f.id).some((re) => re.test(text)))
    .map((f) => f.id);
}

function named(rule: Rule): Set<string> {
  const text = `${rule.title ?? ""}\n${rule.text}`;
  const ids = new Set<string>();
  for (const f of factions()) {
    const pattern = namePattern(f.id);
    if (pattern?.test(text)) ids.add(f.id);
  }
  return ids;
}

// Rules linking any two of the given factions, the factions' own chapters first.
export function rulesLinking(factionIds: string[]): Rule[] {
  const ids = [...new Set(factionIds)].filter((id) => getFaction(id));
  if (ids.length < 2) return [];
  const linked: Rule[] = [];
  for (const rule of allRules()) {
    if (rule.rule_type === "chapter-text") continue;
    const names = named(rule);
    if (names.size > MAX_NAMED) continue;
    const owner = chapterOf(rule.section_id).faction_id;
    const about = ids.filter((id) => id === owner || names.has(id));
    if (about.length >= 2) linked.push(rule);
  }
  const inOwnChapter = (rule: Rule) => ids.includes(chapterOf(rule.section_id).faction_id ?? "");
  return [...linked.filter(inOwnChapter), ...linked.filter((r) => !inOwnChapter(r))].slice(0, MAX_LINKS);
}
