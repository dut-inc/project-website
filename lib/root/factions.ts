// What a faction page collects, beyond the faction's own chapter. Both groups
// are derived from the PDF data, never assigned by hand:
//
// - Rules the faction changes: rules elsewhere that carry the faction's icon.
//   The Law's key says faction icons "mark rules modified by Faction Rules and
//   Abilities sections".
// - Rules that name the faction: a text match on the faction's name. Being
//   named is not the same as applying, and the page says so.
//
// Server only (reads the rulebook through law.ts).

import { allRules, chapterOf, getFaction, getRule, sectionsOf, type Rule, type Section } from "./law.ts";
import { plainText } from "./markup.ts";

// Words the Law uses for each faction, for finding mentions. Matches inside
// "(Riverfolk)" (an expansion tag on Vagabond characters and maps) and
// "<Name> Expansion" (component lists) are ignored.
const NAME_TERMS: Record<string, string[]> = {
  "marquise-de-cat": ["Marquise"],
  "eyrie-dynasties": ["Eyrie"],
  "woodland-alliance": ["Alliance"],
  vagabond: ["Vagabonds?"],
  "lizard-cult": ["Lizard Cult", "Cult"],
  "riverfolk-company": ["Riverfolk"],
  "underground-duchy": ["Duchy"],
  "corvid-conspiracy": ["Corvids?"],
  "lord-of-the-hundreds": ["Hundreds"],
  "keepers-in-iron": ["Keepers"],
  "lilypad-diaspora": ["Lilypad", "Diaspora"],
  "twilight-council": ["Council"],
  "knaves-of-the-deepwood": ["Knaves"],
};

export function namePattern(factionId: string): RegExp | null {
  const terms = NAME_TERMS[factionId];
  return terms ? new RegExp(String.raw`(?<!\()\b(?:${terms.join("|")})\b(?! Expansion)(?!\))`) : null;
}

function inOwnChapter(rule: Rule, factionId: string): boolean {
  return chapterOf(rule.section_id).faction_id === factionId;
}

function hasAncestorIn(rule: Rule, ids: Set<string>): boolean {
  for (let p = rule.parent_rule_id; p; p = getRule(p)?.parent_rule_id ?? null) if (ids.has(p)) return true;
  return false;
}

// Rules outside the faction's chapter that carry its icon, in book order. A
// sub-rule whose parent is already listed is shown inside it instead.
export function rulesModifiedBy(factionId: string): Rule[] {
  const marked = allRules().filter((r) => r.faction_markers.includes(factionId) && !inOwnChapter(r, factionId));
  const ids = new Set(marked.map((r) => r.id));
  return marked.filter((r) => !hasAncestorIn(r, ids));
}

export type Mention = { rule: Rule; excerpt: { before: string; match: string; after: string } };

// Rules outside the faction's chapter (and not already marked with its icon)
// whose title or text names the faction.
export function rulesNaming(factionId: string): Mention[] {
  const pattern = namePattern(factionId);
  if (!pattern) return [];
  const out: Mention[] = [];
  for (const rule of allRules()) {
    if (inOwnChapter(rule, factionId) || rule.faction_markers.includes(factionId)) continue;
    const text = plainText(`${rule.title ? `${rule.title}. ` : ""}${rule.text}`);
    const found = pattern.exec(text);
    if (found) out.push({ rule, excerpt: excerptAround(text, found.index, found[0].length) });
  }
  return out;
}

// A short window of text around a match, cut at word boundaries.
export function excerptAround(text: string, index: number, length: number, before = 70, after = 110) {
  let start = Math.max(0, index - before);
  let end = Math.min(text.length, index + length + after);
  // Start on a whole word: skip a partial one unless the window already begins at a word.
  if (start > 0 && text[start - 1] !== " ") start = text.indexOf(" ", start) + 1 || start;
  if (end < text.length) end = text.lastIndexOf(" ", end) > index + length ? text.lastIndexOf(" ", end) : end;
  return {
    before: `${start > 0 ? "…" : ""}${text.slice(start, index)}`,
    match: text.slice(index, index + length),
    after: `${text.slice(index + length, end)}${end < text.length ? "…" : ""}`,
  };
}

// The chapter section that holds the faction's abilities (X.2 in this edition).
export function abilitiesSection(factionId: string): Section | undefined {
  const faction = getFaction(factionId);
  if (!faction) return undefined;
  return sectionsOf(faction.chapter_section_id).find((s) => s.title === "Faction Rules and Abilities");
}
