// Search over the whole Law: numbers, words, phrases, plurals, filters, ranking.
//
// Run with: npm test   (node --experimental-strip-types --test)

import { test } from "node:test";
import assert from "node:assert/strict";

import { excerpt, highlight, parseQuery, search } from "./search.ts";
import { buildSearchIndex } from "./searchIndex.ts";

const INDEX = buildSearchIndex();
const ids = (q: string, filters = {}) => search(INDEX, q, filters).map((r) => r.record.id);

test("the index covers every record once", () => {
  assert.equal(INDEX.length, 707);
  assert.equal(new Set(INDEX.map((r) => r.id)).size, 707);
  assert.ok(INDEX.every((r) => !/[*{}]/.test(r.text)), "markup left in search text");
});

test("a rule number finds that rule first, then the rules under it", () => {
  assert.equal(ids("6.2.3")[0], "rule-6-2-3");
  assert.equal(ids(" 9.2.9.IIIa ")[0], "rule-9-2-9-iii-a");
  assert.equal(ids("g.20")[0], "rule-g-20");
  const section = ids("4.3");
  assert.equal(section[0], "rule-4-3");
  assert.ok(section.includes("rule-4-3-5-ii"));
  assert.ok(section.every((id) => id === "rule-4-3" || id.startsWith("rule-4-3-")));
  assert.equal(search(INDEX, "6.2.3")[0].kind, "number");
});

test("a single letter is a word, not an appendix", () => {
  assert.ok(!search(INDEX, "a").every((r) => r.record.id.startsWith("rule-a-")));
});

test("words: title matches rank first, every word must match", () => {
  assert.equal(ids("field hospitals")[0], "rule-6-2-3");
  assert.match(search(INDEX, "ambush")[0].record.title, /Ambush/);
  assert.equal(ids("move")[0], "rule-4-2");
  for (const r of search(INDEX, "keep token")) {
    const text = `${r.record.title} ${r.record.text}`.toLowerCase();
    assert.ok(text.includes("keep") && text.includes("token"), r.record.id);
  }
});

test("prefixes and simple plurals match", () => {
  assert.ok(ids("craft").includes("rule-4-1"));
  const singular = new Set(ids("warrior"));
  const plural = new Set(ids("warriors"));
  assert.ok(singular.size > 50);
  assert.deepEqual(plural, singular);
  assert.ok(ids("enemies").length >= ids("enemy").length - 5);
});

test("quoted phrases match as written", () => {
  for (const r of search(INDEX, '"three actions"')) {
    assert.match(`${r.record.title} ${r.record.text}`.toLowerCase(), /three\s+actions/, r.record.id);
  }
  assert.ok(ids('"three actions"').includes("rule-6-5"));
  assert.deepEqual(ids('"actions three"'), []);
});

test("faction filter: the faction's page, and only that", () => {
  const vagabond = new Set(ids("rule", { faction: "vagabond" }));
  assert.ok(vagabond.has("rule-4-2-1"), "icon-marked rule");
  assert.ok(vagabond.has("rule-2-5"), "icon-marked section text");
  assert.ok(!vagabond.has("rule-6-2-2"), "Marquise rule");
  for (const r of search(INDEX, "battle", { faction: "marquise-de-cat" })) {
    assert.ok(r.record.factionScope.includes("marquise-de-cat"));
  }
  // Numbers respect filters too.
  assert.deepEqual(ids("6.2.3", { faction: "vagabond" }), []);
});

test("chapter filter", () => {
  const glossary = search(INDEX, "card", { chapter: "section-g" });
  assert.ok(glossary.length > 0);
  assert.ok(glossary.every((r) => r.record.chapterId === "section-g"));
});

test("nothing found, and empty queries", () => {
  assert.deepEqual(ids("zzzqqq"), []);
  assert.deepEqual(ids("   "), []);
  assert.deepEqual(ids('""'), []);
});

test("highlights and excerpts", () => {
  assert.deepEqual(highlight("Take the keep.", [{ start: 9, end: 13 }]), [
    { text: "Take the ", hit: false },
    { text: "keep", hit: true },
    { text: ".", hit: false },
  ]);
  const long = `${"word ".repeat(40)}target ${"tail ".repeat(60)}`.trim();
  const at = long.indexOf("target");
  const segments = excerpt(long, [{ start: at, end: at + 6 }]);
  assert.equal(segments[0].text, "…");
  assert.equal(segments.at(-1)!.text, "…");
  assert.ok(segments.some((s) => s.hit && s.text === "target"));
  assert.equal(parseQuery('battle "keep token"').length, 2);
});
