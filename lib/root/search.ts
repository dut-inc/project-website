// Full-text search over the Law. Pure functions with no rule data, so the
// browser can run them over the index the search page ships
// (lib/root/searchIndex.ts builds it at build time).
//
// Query language:
//   6.2.3, G.20, 4.3       a rule number: that record first, then the rules under it
//   ambush                 words: every word must match (prefixes count: craft -> crafting)
//   warriors               simple plurals: warriors <-> warrior, enemies <-> enemy
//   "three actions"        quoted phrase: matched as written
// Filters (faction, chapter, topic) are exact metadata filters, applied before ranking.

import { ruleIdFromNumber } from "./paths.ts";

export type IndexRecord = {
  id: string;
  number: string | null;
  title: string; // plain text
  text: string; // plain text
  chapterId: string;
  // Core rules win ties on a title match (4.2 Move before 9.5.1 Move).
  core: boolean;
  // Factions whose page lists this record (own chapter, icon, or named).
  factionScope: string[];
  // Editorial topics (lib/root/topics.ts), directly or through a parent rule.
  topics: string[];
  page: number;
  order: number;
  type: string;
};

export type Filters = { faction?: string; chapter?: string; topic?: string };

export type Segment = { text: string; hit: boolean };

export type Result = {
  record: IndexRecord;
  score: number;
  // Why it matched: the rule number itself, or words/phrases in the text.
  kind: "number" | "text";
  excerpt: Segment[];
  titleSegments: Segment[];
};

type Term = { source: string; pattern: RegExp };

const WORD_START = String.raw`(?<![\p{L}\p{N}])`;

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Lowercase, straight apostrophes, single spaces. Keeps string length, so
// match positions line up with the original text.
function fold(text: string): string {
  return text.toLowerCase().replace(/[’‘]/g, "'");
}

function variants(word: string): string[] {
  const out = new Set([word]);
  if (word.length > 4 && word.endsWith("ies")) out.add(`${word.slice(0, -3)}y`);
  else if (word.length > 4 && /(?:ch|sh|x|ss)es$/.test(word)) out.add(word.slice(0, -2));
  else if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) out.add(word.slice(0, -1));
  return [...out];
}

export function parseQuery(query: string): Term[] {
  const terms: Term[] = [];
  const text = fold(query).replace(/[“”]/g, '"');
  for (const m of text.matchAll(/"([^"]+)"|(\S+)/g)) {
    if (m[1]) {
      const words = m[1].trim().split(/\s+/).map(escape);
      if (words.length && words[0]) terms.push({ source: m[1].trim(), pattern: new RegExp(WORD_START + words.join(String.raw`\s+`), "gu") });
      continue;
    }
    const word = m[2].replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}']+$/gu, "");
    if (!word) continue;
    const alternatives = variants(word).map(escape).join("|");
    terms.push({ source: word, pattern: new RegExp(`${WORD_START}(?:${alternatives})`, "gu") });
  }
  return terms;
}

type Span = { start: number; end: number };

function findAll(text: string, terms: Term[]): Span[][] {
  const folded = fold(text);
  return terms.map((term) => [...folded.matchAll(term.pattern)].map((m) => ({ start: m.index ?? 0, end: (m.index ?? 0) + m[0].length })));
}

// Text split into plain and highlighted pieces.
export function highlight(text: string, spans: Span[]): Segment[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const out: Segment[] = [];
  let at = 0;
  for (const span of sorted) {
    if (span.start < at) continue;
    if (span.start > at) out.push({ text: text.slice(at, span.start), hit: false });
    out.push({ text: text.slice(span.start, span.end), hit: true });
    at = span.end;
  }
  if (at < text.length) out.push({ text: text.slice(at), hit: false });
  return out;
}

// A window of the text around the first hit, with every hit inside it marked.
export function excerpt(text: string, spans: Span[], length = 220): Segment[] {
  if (!text) return [];
  const first = spans.length ? Math.min(...spans.map((s) => s.start)) : 0;
  let start = Math.max(0, first - 60);
  if (start > 0 && text[start - 1] !== " ") start = text.indexOf(" ", start) + 1 || start;
  let end = Math.min(text.length, start + length);
  if (end < text.length) {
    const space = text.lastIndexOf(" ", end);
    if (space > start) end = space;
  }
  const inside = spans
    .filter((s) => s.start >= start && s.end <= end)
    .map((s) => ({ start: s.start - start, end: s.end - start }));
  const segments = highlight(text.slice(start, end), inside);
  if (start > 0) segments.unshift({ text: "…", hit: false });
  if (end < text.length) segments.push({ text: "…", hit: false });
  return segments;
}

function passes(record: IndexRecord, filters: Filters): boolean {
  if (filters.faction && !record.factionScope.includes(filters.faction)) return false;
  if (filters.chapter && record.chapterId !== filters.chapter) return false;
  if (filters.topic && !record.topics.includes(filters.topic)) return false;
  return true;
}

// The record a typed number names, and the records under it (4.3 -> 4.3.1…).
function numberResults(records: IndexRecord[], query: string): Result[] | null {
  // Needs a digit, so a bare "a" or "g" is a word, not Appendix A or G.
  const id = /\d/.test(query) ? ruleIdFromNumber(query) : null;
  if (!id) return null;
  const prefix = `${id}-`;
  const hits = records.filter((r) => r.id === id || (r.number && r.id.startsWith(prefix)));
  if (hits.length === 0) return null;
  return hits
    .sort((a, b) => Number(b.id === id) - Number(a.id === id) || a.order - b.order)
    .map((record) => ({
      record,
      score: record.id === id ? 1000 : 500,
      kind: "number",
      excerpt: excerpt(record.text, []),
      titleSegments: [{ text: record.title, hit: false }],
    }));
}

export function search(records: IndexRecord[], query: string, filters: Filters = {}): Result[] {
  const pool = records.filter((r) => passes(r, filters));
  const trimmed = query.trim();
  if (!trimmed) return [];

  const byNumber = numberResults(pool, trimmed);
  if (byNumber) return byNumber;

  const terms = parseQuery(trimmed);
  if (terms.length === 0) return [];
  const wholeQuery = fold(trimmed).replace(/"/g, "").trim();

  const results: Result[] = [];
  for (const record of pool) {
    const inTitle = findAll(record.title, terms);
    const inText = findAll(record.text, terms);
    // Every term must appear in the title or the text.
    if (terms.some((_, i) => inTitle[i].length === 0 && inText[i].length === 0)) continue;

    let score = 0;
    terms.forEach((_, i) => {
      if (inTitle[i].length) score += 10;
      score += Math.min(inText[i].length, 4);
    });
    if (fold(record.title) === wholeQuery) score += 25;
    if ((record.core || record.type === "glossary") && inTitle.some((s) => s.length)) score += 3;

    results.push({
      record,
      score,
      kind: "text",
      excerpt: excerpt(record.text, inText.flat()),
      titleSegments: highlight(record.title, inTitle.flat()),
    });
  }
  return results.sort((a, b) => b.score - a.score || a.record.order - b.record.order);
}
