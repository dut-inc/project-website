// Fish Identification Quiz: the shape of a species record. Kept apart from
// the data (species.ts) so client components can import the types without
// pulling the whole species list into the browser bundle.

export type SetId = "world" | "pnw";

// A photograph and everything needed to credit it. `src` is a local path
// (/images/fish-id/...) for hand-curated records, or an iNaturalist URL.
export type FishImage = {
  src: string;
  // A smaller copy for thumbnails, when the source offers one.
  thumb?: string;
  width: number;
  height: number;
  author: string;
  license: string;
  licenseUrl: string | null;
  source: string;
  sourceUrl: string;
};

export type Fish = {
  id: string;
  commonName: string;
  // Binomial: "Genus species". Always rendered in italics (components/fish-id/FishName.tsx).
  scientificName: string;
  family: string | null;
  habitat: string | null;
  distribution: string | null;
  description: string | null;
  // The sets this species is quizzed in (lib/fishId/sets.ts).
  sets: SetId[];
  // null when no suitable photograph has been found.
  image: FishImage | null;
};
