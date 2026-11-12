// URLs for the Root Rules Encyclopedia, and the conversions between rule ids,
// printed rule numbers and URL slugs. This file imports no rule data, so the
// workspace shell (tab names) can use it without pulling the rulebook into the
// client bundle.
//
//   /board-games/root                  dashboard: draft, reach calculator, rules chat
//   /board-games/root/law              the lawbook's contents
//   /board-games/root/law/<chapter>    one chapter in book order (6, g, reading-the-law)
//   /board-games/root/rule/<slug>      one rule (6-2-3, 4-3-5-ii, g-20, 2-intro)
//   /board-games/root/faction/<id>     a faction's reference page (vagabond)
//   /board-games/root/search?q=&faction=&chapter=&topic=   search
//   /board-games/root/topics, /board-games/root/topic/<id>  editorial topics
//   /board-games/root/setup            reach calculator + standard setup order
//   /board-games/root/draft            Advanced Setup faction draft
//   /board-games/root/ask?faction=     the AI rules chat

export const ROOT_HREF = "/board-games/root"; // the game-night dashboard
export const LAW_HREF = `${ROOT_HREF}/law`; // the lawbook's contents
export const LAW_PDF_HREF = "/data/root/Root_2025_Law.pdf";

// rule-6-2-3 -> 6-2-3
export function ruleSlug(ruleId: string): string {
  return ruleId.replace(/^rule-/, "");
}

// section-6 -> 6, section-g -> g, section-reading-the-law -> reading-the-law
export function chapterSlug(chapterSectionId: string): string {
  return chapterSectionId.replace(/^section-/, "");
}

export function ruleHref(ruleId: string): string {
  return `${ROOT_HREF}/rule/${ruleSlug(ruleId)}`;
}

export function chapterHref(chapterSectionId: string, anchor?: string): string {
  return `${ROOT_HREF}/law/${chapterSlug(chapterSectionId)}${anchor ? `#${anchor}` : ""}`;
}

export function factionHref(factionId: string, anchor?: string): string {
  return `${ROOT_HREF}/faction/${factionId}${anchor ? `#${anchor}` : ""}`;
}

export const TOPICS_HREF = `${ROOT_HREF}/topics`;
// The rules chat (Gemini). ?faction=<id> preselects "Playing as".
export const ASK_HREF = `${ROOT_HREF}/ask`;

// Setup tools: reach calculator + standard setup order, and the Advanced Setup draft.
export const SETUP_HREF = `${ROOT_HREF}/setup`;
export const DRAFT_HREF = `${ROOT_HREF}/draft`;

export function askHref(faction?: string): string {
  return faction ? `${ASK_HREF}?faction=${encodeURIComponent(faction)}` : ASK_HREF;
}

export function topicHref(topicId: string): string {
  return `${ROOT_HREF}/topic/${topicId}`;
}

export function searchHref({
  q,
  faction,
  chapter,
  topic,
}: { q?: string; faction?: string; chapter?: string; topic?: string } = {}): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (faction) params.set("faction", faction);
  if (chapter) params.set("chapter", chapter);
  if (topic) params.set("topic", topic);
  const query = params.toString();
  return `${ROOT_HREF}/search${query ? `?${query}` : ""}`;
}

// The PDF viewer's page parameter (supported by the browsers' built-in viewers).
export function pdfPageHref(page: number): string {
  return `${LAW_PDF_HREF}#page=${page}`;
}

const ROMAN = /^[ivx]+$/;

// The printed number a slug stands for: 6-2-3 -> 6.2.3, 4-3-5-ii -> 4.3.5.II,
// 9-2-9-iii-a -> 9.2.9.IIIa, g-20 -> G.20. Returns null for slugs that are not
// numbers (2-intro, reading-the-law).
export function numberFromSlug(slug: string): string | null {
  const parts = slug.toLowerCase().split("-");
  const [head, ...rest] = parts;
  if (!/^(\d{1,2}|[a-z])$/.test(head) || rest.length === 0 || !/^\d+$/.test(rest[0])) return null;
  let out = /^\d/.test(head) ? head : head.toUpperCase();
  let sawRoman = false;
  for (const part of rest) {
    if (!sawRoman && /^\d+$/.test(part)) out += `.${part}`;
    else if (!sawRoman && ROMAN.test(part)) {
      out += `.${part.toUpperCase()}`;
      sawRoman = true;
    } else if (sawRoman && /^[a-z]$/.test(part)) out += part;
    else return null;
  }
  return out;
}

// The inverse, for typed rule numbers: "6.2.3" -> rule-6-2-3,
// "9.2.9.IIIa" -> rule-9-2-9-iii-a, "g.20" -> rule-g-20. Tolerates spaces and a
// trailing dot. Returns null for anything that is not shaped like a rule number.
export function ruleIdFromNumber(input: string): string | null {
  const text = input.trim().replace(/\s+/g, "").replace(/\.$/, "");
  const match = /^(\d{1,2}|[a-zA-Z])((?:\.\d+)*)(?:\.([ivxIVX]+)([a-z])?)?$/.exec(text);
  if (!match) return null;
  const [, head, numbers, roman, letter] = match;
  const parts = [head.toLowerCase(), ...numbers.split(".").filter(Boolean)];
  if (roman) parts.push(roman.toLowerCase());
  if (letter) parts.push(letter);
  return `rule-${parts.join("-")}`;
}

// Tab and explorer names for pages inside root.law (see lib/workspace.ts).
// They come from the URL alone.
export function encyclopediaPageName(rest: string): { name: string; title: string } {
  const [kind, slug = ""] = rest.split("/");
  if (kind === "rule" && slug) {
    const number = numberFromSlug(slug);
    return number
      ? { name: `${number}.law`, title: `Root rule ${number}` }
      : { name: `${slug}.law`, title: `Root rules: ${slug.replace(/-/g, " ")}` };
  }
  if (kind === "law" && slug) {
    const label = /^\d+$/.test(slug)
      ? `chapter-${slug}`
      : /^[a-z]$/.test(slug)
        ? `appendix-${slug}`
        : slug;
    return { name: `${label}.law`, title: `Root rules: ${label.replace(/-/g, " ")}` };
  }
  if (kind === "search") return { name: "search.law", title: "Search Root rules" };
  if (kind === "topics") return { name: "topics.law", title: "Root rules by topic" };
  if (kind === "law" && !slug) return { name: "lawbook.law", title: "The Law of Root" };
  if (kind === "setup") return { name: "setup.law", title: "Root setup & reach" };
  if (kind === "draft") return { name: "draft.law", title: "Root advanced setup draft" };
  if (kind === "ask") return { name: "ask.law", title: "Ask the Root rules" };
  if (kind === "topic" && slug) return { name: `${slug}.topic`, title: `Root topic: ${slug.replace(/-/g, " ")}` };
  if (kind === "faction" && slug) {
    return { name: `${slug}.faction`, title: `Root faction: ${slug.replace(/-/g, " ")}` };
  }
  return { name: `${rest.replace(/\//g, "-") || "root"}.law`, title: "Root Assistant" };
}
