import characters from "@/public/data/dles/genshin/characters.json";

export type GenshinCharacter = {
  name: string;
  icon: string | null;
  quality: number | null;
  element: string;
  element_icon: string | null;
  weapon: string;
  weapon_icon: string | null;
  region: string;
  region_icon: string | null;
  version: string;
};

const rawCharacters = characters as GenshinCharacter[];

// The source page currently contains duplicate rows. Keep one complete record
// per character so guesses and the daily pool stay predictable.
export const GENSHIN_CHARACTERS: GenshinCharacter[] = Array.from(
  new Map(rawCharacters.map((character) => [character.name, character])).values(),
).filter((character) => character.name && character.icon);

// The daily puzzle flips at midnight Pacific time (PDT in summer, PST in
// America/Los_Angeles.
const PACIFIC_TIME_ZONE = "America/Los_Angeles";

export function pacificDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

// dateString is a calendar day in Pacific time, e.g. "2026-09-04". The same
// day number feeds the rotation, so the puzzle changes at Pacific midnight.
export function getDailyGenshinCharacter(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
  return GENSHIN_CHARACTERS[((dayNumber % GENSHIN_CHARACTERS.length) + GENSHIN_CHARACTERS.length) % GENSHIN_CHARACTERS.length];
}

export function normalizeCharacterName(name: string) {
  return name.trim().toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}
