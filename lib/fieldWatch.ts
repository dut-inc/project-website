// Field Watch — shared types, data, and helpers.
//
// Everything the UI needs (types, species catalog, seeded sights,
// localStorage helpers, and the v0 color-sampling "ID" stub) lives here
// so the React components stay simple.

export type FieldCategory = "bird" | "fish" | "mammal" | "plant" | "other";

export type FieldSpecies = {
  id: string;
  common: string;
  scientific: string;
  category: FieldCategory;
  // HSL bias that makes the v0 stub more likely to pick this species
  // when the dominant pixel color matches.
  prefers: {
    hueCenter: number; // 0-360
    hueSpread: number; // ± degrees, inclusive
    satMin: number; // 0-1
  };
};

export type FieldSighting = {
  id: string;
  speciesId: string;
  confidence: number; // 0-1
  x: number; // 0-1 SVG coords
  y: number; // 0-1 SVG coords
  thumb: string; // data URL, JPEG
  createdAt: number; // ms epoch
  // The user's fallback label, e.g. "from a hike at Carkeek".
  caption?: string;
};

// --- PNW catalog ----------------------------------------------------------
// Pick a small set that's recognizable around Seattle + the Olympics + the
// Cascades. The `prefers` block is what the v0 color stub keys off of:
// when an upload's dominant pixel hue lands inside `hueCenter ± hueSpread`
// at saturation above `satMin`, this species becomes a top candidate.

export const FIELD_SPECIES: FieldSpecies[] = [
  {
    id: "bald-eagle",
    common: "Bald eagle",
    scientific: "Haliaeetus leucocephalus",
    category: "bird",
    prefers: { hueCenter: 30, hueSpread: 25, satMin: 0.15 },
  },
  {
    id: "great-blue-heron",
    common: "Great blue heron",
    scientific: "Ardea herodias",
    category: "bird",
    prefers: { hueCenter: 200, hueSpread: 25, satMin: 0.15 },
  },
  {
    id: "barred-owl",
    common: "Barred owl",
    scientific: "Strix varia",
    category: "bird",
    prefers: { hueCenter: 25, hueSpread: 18, satMin: 0.05 },
  },
  {
    id: "pacific-salmon",
    common: "Pacific salmon",
    scientific: "Oncorhynchus sp.",
    category: "fish",
    prefers: { hueCenter: 15, hueSpread: 30, satMin: 0.2 },
  },
  {
    id: "harbor-seal",
    common: "Harbor seal",
    scientific: "Phoca vitulina",
    category: "mammal",
    prefers: { hueCenter: 200, hueSpread: 30, satMin: 0.05 },
  },
  {
    id: "douglas-squirrel",
    common: "Douglas squirrel",
    scientific: "Tamiasciurus douglasii",
    category: "mammal",
    prefers: { hueCenter: 18, hueSpread: 20, satMin: 0.2 },
  },
  {
    id: "douglas-fir",
    common: "Douglas fir",
    scientific: "Pseudotsuga menziesii",
    category: "plant",
    prefers: { hueCenter: 130, hueSpread: 25, satMin: 0.2 },
  },
  {
    id: "pacific-madrone",
    common: "Pacific madrone",
    scientific: "Arbutus menziesii",
    category: "plant",
    prefers: { hueCenter: 100, hueSpread: 20, satMin: 0.15 },
  },
  {
    id: "skunk-cabbage",
    common: "Skunk cabbage",
    scientific: "Lysichiton americanus",
    category: "plant",
    prefers: { hueCenter: 60, hueSpread: 30, satMin: 0.25 },
  },
];

export function speciesById(id: string): FieldSpecies | undefined {
  return FIELD_SPECIES.find((s) => s.id === id);
}

// --- Seed sights -----------------------------------------------------------
// A few PNW sightings to fill the map on first load. Cleared the moment
// the user adds their own.

export const FIELD_SEED_SIGHTINGS: Omit<FieldSighting, "thumb">[] = [
  {
    id: "seed-discovery-park",
    speciesId: "bald-eagle",
    confidence: 0.92,
    x: 0.22,
    y: 0.18,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
    caption: "Discovery Park — perched in a madrone",
  },
  {
    id: "seed-alki",
    speciesId: "harbor-seal",
    confidence: 0.88,
    x: 0.34,
    y: 0.55,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    caption: "Alki — hauled out on the sandbar",
  },
  {
    id: "seed-carkeek",
    speciesId: "great-blue-heron",
    confidence: 0.81,
    x: 0.28,
    y: 0.32,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    caption: "Carkeek Park — at the tide line",
  },
  {
    id: "seed-washington-park",
    speciesId: "pacific-madrone",
    confidence: 0.74,
    x: 0.74,
    y: 0.12,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
    caption: "Washington Park — the madrone grove",
  },
  {
    id: "seed-lake-wa",
    speciesId: "pacific-salmon",
    confidence: 0.69,
    x: 0.6,
    y: 0.5,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    caption: "Lake Washington — incoming run",
  },
];

// --- localStorage ----------------------------------------------------------

const STORAGE_KEY = "fieldWatch.sightings.v1";

export function loadStoredSightings(): FieldSighting[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is FieldSighting =>
        s &&
        typeof s === "object" &&
        typeof s.id === "string" &&
        typeof s.speciesId === "string"
    );
  } catch (_e) {
    // Corrupt JSON or storage full — just start empty.
    return [];
  }
}

export function saveStoredSightings(sightings: FieldSighting[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sightings));
  } catch (_e) {
    // Storage full or denied — silently drop. The map will show fewer pins
    // in-session than total; we just can't keep them past a refresh.
  }
}

// --- v0 color-sampling "species ID" stub -----------------------------------
//
// This is **not** a real classifier. It samples a 16x16 grid of pixels from
// a downscaled canvas version of the uploaded image and computes:
//
//   - average saturation
//   - weighted average hue (only meaningful when saturation is high)
//
// It then scores each catalog species by how close the dominant hue lands
// to the species' `prefers.hueCenter`. The best match becomes the "guess",
// the runners-up become "alternatives". Confidence is the best score
// rescaled to [0.5, 0.95] so it neither feels perfect nor hopeless.
//
// Why honest about being a stub? The project description still lists
// "species ID model" as PLANNING — pretending otherwise would mislead.

export type FieldIdResult = {
  best: FieldSpecies;
  alternatives: FieldSpecies[];
  confidence: number;
  avgSaturation: number;
  avgHue: number;
};

export async function readImageFileAsCanvas(
  file: File
): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not decode image"));
      el.src = url;
    });
    const target = 64; // small — we only need a color histogram.
    const ratio = Math.min(target / img.width, target / img.height, 1);
    const w = Math.max(1, Math.round(img.width * ratio));
    const h = Math.max(1, Math.round(img.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D not available");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function sampleColor(canvas: HTMLCanvasElement): {
  hue: number;
  saturation: number;
} {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { hue: 0, saturation: 0 };
  const { width, height } = canvas;
  const image = ctx.getImageData(0, 0, width, height).data;

  // Convert RGB→HSL incremental running averages for hue/sat.
  // Hue is computed on a circular mean so red wraps around to red.
  let sumW = 0;
  let sumSat = 0;
  let sumCos = 0;
  let sumSin = 0;
  for (let i = 0; i < image.length; i += 4) {
    const r = image[i] / 255;
    const g = image[i + 1] / 255;
    const b = image[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    let s = 0;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
    }
    let h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    // Weight by saturation — grays shouldn't drag hue around.
    const w = s;
    sumW += w;
    sumSat += s;
    if (w > 0) {
      const rad = (h / 360) * 2 * Math.PI;
      sumCos += Math.cos(rad) * w;
      sumSin += Math.sin(rad) * w;
    }
  }
  const avgSaturation = sumW === 0 ? 0 : sumSat / (image.length / 4);
  let avgHue = 0;
  if (sumW > 0.01) {
    avgHue = (Math.atan2(sumSin, sumCos) * 360) / (2 * Math.PI);
    if (avgHue < 0) avgHue += 360;
  }
  return { hue: avgHue, saturation: avgSaturation };
}

export function runIdStub(canvas: HTMLCanvasElement): FieldIdResult {
  const { hue, saturation } = sampleColor(canvas);

  type Scored = { species: FieldSpecies; score: number };
  const scored: Scored[] = FIELD_SPECIES.map((sp) => {
    const hueDelta = Math.abs(shortestHueDelta(hue, sp.prefers.hueCenter));
    const inHueRange = hueDelta <= sp.prefers.hueSpread;
    const satOk = saturation >= sp.prefers.satMin;
    // Base score: how close the hue lands to center, falling off linearly.
    const closeness = 1 - hueDelta / 180;
    let score = closeness * (satOk ? 1 : 0.6);
    if (inHueRange) score += 0.05;
    return { species: sp, score };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0].species;
  const alternatives = scored.slice(1, 3).map((s) => s.species);

  // Re-scale confidence into a believable bar range [0.45, 0.95].
  // Best score is typically 0.6-1.1; map to that band.
  const raw = Math.max(0, Math.min(1, scored[0].score));
  const confidence = 0.45 + 0.5 * raw;

  return {
    best,
    alternatives,
    confidence,
    avgHue: hue,
    avgSaturation: saturation,
  };
}

function shortestHueDelta(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

// --- Thumbnail helpers -----------------------------------------------------
// We need small images in localStorage or it fills up fast. This decodes
// the file, downsizes to <=320px on the long edge, and re-encodes as JPEG.

export async function makeThumbnailDataUrl(
  file: File,
  maxEdge = 320
): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not decode image"));
      el.src = url;
    });
    const ratio = Math.min(maxEdge / img.width, maxEdge / img.height, 1);
    const w = Math.max(1, Math.round(img.width * ratio));
    const h = Math.max(1, Math.round(img.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D not available");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.78);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function formatStamp(ts: number): string {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}
