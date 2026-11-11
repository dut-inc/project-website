// The Root rules MCP tools: lookups, text status, citations and filters.
//
// Run with: npm test   (node --experimental-strip-types --test)

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  SERVER_INSTRUCTIONS,
  forAI,
  getFactionRulesText,
  getRelatedRulesText,
  getRuleText,
  resolveRule,
  searchRulesText,
} from "./mcpTools.ts";

const ORIGIN = "https://example.test";

test("rules resolve from printed numbers and ids", () => {
  assert.equal(resolveRule("6.2.3")?.id, "rule-6-2-3");
  assert.equal(resolveRule("9.2.9.IIIa")?.id, "rule-9-2-9-iii-a");
  assert.equal(resolveRule("g.20")?.id, "rule-g-20");
  assert.equal(resolveRule("rule-4-3-5-ii")?.id, "rule-4-3-5-ii");
  assert.equal(resolveRule("4.3")?.id, "rule-4-3");
  assert.equal(resolveRule("6-intro"), undefined);
  assert.equal(resolveRule("99.9"), undefined);
  assert.equal(resolveRule("   "), undefined);
});

test("markup becomes readable text", () => {
  assert.equal(forAI("Take 2 {item:boots}. {icon}"), "Take 2 [boots]. [icon: see the PDF page]");
});

test("get_rule: text, source, status and links", () => {
  const text = getRuleText("6.2.3", ORIGIN);
  assert.match(text, /^# 6\.2\.3 Field Hospitals/);
  assert.match(text, /Whenever any number of Marquise warriors are removed/);
  assert.match(text, /Text status: checked by hand against the PDF\./);
  assert.ok(text.includes(`${ORIGIN}/data/root/Root_2025_Law.pdf#page=5`));
  assert.ok(text.includes(`${ORIGIN}/board-games/root/rule/6-2-3`));
});

test("get_rule says when text was not checked by hand", () => {
  assert.match(getRuleText("9.1", ORIGIN), /Text status: extracted automatically, not checked by hand\./);
});

test("get_rule includes sub-rules, parents, citations and faction icons", () => {
  const ambush = getRuleText("4.3.1", ORIGIN);
  assert.match(ambush, /\*\*4\.3\.1\.I Foil Ambush\*\*/);
  assert.match(ambush, /Cites: 4\.3\.1\.I Foil Ambush; 4\.3\.1\.II Resolve Ambush/);
  const sub = getRuleText("4.3.5.II", ORIGIN);
  assert.match(sub, /## Parent rules \(context\)\n\*\*4\.3\.5 Step 5: Count Hits\*\*/);
  assert.match(sub, /- Vagabond \(see 9\.2 Faction Rules and Abilities\)/);
  assert.match(getRuleText("4.3", ORIGIN), /Topics \(editorial grouping, not part of the Law\): Battle/);
  assert.match(getRuleText("5.1.5", ORIGIN), /2 \[boots\], 2 \[bag\]/);
});

test("unknown rules point to search", () => {
  assert.match(getRuleText("99.9", ORIGIN), /No rule "99\.9".*search_rules/);
  assert.match(getRelatedRulesText("nonsense", ORIGIN), /No rule "nonsense"/);
});

test("search_rules: results, filters, limits and empty results", () => {
  const text = searchRulesText({ query: "field hospitals" }, ORIGIN);
  assert.match(text, /\n1\. 6\.2\.3 Field Hospitals \(6\. Marquise de Cat › 6\.2 Faction Rules and Abilities, p\. 5, checked\)/);
  const limited = searchRulesText({ query: "warriors", limit: 3 }, ORIGIN);
  assert.match(limited, /showing the first 3/);
  assert.equal(limited.match(/^\d+\. /gm)?.length, 3);
  const vagabond = searchRulesText({ query: "battle", faction: "vagabond", limit: 25 }, ORIGIN);
  assert.match(vagabond, /\(faction: Vagabond\)/);
  assert.ok(!vagabond.includes("6.5.1 Battle"), "a Marquise rule");
  assert.match(searchRulesText({ query: "card", chapter: "G" }, ORIGIN), /chapter: Appendix G: Glossary/);
  assert.match(searchRulesText({ query: "battle", topic: "battle" }, ORIGIN), /topic: Battle \(editorial\)/);
  assert.match(searchRulesText({ query: "zzzqqq" }, ORIGIN), /^No rules match "zzzqqq"/);
});

test("get_faction_rules: chapter text and the faction page's groups", () => {
  const full = getFactionRulesText("lizard-cult", "full", ORIGIN);
  assert.match(full, /^# Lizard Cult\nChapter 10 .*The Riverfolk Expansion/);
  assert.match(full, /\*\*10\.4\.3\.I Crusade\*\*/);
  assert.match(full, /## General rules that apply/);
  assert.match(full, /- Battle, because of 10\.2\.3, 10\.4\.3\.I: /);
  assert.match(full, /## Rules the Lizard Cult changes\n.*\n- 2\.1 Cards/);
  const outline = getFactionRulesText("lizard-cult", "outline", ORIGIN);
  assert.ok(outline.length < full.length);
  assert.match(outline, /- 10\.4\.3\.I Crusade/);
  assert.match(getFactionRulesText("marquise-de-cat", "outline", ORIGIN), /icon on no rule outside its own chapter/);
  assert.match(getFactionRulesText("vagabond", "outline", ORIGIN), /Appendix V: Vagabonds \(editorial:/);
});

test("get_related_rules separates the Law from editorial links", () => {
  const text = getRelatedRulesText("4.3.1.I", ORIGIN);
  assert.match(text, /Parent rules:\n- 4\.3\.1 Step 1: Defender May Ambush/);
  assert.match(text, /Rules that cite it:\n- 4\.3\.1 /);
  assert.match(text, /Editorial \(not part of the Law\)/);
  const icons = getRelatedRulesText("4.2.1", ORIGIN);
  assert.match(icons, /Factions whose icon is printed on it/);
  assert.match(icons, /- Corvid Conspiracy: 13\.2 Faction Rules and Abilities, https:\/\/example\.test\/board-games\/root\/law\/13#section-13-2/);
});

test("server instructions carry the grounding rules", () => {
  assert.match(SERVER_INSTRUCTIONS, /Do not answer Root rules questions from memory/);
  assert.match(SERVER_INSTRUCTIONS, /not checked by hand|was not, say so/);
  assert.match(SERVER_INSTRUCTIONS, /Topics are an editorial grouping/);
  assert.match(SERVER_INSTRUCTIONS, /October 13, 2025/);
});
