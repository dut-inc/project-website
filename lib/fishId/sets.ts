// The species sets a quiz can draw from. Which species belong to which set
// is stored on each record (Fish.sets) by scripts/fish-id/import-inat.ts;
// this is only their names and descriptions.

import type { SetId } from "./types.ts";

export type SpeciesSet = {
  id: SetId;
  title: string;
  // Follows the species count on the selection screen: "1004 fishes, ..."
  lede: string;
};

export const SPECIES_SETS: readonly SpeciesSet[] = [
  {
    id: "world",
    title: "World",
    lede: "the ones iNaturalist observers record most often in the wild, from coral reefs to rivers.",
  },
  {
    id: "pnw",
    title: "Pacific Northwest",
    lede: "recorded in Washington, Oregon, Idaho and British Columbia, from tide pools to mountain lakes.",
  },
];

export const DEFAULT_SET = SPECIES_SETS[0];

export function getSet(id: string | null | undefined): SpeciesSet | undefined {
  return SPECIES_SETS.find((set) => set.id === id);
}
