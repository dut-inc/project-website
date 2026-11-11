// Presentation only: short labels and accent colors for faction chips. These
// are not from the Law and say nothing about the rules. Names, expansions and
// rule membership come from data/root/law-*/factions.json.

export const FACTION_STYLE: Record<string, { short: string; color: string }> = {
  "marquise-de-cat": { short: "Marquise", color: "#e8823a" },
  "eyrie-dynasties": { short: "Eyrie", color: "#5b8fd9" },
  "woodland-alliance": { short: "Alliance", color: "#6fbf5a" },
  vagabond: { short: "Vagabond", color: "#b5b5ad" },
  "lizard-cult": { short: "Lizards", color: "#e3cf4c" },
  "riverfolk-company": { short: "Riverfolk", color: "#4fc1c1" },
  "underground-duchy": { short: "Duchy", color: "#d6a77a" },
  "corvid-conspiracy": { short: "Corvids", color: "#a77bd6" },
  "lord-of-the-hundreds": { short: "Hundreds", color: "#e0605a" },
  "keepers-in-iron": { short: "Keepers", color: "#a3a88c" },
  "lilypad-diaspora": { short: "Lilypad", color: "#5cc9a0" },
  "twilight-council": { short: "Council", color: "#8f9ae6" },
  "knaves-of-the-deepwood": { short: "Knaves", color: "#d98aa8" },
};

export function factionStyle(id: string): { short: string; color: string } {
  return FACTION_STYLE[id] ?? { short: id, color: "#9a978d" };
}
