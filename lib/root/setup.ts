// Builds the setup tools' inputs (lib/root/setupPlan.ts) from the Law and the
// owner's setup facts. Server only.
//
// - Reach: parsed from the Law's own table in 5.2, so a new edition's numbers
//   come in with a re-import. Parsing fails loudly if a faction is missing.
// - Corner starts: a faction whose setup section places pieces "in a corner
//   clearing" / "in any corner clearing".
// - Militant/insurgent and setup letters: data/root/editorial/setup.json (the
//   owner's; the Law doesn't print them).

import setupData from "../../data/root/editorial/setup.json" with { type: "json" };
import { factionStyle } from "./factionStyle.ts";
import { factions, getRule, rulesIn, sectionsOf, type Rule, type Section } from "./law.ts";
import type { FactionSetup, ReachTable, SetupCard } from "./setupPlan.ts";

const EDITORIAL = setupData as unknown as {
  decided: string;
  setup_letters: { rule: string; note: string };
  setup_cards: Record<string, string>;
};

export const SETUP_SOURCE = { decided: EDITORIAL.decided, lettersNote: EDITORIAL.setup_letters.note };

export const REACH_RULE_ID = "rule-5-2";

function cells(line: string): string[] {
  return line.split("|").map((cell) => cell.trim());
}

export function reachTable(): ReachTable & { values: Record<string, number>; secondVagabond: number } {
  const rule = getRule(REACH_RULE_ID);
  if (!rule) throw new Error("5.2 Reach is missing from the rule data.");
  const lines = rule.text.split("\n").filter((line) => line.includes("|"));
  const players = cells(lines.find((l) => l.startsWith("Players")) ?? "").slice(1).map(Number);
  const totals = cells(lines.find((l) => l.startsWith("Total Reach")) ?? "").slice(1).map((v) => parseInt(v, 10));
  if (!players.length || players.length !== totals.length || totals.some(Number.isNaN)) {
    throw new Error("Couldn't read the player rows of the 5.2 Reach table.");
  }
  const thresholds = Object.fromEntries(players.map((p, i) => [p, totals[i]]));
  const adventurous = Number(/any faction mix with (\d+)\+ Reach/.exec(rule.text)?.[1]);
  if (!adventurous) throw new Error("Couldn't read the adventurous reach minimum in 5.2.");

  const values: Record<string, number> = {};
  let secondVagabond = NaN;
  for (const line of lines) {
    const [name, value] = cells(line);
    const plainName = name.replace(/\s*\(.*\)$/, "");
    const faction = factions().find((f) => f.name === plainName);
    if (!faction) continue;
    const [first, second] = value.split("/").map(Number);
    values[faction.id] = first;
    if (faction.id === "vagabond") secondVagabond = second;
  }
  const missing = factions().filter((f) => values[f.id] === undefined);
  if (missing.length) throw new Error(`5.2 has no reach value for: ${missing.map((f) => f.name).join(", ")}.`);
  if (Number.isNaN(secondVagabond)) throw new Error("5.2 has no reach value for a second Vagabond.");
  return { thresholds, adventurous, values, secondVagabond };
}

// Each faction's "Faction Setup" section (6.3, 7.3, ...).
export function setupSectionOf(factionId: string): Section {
  const faction = factions().find((f) => f.id === factionId);
  const section = faction && sectionsOf(faction.chapter_section_id).find((s) => s.title === "Faction Setup");
  if (!section) throw new Error(`No Faction Setup section for ${factionId}.`);
  return section;
}

export function setupRules(factionId: string): Rule[] {
  return rulesIn(setupSectionOf(factionId).id).filter((rule) => !rule.parent_rule_id);
}

const CORNER_START = /\bin (?:a|any) corner clearing\b/i;

export function startsInCorner(factionId: string): boolean {
  return rulesIn(setupSectionOf(factionId).id).some((rule) => CORNER_START.test(rule.text));
}

export function factionSetups(): FactionSetup[] {
  const reach = reachTable();
  return factions().map((faction, index) => {
    const card = EDITORIAL.setup_cards[faction.id];
    if (card !== "militant" && card !== "insurgent") {
      throw new Error(`data/root/editorial/setup.json has no setup card type for ${faction.id}.`);
    }
    const section = setupSectionOf(faction.id);
    const { short, color } = factionStyle(faction.id);
    return {
      id: faction.id,
      name: faction.name,
      short,
      color,
      // Owner: setup letters follow the lawbook's faction order.
      letter: String.fromCharCode(65 + index),
      reach: reach.values[faction.id],
      ...(faction.id === "vagabond" ? { secondReach: reach.secondVagabond } : {}),
      card: card as SetupCard,
      corner: startsInCorner(faction.id),
      expansion: faction.expansion,
      setupSection: { number: section.number ?? "", title: section.title },
    };
  });
}
