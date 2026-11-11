// Builds the owner's review page for the editorial topics
// (data/root/editorial/topics.json): one card per topic and per faction extra,
// listing exactly what each collects and why, plus one card on how faction
// pages use topics.
//
//   node --experimental-strip-types scripts/root/make_topic_review.ts <out.html>

import { readFileSync, writeFileSync } from "node:fs";

import { chapterLabel, chapterOf, factions, getFaction, getSection, ruleLabel, SOURCE, type Rule } from "../../lib/root/law.ts";
import { generalRulesFor, topicMembers, topics, type Member } from "../../lib/root/topics.ts";

const out = process.argv[2];
if (!out) throw new Error("usage: make_topic_review.ts <out.html>");

const RAW = JSON.parse(readFileSync(new URL("../../data/root/editorial/topics.json", import.meta.url), "utf8"));

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const plain = (s: string) => s.replace(/\{item:([a-z]+)\}/g, "$1").replace(/\{icon\}/g, "icon").replace(/\*/g, "");
const num = (r: Rule) => (r.rule_number ? `<span class="num">${esc(r.rule_number)}</span>` : "");
const title = (r: Rule) => esc(plain(r.title ?? ruleLabel(r)));

function part(heading: string, body: string) {
  return `<div class="part"><h4>${heading}</h4>${body}</div>`;
}

function verdict() {
  return `<div class="verdict">
    <button type="button" class="ok" aria-pressed="false">Looks right</button>
    <button type="button" class="bad" aria-pressed="false">Problem</button>
    <button type="button" class="unsure" aria-pressed="false">Not sure</button>
    <input class="note" type="text" hidden aria-label="Note">
  </div>`;
}

function factionOf(rule: Rule): string {
  const id = chapterOf(rule.section_id).faction_id;
  return id ? (getFaction(id)?.name ?? "") : chapterLabel(chapterOf(rule.section_id));
}

const cards: string[] = [];

for (const topic of topics()) {
  const raw = RAW.topics.find((t: { id: string }) => t.id === topic.id);
  const { all } = topicMembers(topic.id);
  const bySection = new Map<string, Member[]>();
  for (const m of all) if (m.via.kind === "section") bySection.set(m.via.sectionId, [...(bySection.get(m.via.sectionId) ?? []), m]);
  const titleMatches = all.filter((m) => m.via.kind === "title");
  const usedBy = factions().filter((f) => generalRulesFor(f.id).topics.some((t) => t.topic.id === topic.id));

  const parts: string[] = [];
  if (bySection.size) {
    const items = [...bySection].map(([sectionId, members]) => {
      const section = getSection(sectionId)!;
      const label = section.level === 1 ? chapterLabel(section) : `${section.number} ${section.title}`;
      const where = section.level === 2 && chapterOf(section.id).faction_id ? ` (${esc(getFaction(chapterOf(section.id).faction_id!)!.name)})` : "";
      return `<li>${esc(label)}${where} <span class="muted">· ${members.length} ${members.length === 1 ? "entry" : "entries"}</span></li>`;
    });
    const heading = raw.section_titles?.length
      ? `Whole sections (including every section headed “${raw.section_titles.map(esc).join("”, “")}”)`
      : "Whole sections";
    parts.push(part(heading, `<ul>${items.join("")}</ul>`));
  }
  if (topic.rules.length) {
    const items = topic.rules.map((pick) => {
      const m = all.find((x) => x.rule.id === pick.id)!;
      return `<li>${num(m.rule)}${title(m.rule)} <span class="muted">(${esc(factionOf(m.rule))})</span> — <span class="why">${esc(pick.reason)}</span></li>`;
    });
    parts.push(part("Picked one by one", `<ul>${items.join("")}</ul>`));
  }
  if (topic.title_terms.length) {
    const terms = topic.title_terms.map((t) => `“${esc(t)}”`).join(", ");
    const items = titleMatches.map((m) => `<li class="chip">${num(m.rule)}${title(m.rule)} <span class="fac">${esc(factionOf(m.rule))}</span></li>`);
    parts.push(part(`Found by a word in the title: ${terms}`, items.length ? `<ul class="inline">${items.join("")}</ul>` : `<p class="muted">No other titles match.</p>`));
  }
  parts.push(
    part(
      "Listed as a general rule on these faction pages",
      `<p class="muted">${usedBy.length ? usedBy.map((f) => esc(f.name)).join(", ") : "None (no faction has its own rule on this topic, or the topic has no core rules)."}</p>`,
    ),
  );

  cards.push(`<article class="card" data-id="topic:${topic.id}" data-label="Topic: ${esc(topic.name)}">
  <div class="head"><span class="kind">Topic</span><h3>${esc(topic.name)}</h3><span class="count">${all.length} entries</span></div>
  <p class="desc">${esc(topic.description)}</p>
  ${parts.join("\n  ")}
  <p class="question">Does everything here belong under ${esc(topic.name)}, and is anything important missing?</p>
  ${verdict()}
</article>`);
}

cards.push(`<h2 class="group">Faction pages</h2>`);

for (const extra of RAW.faction_extras) {
  const faction = getFaction(extra.faction)!;
  const section = getSection(extra.section)!;
  cards.push(`<article class="card" data-id="extra:${extra.faction}:${extra.section}" data-label="${esc(faction.name)} page: ${esc(chapterLabel(section))}">
  <div class="head"><span class="kind">Faction page</span><h3>${esc(faction.name)} → ${esc(chapterLabel(section))}</h3></div>
  <p class="desc">${esc(extra.reason)}</p>
  <p class="question">Should the ${esc(faction.name)} page list ${esc(chapterLabel(section))} under “General rules that apply”?</p>
  ${verdict()}
</article>`);
}

const example = generalRulesFor("lizard-cult").topics.find((t) => t.topic.id === "battle")!;
cards.push(`<article class="card" data-id="mechanism" data-label="How faction pages pick general rules">
  <div class="head"><span class="kind">Faction pages</span><h3>How “General rules that apply” is chosen</h3></div>
  <p class="desc">Each faction page lists, under “General rules that apply”: the rules its chapter cites by number (straight from the Law), then, for every topic where the faction has its own rule, that topic's core rules and glossary entries. Example: the Lizard Cult has ${example.factionRules.map((r) => `${esc(r.rule_number ?? "")} ${title(r)}`).join(" and ")} in Battle, so its page lists Battle's ${example.general.length} core rules (4.3 Battle, 2.1.2 Ambush Cards…).</p>
  <p class="question">Is this a useful way to decide what applies to a faction?</p>
  ${verdict()}
</article>`);

const template = readFileSync(new URL("./topic_review_template.html", import.meta.url), "utf8");
const count = cards.filter((c) => c.startsWith("<article")).length;
const html = template
  .replace("{{CARDS}}", cards.join("\n"))
  .replace(/\{\{COUNT\}\}/g, String(count))
  .replace(/\{\{VERSION\}\}/g, SOURCE.source_version)
  .replace(/\{\{DRAFTED\}\}/g, RAW.drafted);
writeFileSync(out, html);
console.log(`Wrote ${count} cards to ${out}`);
