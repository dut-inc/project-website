// Faction pages: which rules each group collects.
//
// Run with: npm test   (node --experimental-strip-types --test)

import { test } from "node:test";
import assert from "node:assert/strict";

import { abilitiesSection, excerptAround, namePattern, rulesModifiedBy, rulesNaming } from "./factions.ts";
import { chapterOf, factions } from "./law.ts";
import { encyclopediaPageName, factionHref } from "./paths.ts";

const numbers = (rules: { rule_number: string | null; id: string }[]) => rules.map((r) => r.rule_number ?? r.id);

test("rules a faction changes are the ones printed with its icon", () => {
  assert.deepEqual(numbers(rulesModifiedBy("vagabond")), ["2.5", "3.3.1", "4.1.1", "4.1.2", "4.2.1", "4.3.3.I", "4.3.5.II"]);
  // A faction rule can modify another faction's chapter.
  assert.ok(numbers(rulesModifiedBy("lizard-cult")).includes("7.2.2"));
  // The Marquise and the Keepers carry no icons in this edition.
  assert.deepEqual(rulesModifiedBy("marquise-de-cat"), []);
  assert.deepEqual(rulesModifiedBy("keepers-in-iron"), []);
});

test("no group repeats the faction's own chapter or the other group", () => {
  for (const faction of factions()) {
    const modified = rulesModifiedBy(faction.id);
    const named = rulesNaming(faction.id).map((m) => m.rule);
    const ids = [...modified, ...named].map((r) => r.id);
    assert.equal(new Set(ids).size, ids.length, faction.id);
    for (const rule of [...modified, ...named]) {
      assert.notEqual(chapterOf(rule.section_id).id, faction.chapter_section_id, `${faction.id}: ${rule.id}`);
    }
  }
});

test("name mentions skip expansion tags and component lists", () => {
  const pattern = namePattern("riverfolk-company")!;
  assert.ok(pattern.test("the Riverfolk may buy services"));
  assert.ok(!pattern.test("Vagrant (Riverfolk)"));
  assert.ok(!pattern.test("from The Riverfolk Expansion"));
  assert.deepEqual(numbers(rulesNaming("knaves-of-the-deepwood").map((m) => m.rule)), ["5.2", "A.6.5", "A.8.1", "A.8.2.IV"]);
  for (const faction of factions()) {
    for (const { excerpt } of rulesNaming(faction.id)) assert.match(excerpt.match, namePattern(faction.id)!);
  }
});

test("every faction has an abilities section and a page", () => {
  for (const faction of factions()) {
    assert.ok(abilitiesSection(faction.id), faction.id);
  }
  assert.equal(factionHref("vagabond"), "/board-games/root/faction/vagabond");
  assert.equal(encyclopediaPageName("faction/vagabond").name, "vagabond.faction");
});

test("excerpts cut at word boundaries", () => {
  const text = "one two three four five six seven eight nine ten eleven twelve";
  const index = text.indexOf("six");
  const e = excerptAround(text, index, 3, 10, 12);
  assert.equal(e.match, "six");
  assert.equal(e.before, "…four five ");
  assert.equal(e.after, " seven eight…");
});
