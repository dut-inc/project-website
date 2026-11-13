// The species sets a quiz can draw from. Which species belong to which set
// is stored on each record (Fish.sets) by scripts/fish-id/import-inat.ts;
// this is only their names and descriptions.

import type { SetId } from "./types.ts";

export type SpeciesSet = {
  id: SetId;
  title: string;
};

export const SPECIES_SETS: readonly SpeciesSet[] = [
  {
    id: "world",
    title: "World",
  },
  {
    id: "pnw",
    title: "Pacific Northwest",
  },
];

export const DEFAULT_SET = SPECIES_SETS[0];

export function getSet(id: string | null | undefined): SpeciesSet | undefined {
  return SPECIES_SETS.find((set) => set.id === id);
}
