// Root Rules Encyclopedia: URL/number conversions, the text markup parser and
// the integrity of the data the pages are built from.
//
// Run with: npm test   (node --experimental-strip-types --test)

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  allRules,
  ancestorsOf,
  chapterOf,
  chapters,
  childrenOf,
  citedBy,
  getRule,
  getSection,
  rulesIn,
  sectionsOf,
  targetHref,
  verificationOf,
} from "./law.ts";
import { citationSpans, parseBlocks, parseInline, plainText, type Inline } from "./markup.ts";
import { encyclopediaPageName, numberFromSlug, ruleHref, ruleIdFromNumber, ruleSlug } from "./paths.ts";

test("slugs and printed numbers convert both ways", () => {
  assert.equal(numberFromSlug("6-2-3"), "6.2.3");
  assert.equal(numberFromSlug("4-3-5-ii"), "4.3.5.II");
  assert.equal(numberFromSlug("9-2-9-iii-a"), "9.2.9.IIIa");
  assert.equal(numberFromSlug("g-20"), "G.20");
  assert.equal(numberFromSlug("2-intro"), null);
  assert.equal(numberFromSlug("reading-the-law"), null);
  assert.equal(ruleIdFromNumber(" 9.2.9.IIIa "), "rule-9-2-9-iii-a");
  assert.equal(ruleIdFromNumber("g.20"), "rule-g-20");
  assert.equal(ruleIdFromNumber("6.2.3."), "rule-6-2-3");
  assert.equal(ruleIdFromNumber("battle"), null);
});

test("every numbered record round-trips through its slug", () => {
  for (const rule of allRules()) {
    if (!rule.rule_number) continue;
    assert.equal(numberFromSlug(ruleSlug(rule.id)), rule.rule_number, rule.id);
    assert.equal(ruleIdFromNumber(rule.rule_number), rule.id, rule.id);
  }
});

test("tab names for encyclopedia pages", () => {
  assert.deepEqual(encyclopediaPageName("rule/6-2-3"), { name: "6.2.3.law", title: "Root rule 6.2.3" });
  assert.equal(encyclopediaPageName("law/6").name, "chapter-6.law");
  assert.equal(encyclopediaPageName("law").name, "lawbook.law");
  assert.equal(encyclopediaPageName("law/g").name, "appendix-g.law");
  assert.equal(encyclopediaPageName("law/reading-the-law").name, "reading-the-law.law");
});

test("citations are located like the extractor finds them", () => {
  const text = "resolve 4.3.1.I–II in order, see Appendix H and setup (5); not 30 points or 5/2.";
  assert.deepEqual(
    citationSpans(text).map((s) => [text.slice(s.start, s.end), s.cited]),
    [
      ["4.3.1.I", "4.3.1.I"],
      ["II", "4.3.1.II"],
      ["Appendix H", "H"],
      ["5", "5"],
    ],
  );
});

test("inline markup: italics, items, icons and resolved links only", () => {
  const parts = parseInline("Take 2 {item:boots}. *See 6.2.3 and 9.9.9.* {icon}", [
    { cited: "6.2.3", target_id: "rule-6-2-3" },
    { cited: "9.9.9", target_id: null },
  ]);
  assert.deepEqual(parts, [
    { kind: "text", text: "Take 2 ", italic: false },
    { kind: "item", item: "boots", italic: false },
    { kind: "text", text: ". ", italic: false },
    { kind: "text", text: "See ", italic: true },
    { kind: "ref", text: "6.2.3", targetId: "rule-6-2-3", italic: true },
    { kind: "text", text: " and 9.9.9.", italic: true },
    { kind: "text", text: " ", italic: false },
    { kind: "icon", italic: false },
  ]);
});

test("the Reach table parses into two captioned tables", () => {
  const reach = getRule("rule-5-2")!;
  const blocks = parseBlocks(reach.text, reach.cross_references);
  const tables = blocks.filter((b) => b.kind === "table");
  assert.equal(tables.length, 2);
  const caption = (b: (typeof tables)[number]) => b.kind === "table" && b.caption?.map((i) => ("text" in i ? i.text : "")).join("");
  assert.equal(caption(tables[0]), "Viable Reach Sums");
  assert.equal(caption(tables[1]), "Reach Values");
  assert.ok(tables[1].kind === "table" && tables[1].rows.length === 13);
});

test("plain text drops markup", () => {
  assert.equal(plainText("Take *one* {item:sword}.\n\nThen {icon}rest."), "Take one sword. Then rest.");
  // Table rows keep each label with its own values.
  assert.equal(
    plainText("Reach Values\nCorvid Conspiracy | 3\nLizard Cult | 2"),
    "Reach Values Corvid Conspiracy: 3; Lizard Cult: 2;",
  );
});

test("every resolved cross-reference becomes a link in the rendered text", () => {
  const linked = (parts: Inline[]) => new Set(parts.flatMap((p) => (p.kind === "ref" ? [p.targetId] : [])));
  for (const rule of allRules()) {
    const blocks = parseBlocks(rule.text, rule.cross_references);
    const found = linked(
      blocks.flatMap((b) => (b.kind === "paragraph" ? b.content : [...(b.caption ?? []), ...b.rows.flat(2)])),
    );
    for (const ref of rule.cross_references) {
      assert.ok(ref.target_id, `${rule.id} cites unresolved ${ref.cited}`);
      assert.ok(found.has(ref.target_id), `${rule.id}: ${ref.cited} is not linked`);
    }
  }
});

test("every link target and section member exists", () => {
  for (const rule of allRules()) {
    assert.ok(getSection(rule.section_id), rule.id);
    if (rule.parent_rule_id) assert.ok(getRule(rule.parent_rule_id), rule.id);
    for (const ref of rule.cross_references) assert.match(targetHref(ref.target_id!), /^\/board-games\/root\//);
  }
  for (const chapter of chapters()) {
    for (const section of sectionsOf(chapter.id)) {
      for (const id of section.rule_ids) assert.ok(getRule(id), `${section.id} lists missing ${id}`);
    }
  }
});

test("every record appears exactly once in the chapter pages", () => {
  const shown: string[] = [];
  const walk = (ruleId: string) => {
    shown.push(ruleId);
    childrenOf(ruleId).forEach((child) => walk(child.id));
  };
  for (const chapter of chapters()) {
    for (const sectionId of [chapter.id, ...sectionsOf(chapter.id).map((s) => s.id)]) {
      rulesIn(sectionId)
        .filter((r) => !r.parent_rule_id)
        .forEach((r) => walk(r.id));
    }
  }
  assert.equal(shown.length, allRules().length);
  assert.equal(new Set(shown).size, allRules().length);
});

test("hierarchy lookups", () => {
  const rule = getRule("rule-9-2-9-iii-a")!;
  assert.deepEqual(
    ancestorsOf(rule).map((r) => r.id),
    ["rule-9-2-9", "rule-9-2-9-iii"],
  );
  assert.equal(chapterOf(rule.section_id).id, "section-9");
  assert.ok(childrenOf("rule-4-3-1").some((r) => r.id === "rule-4-3-1-ii"));
  assert.ok(citedBy("rule-4-3-1-i").some((r) => r.id === "rule-4-3-1"));
  assert.equal(targetHref("section-5-1"), "/board-games/root/law/5#section-5-1");
  assert.equal(targetHref("section-g"), "/board-games/root/law/g");
  assert.equal(ruleHref("rule-6-2-3"), "/board-games/root/rule/6-2-3");
});

test("reviewed records are marked verified, everything else unreviewed", () => {
  const verified = allRules().filter((r) => verificationOf(r.id).status === "verified");
  assert.equal(verified.length, 206);
  assert.equal(verificationOf("rule-6-2-3").status, "verified");
  assert.equal(verificationOf("rule-7-1").status, "verified");
  assert.equal(verificationOf("rule-9-1").status, "unreviewed");
});
