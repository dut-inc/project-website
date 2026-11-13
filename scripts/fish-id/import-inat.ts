// Builds data/fish-id/species.json for the Fish Identification Quiz from
// iNaturalist (https://api.inaturalist.org/v1, no key needed).
//
//   node --experimental-strip-types scripts/fish-id/import-inat.ts
//
// Two sets come out of it:
//   world  the WORLD_SIZE fish species with the most research-grade
//          observations anywhere
//   pnw    every fish species with at least PNW_MIN_OBSERVATIONS research-grade
//          observations in Washington, Oregon, Idaho and British Columbia
//
// For each species it takes iNaturalist's English common name, its family,
// its default photo (hotlinked from iNaturalist, credited) and the first
// sentence of the Wikipedia summary iNaturalist carries.
//
// Hand-curated records (the ones whose photo is a local file under
// public/images/fish-id/) are kept: their photo, habitat, range and notes win,
// they are always in the world set, and only their common name is refreshed so
// every name in the quiz uses the same capitalisation.
//
// The API asks for about one request a second; a full run makes ~120 requests.

import { readFileSync, writeFileSync } from "node:fs";

const API = "https://api.inaturalist.org/v1";
// Ray-finned fishes, cartilaginous fishes (sharks, rays, chimaeras), lampreys, hagfishes.
const FISH_TAXA = [47178, 196614, 49231, 49099];
const WORLD_SIZE = 1000;
// Washington, Oregon, Idaho, British Columbia.
const PNW_PLACES = [46, 10, 22, 7085];
const PNW_MIN_OBSERVATIONS = 3;
const DESCRIPTION_MAX = 300;
const OUT = new URL("../../data/fish-id/species.json", import.meta.url);

type SetId = "world" | "pnw";

type Photo = {
  id: number;
  url: string;
  license_code: string | null;
  attribution: string;
  attribution_name?: string | null;
  original_dimensions?: { width: number; height: number } | null;
};

type Taxon = {
  id: number;
  name: string;
  rank: string;
  preferred_common_name?: string;
  ancestor_ids: number[];
  default_photo?: Photo | null;
  wikipedia_summary?: string | null;
};

type FishImage = {
  src: string;
  thumb?: string;
  width: number;
  height: number;
  author: string;
  license: string;
  licenseUrl: string | null;
  source: string;
  sourceUrl: string;
};

type Fish = {
  id: string;
  commonName: string;
  scientificName: string;
  family: string | null;
  habitat: string | null;
  distribution: string | null;
  description: string | null;
  sets: SetId[];
  image: FishImage | null;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let requests = 0;
async function get<T>(path: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    await sleep(1100);
    requests++;
    const res = await fetch(API + path, { headers: { "User-Agent": "fish-id-quiz-import/1.0" } });
    if (res.ok) return (await res.json()) as T;
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      console.warn(`  ${res.status} on ${path}, retrying`);
      await sleep(5000 * (attempt + 1));
      continue;
    }
    throw new Error(`${res.status} ${res.statusText}: ${path}`);
  }
}

const BINOMIAL = /^[A-Z][a-z]+ [a-z]+(-[a-z]+)?$/;

function usable(taxon: Taxon): boolean {
  return taxon.rank === "species" && BINOMIAL.test(taxon.name) && Boolean(taxon.preferred_common_name) && Boolean(taxon.default_photo);
}

// Species with their observation counts, most observed first.
async function speciesCounts(params: string, limit: number, minCount = 1): Promise<{ taxon: Taxon; count: number }[]> {
  const out: { taxon: Taxon; count: number }[] = [];
  for (let page = 1; out.length < limit; page++) {
    const data = await get<{ results: { taxon: Taxon; count: number }[] }>(
      `/observations/species_counts?taxon_id=${FISH_TAXA}&quality_grade=research&hrank=species&lrank=species&locale=en&per_page=500&page=${page}&${params}`,
    );
    if (data.results.length === 0) break;
    for (const row of data.results) {
      if (row.count < minCount) return out;
      if (usable(row.taxon)) out.push(row);
      if (out.length === limit) break;
    }
  }
  return out;
}

// Every family under the fish taxa, id -> name.
async function fishFamilies(): Promise<Map<number, string>> {
  const families = new Map<number, string>();
  for (const root of FISH_TAXA) {
    for (let page = 1; ; page++) {
      const data = await get<{ results: { id: number; name: string }[]; total_results: number }>(
        `/taxa?taxon_id=${root}&rank=family&per_page=500&page=${page}`,
      );
      for (const t of data.results) families.set(t.id, t.name);
      if (page * 500 >= data.total_results) break;
    }
  }
  return families;
}

// Full records (with wikipedia_summary), 30 ids per request.
async function details(ids: number[]): Promise<Map<number, Taxon>> {
  const out = new Map<number, Taxon>();
  for (let i = 0; i < ids.length; i += 30) {
    const data = await get<{ results: Taxon[] }>(`/taxa/${ids.slice(i, i + 30).join(",")}?locale=en`);
    for (const t of data.results) out.set(t.id, t);
    if (i % 300 === 0) console.log(`  details ${Math.min(i + 30, ids.length)}/${ids.length}`);
  }
  return out;
}

async function findByName(name: string): Promise<Taxon | undefined> {
  const data = await get<{ results: Taxon[] }>(`/taxa?q=${encodeURIComponent(name)}&rank=species&is_active=true&locale=en&per_page=5`);
  return data.results.find((t) => t.name === name);
}

// The first sentence of a Wikipedia summary, as plain text. Periods after a
// single capital (a genus abbreviation like "O. mykiss") or a common
// abbreviation don't end a sentence.
function firstSentence(html: string | null | undefined): string | null {
  if (!html) return null;
  const text = html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  // Some summaries are just "..." when Wikipedia has nothing.
  if (text.length < 25 || !/[a-z]{3}/.test(text)) return null;
  const end = /[.!?](?=\s+[A-Z(]|$)/g;
  for (let m = end.exec(text); m; m = end.exec(text)) {
    const before = text.slice(0, m.index);
    if (/(^|[\s(])([A-Z]|c|ca|e\.g|i\.e|St|Mt|approx|sp|spp|var|subsp|cf|vs|Dr|No)$/.test(before)) continue;
    const sentence = text.slice(0, m.index + 1);
    return sentence.length <= DESCRIPTION_MAX ? sentence : null;
  }
  return text.length <= DESCRIPTION_MAX && text.length > 0 ? text : null;
}

const LICENSE: Record<string, string> = {
  cc0: "CC0",
  "cc-by": "CC BY",
  "cc-by-sa": "CC BY-SA",
  "cc-by-nd": "CC BY-ND",
  "cc-by-nc": "CC BY-NC",
  "cc-by-nc-sa": "CC BY-NC-SA",
  "cc-by-nc-nd": "CC BY-NC-ND",
  pd: "Public domain",
};

// iNaturalist serves each photo at square (75px), small (240), medium (500)
// and large (1024 on the long side). The quiz shows "large" and uses "small"
// for thumbnails.
function inatImage(photo: Photo): FishImage {
  const size = (name: string) => photo.url.replace(/\/square\.(\w+)/, `/${name}.$1`);
  const dims = photo.original_dimensions;
  const scale = dims ? Math.min(1, 1024 / Math.max(dims.width, dims.height)) : 1;
  const author =
    photo.attribution_name ||
    photo.attribution.match(/^\(c\)\s*(.+?),\s*(some|all|no) rights/)?.[1] ||
    photo.attribution;
  return {
    src: size("large"),
    thumb: size("small"),
    width: dims ? Math.round(dims.width * scale) : 1024,
    height: dims ? Math.round(dims.height * scale) : 768,
    author,
    license: photo.license_code ? (LICENSE[photo.license_code] ?? photo.license_code.toUpperCase()) : "All rights reserved",
    licenseUrl: null,
    source: "iNaturalist",
    sourceUrl: `https://www.inaturalist.org/photos/${photo.id}`,
  };
}

// iNaturalist capitalises nearly every English name ("Pacific Staghorn
// Sculpin", "Yellow-edged Moray"); a few come through lower case. Four choices
// in mixed case would give the odd one away, so every word is capitalised.
const SMALL_WORDS = new Set(["of", "the", "and", "de", "del", "la", "van", "von"]);
function titleCase(name: string): string {
  return name
    .split(" ")
    .map((word, i) => (i > 0 && SMALL_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  const existing = JSON.parse(readFileSync(OUT, "utf8")) as { species: Fish[] };
  const curated = existing.species.filter((f) => f.image?.src.startsWith("/"));
  console.log(`${curated.length} hand-curated records kept`);

  console.log("World: most-observed fish species");
  const world = await speciesCounts("", WORLD_SIZE);
  console.log(`  ${world.length} species`);
  console.log("Pacific Northwest");
  const pnw = await speciesCounts(`place_id=${PNW_PLACES}`, 5000, PNW_MIN_OBSERVATIONS);
  console.log(`  ${pnw.length} species`);

  console.log("Families");
  const families = await fishFamilies();
  console.log(`  ${families.size} families`);

  // Every species once, most observed first, with the sets it belongs to.
  const taxa = new Map<number, { taxon: Taxon; count: number; sets: Set<SetId> }>();
  for (const [set, rows] of [["world", world], ["pnw", pnw]] as const) {
    for (const { taxon, count } of rows) {
      const entry = taxa.get(taxon.id) ?? { taxon, count, sets: new Set<SetId>() };
      entry.count = Math.max(entry.count, count);
      entry.sets.add(set);
      taxa.set(taxon.id, entry);
    }
  }

  console.log("Curated species on iNaturalist");
  const curatedTaxa = new Map<string, Taxon>();
  for (const fish of curated) {
    const taxon = [...taxa.values()].find((e) => e.taxon.name === fish.scientificName)?.taxon ?? (await findByName(fish.scientificName));
    if (taxon) curatedTaxa.set(fish.scientificName, taxon);
    else console.warn(`  ! ${fish.scientificName} not found under that name; keeping its curated common name`);
  }

  console.log("Wikipedia summaries");
  const full = await details([...taxa.keys()]);

  const familyOf = (taxon: Taxon) => taxon.ancestor_ids.map((id) => families.get(id)).find(Boolean) ?? null;
  const out: Fish[] = [];
  const seenCommon = new Set<string>();
  const seenScientific = new Set<string>();
  const take = (fish: Fish) => {
    const key = fish.commonName.toLowerCase();
    if (seenCommon.has(key) || seenScientific.has(fish.scientificName)) {
      console.warn(`  - dropped ${fish.scientificName} (${fish.commonName}): name already taken`);
      return;
    }
    seenCommon.add(key);
    seenScientific.add(fish.scientificName);
    out.push(fish);
  };

  for (const fish of curated) {
    const taxon = curatedTaxa.get(fish.scientificName);
    const entry = taxon ? taxa.get(taxon.id) : undefined;
    take({
      ...fish,
      commonName: titleCase(taxon?.preferred_common_name ?? fish.commonName),
      family: fish.family ?? (taxon ? familyOf(taxon) : null),
      sets: ["world", ...(entry?.sets.has("pnw") ? (["pnw"] as const) : [])],
    });
  }

  const ranked = [...taxa.values()].sort((a, b) => b.count - a.count);
  for (const { taxon, sets } of ranked) {
    if (seenScientific.has(taxon.name)) continue;
    take({
      id: slug(taxon.name),
      commonName: titleCase(taxon.preferred_common_name!),
      scientificName: taxon.name,
      family: familyOf(taxon),
      habitat: null,
      distribution: null,
      description: firstSentence(full.get(taxon.id)?.wikipedia_summary),
      sets: (["world", "pnw"] as const).filter((s) => sets.has(s)),
      image: inatImage(taxon.default_photo!),
    });
  }

  out.sort((a, b) => a.scientificName.localeCompare(b.scientificName));
  const count = (set: SetId) => out.filter((f) => f.sets.includes(set)).length;
  const file = {
    _comment:
      "Fish Identification Quiz species. Generated by scripts/fish-id/import-inat.ts from iNaturalist (common names, families, photos) and the Wikipedia summaries iNaturalist carries. Records with a local photo under public/images/fish-id/ are hand-curated: re-running the import keeps them. Set image to null when no suitable photograph exists.",
    generated: new Date().toISOString().slice(0, 10),
    species: out,
  };
  writeFileSync(OUT, JSON.stringify(file, null, 2) + "\n");
  console.log(`Wrote ${out.length} species (world ${count("world")}, pnw ${count("pnw")}) in ${requests} requests.`);
}

await main();
