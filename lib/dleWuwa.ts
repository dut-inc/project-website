import resonators from "@/public/data/dles/wuwa/resonators.json";
import { pacificDateString } from "@/lib/dleGenshin";

export type WuwaSkill = {
  name: string;
  icon: string | null;
} | null;

export type WuwaForte = {
  resonance_skill: WuwaSkill;
  forte_circuit: WuwaSkill;
  resonance_liberation: WuwaSkill;
  intro_skill: WuwaSkill;
  outro_skill: WuwaSkill;
};

export type WuwaResonator = {
  name: string;
  icon: string | null;
  quality: number | null;
  element: string | null;
  element_icon: string | null;
  weapon: string | null;
  weapon_icon: string | null;
  affiliation: string | null;
  faction: string | null;
  class: string | null;
  version: string | null;
  status: "released" | "upcoming";
  forte: WuwaForte;
};

const rawResonators = resonators as WuwaResonator[];

export const WUWA_RESONATORS = rawResonators.filter(
  (resonator) => resonator.status === "released" && resonator.name && resonator.icon,
);

export const WUWA_FORTE_RESONATORS = WUWA_RESONATORS.filter(
  (resonator) => resonator.forte?.forte_circuit?.name,
);

export { pacificDateString };

export function getDailyWuwaResonator(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
  return WUWA_RESONATORS[((dayNumber % WUWA_RESONATORS.length) + WUWA_RESONATORS.length) % WUWA_RESONATORS.length];
}

export function getDailyWuwaForteResonator(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
  return WUWA_FORTE_RESONATORS[((dayNumber % WUWA_FORTE_RESONATORS.length) + WUWA_FORTE_RESONATORS.length) % WUWA_FORTE_RESONATORS.length];
}

export function normalizeResonatorName(name: string) {
  return name.trim().toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}
