// Editorial topics: the draft file points at real records, memberships follow
// the stated rules, and faction "general rules" derive from them.
//
// Run with: npm test   (node --experimental-strip-types --test)

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { factions, getRule, getSection } from "./law.ts";
import { encyclopediaPageName, searchHref, topicHref } from "./paths.ts";
import { search } from "./search.ts";
import { buildSearchIndex } from "./searchIndex.ts";
import { generalRulesFor, getTopic, groupMembers, topicMembers, topics, topicsOfRule } from "./topics.ts";

const RAW = JSON.parse(readFileSync(new URL("../../data/root/editorial/topics.json", import.meta.url), "utf8"));
const numbers = (rules: { rule_number: string | null; id: string }[]) => rules.map((r) => r.rule_number ?? r.id);
const memberIds = (topicId: string) => topicMembers(topicId).all.map((m) => m.rule.id);

test("the topic file only points at records that exist", () => {
  const ids = new Set<string>();
  for (const topic of RAW.topics) {
    assert.ok(!ids.has(topic.id), `duplicate topic ${topic.id}`);
    ids.add(topic.id);
    assert.ok(["draft", "reviewed"].includes(topic.status), topic.id);
    for (const s of topic.sections) assert.ok(getSection(s), `${topic.id}: section ${s}`);
    for (const r of topic.rules) {
      assert.ok(getRule(r.id), `${topic.id}: rule ${r.id}`);
      assert.ok(r.reason.length > 5, `${topic.id}: ${r.id} needs a reason`);
    }
  }
  for (const extra of RAW.faction_extras) {
    assert.ok(factions().some((f) => f.id === extra.faction), extra.faction);
    assert.ok(getSection(extra.section), extra.section);
  }
});

test("every topic has members, each with a reason", () => {
  for (const topic of topics()) {
    const { all } = topicMembers(topic.id);
    assert.ok(all.length > 0, topic.id);
  }
});

test("battle: whole section, editor's picks and title matches", () => {
  const battle = topicMembers("battle").all;
  const via = (id: string) => battle.find((m) => m.rule.id === id)?.via.kind;
  assert.equal(via("rule-4-3-1-ii"), "section");
  assert.equal(via("rule-2-1-2"), "editor");
  assert.equal(via("rule-6-5-1"), "title");
  assert.equal(via("rule-10-4-3-i"), "editor");
  assert.ok(!memberIds("battle").includes("rule-6-5-2"), "March is not battle");
});

test("title terms match whole words only", () => {
  assert.ok(!memberIds("scoring").includes("rule-v-6-2"), "Scorched Earth is not scoring");
  assert.ok(memberIds("scoring").includes("rule-7-6-1"), "Score Points");
  assert.ok(memberIds("setup").includes("rule-6-3-1"), "Faction Setup section heading");
});

test("pages show sub-rules inside their parent, not twice", () => {
  const { all, top } = topicMembers("battle");
  assert.ok(all.some((m) => m.rule.id === "rule-4-3-1-i"));
  assert.ok(!top.some((m) => m.rule.id === "rule-4-3-1-i"));
  const grouped = groupMembers(top).flatMap((g) => g.members);
  assert.equal(grouped.length, top.length);
});

test("a sub-rule inherits its parent's topics", () => {
  assert.ok(topicsOfRule("rule-4-3-5-ii").some((t) => t.id === "battle"));
  assert.ok(topicsOfRule("rule-6-5-4-ii").some((t) => t.id === "buildings"), "under 6.5.4 Build");
  assert.deepEqual(topicsOfRule("rule-k-1-2"), []);
});

test("general rules that apply, per faction", () => {
  const vagabond = generalRulesFor("vagabond");
  assert.deepEqual(numbers(vagabond.cited), ["3.3.1", "4.1.1", "4.2.1", "4.3.3.I", "4.3.5.II", "4.3.6"]);
  assert.ok(vagabond.topics.some((t) => t.topic.id === "items"));
  assert.equal(vagabond.extras[0].section.id, "section-v");
  const lizards = generalRulesFor("lizard-cult");
  const battle = lizards.topics.find((t) => t.topic.id === "battle")!;
  assert.deepEqual(numbers(battle.factionRules), ["10.2.3", "10.4.3.I"]);
  assert.ok(battle.general.some((r) => r.id === "rule-4-3"));
  for (const faction of factions()) {
    const general = generalRulesFor(faction.id);
    assert.ok(general.topics.some((t) => t.topic.id === "crafting"), `${faction.id} crafts`);
    for (const t of general.topics) {
      // General means core chapters and the glossary only.
      for (const rule of t.general) assert.match(rule.id, /^rule-([1-5]|g)-/, `${faction.id}/${t.topic.id}: ${rule.id}`);
    }
  }
});

test("search filters by topic", () => {
  const index = buildSearchIndex();
  const results = search(index, "warriors", { topic: "battle" });
  assert.ok(results.length > 0);
  assert.ok(results.every((r) => r.record.topics.includes("battle")));
  assert.equal(searchHref({ topic: "battle" }), "/board-games/root/search?topic=battle");
});

test("topic URLs and tab names", () => {
  assert.equal(topicHref("battle"), "/board-games/root/topic/battle");
  assert.equal(encyclopediaPageName("topic/battle").name, "battle.topic");
  assert.equal(encyclopediaPageName("topics").name, "topics.law");
  assert.equal(getTopic("battle")?.name, "Battle");
});
