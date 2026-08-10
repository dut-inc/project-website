// Coordinates are real, photos are scenic SVG placeholders in public/images/sightings/.

export type SightingCategory = "mammal" | "bird" | "fish" | "plant" | "other";

export type Sighting = {
  id: string;
  species: string;
  category: SightingCategory;
  location: string;
  lat: number;
  lng: number;
  date: string;
  observer: string;
  note: string;
  photo: string; // public URL of the compressed photo in Supabase Storage
//   color?: string; // marker + card accent, from the site palette
};

// Legacy marker from before the Storage migration
export const LOCAL_PHOTO_PREFIX = "local:";
// Fallback shown when a sighting's local photo is missing
export const PLACEHOLDER_PHOTO = "/images/sightings/coast.svg";

export function isSightingCategory(value: unknown): value is SightingCategory {
  return typeof value === "string" && value in CATEGORY_META;
}

export function makeSightingId() {
  return `sighting-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Map a Supabase `sightings` row into the client-side Sighting shape.
// Rows that fail validation (missing id/species or bad coords) are dropped.
export function toSighting(row: Record<string, unknown>): Sighting | null {
  const id = typeof row.id === "string" && row.id.trim() ? row.id : null;
  const species = typeof row.species === "string" ? row.species.trim() : "";
  const category = row.category;
  const location = typeof row.location === "string" ? row.location.trim() : "";
  const lat = typeof row.lat === "number" && Number.isFinite(row.lat) ? row.lat : null;
  const lng = typeof row.lng === "number" && Number.isFinite(row.lng) ? row.lng : null;
  const date = typeof row.date === "string" ? row.date : "";
  const observer = typeof row.observer === "string" ? row.observer : "";
  const note = typeof row.note === "string" ? row.note : "";
  const rawPhoto = typeof row.photo === "string" && row.photo ? row.photo : "";
  const photo = rawPhoto.startsWith(LOCAL_PHOTO_PREFIX)
    ? PLACEHOLDER_PHOTO
    : rawPhoto || PLACEHOLDER_PHOTO;

  if (!id || !species || !isSightingCategory(category) || !location || lat === null || lng === null) {
    return null;
  }

  return { id, species, category, location, lat, lng, date, observer, note, photo };
}


export const CATEGORY_META: Record<SightingCategory, { label: string; color: string }> = {
  mammal: { label: "Mammal", color: "#C1442D" },
  bird: { label: "Bird", color: "#274B6D" },
  fish: { label: "Fish", color: "#2F7A6B" },
  plant: { label: "Plant", color: "#4D674D" },
  other: { label: "Other", color: "#C9A227" },
};

// example sightings
export const SIGHTINGS: Sighting[] = [
  {
    id: "bald-eagle",
    species: "Bald Eagle",
    category: "bird",
    location: "Discovery Park, Seattle",
    lat: 47.6607,
    lng: -122.4234,
    date: "2026-07-18",
    observer: "Maya",
    note: "Perched on the south bluff overlook, watching the ferry lanes.",
    photo: "/images/sightings/coast.svg",
    // color: "#274B6D",
  },
  {
    id: "chinook-salmon",
    species: "Chinook Salmon",
    category: "fish",
    location: "Ballard Locks Fish Ladder",
    lat: 47.6662,
    lng: -122.3974,
    date: "2026-07-20",
    observer: "Sam",
    note: "Big run coming through — counted ~40 in twenty minutes.",
    photo: "/images/sightings/river.svg",
    // color: "#2F7A6B",
  },
  {
    id: "orca",
    species: "Southern Resident Orca",
    category: "mammal",
    location: "Lime Kiln Point, San Juan Island",
    lat: 48.5156,
    lng: -123.1523,
    date: "2026-07-22",
    observer: "Jordan",
    note: "J-pod off the west side, hunting near the kelp beds.",
    photo: "/images/sightings/coast.svg",
    // color: "#C1442D",
  },
  {
    id: "banana-slug",
    species: "Banana Slug",
    category: "other",
    location: "Hoh Rainforest, Olympic NP",
    lat: 47.8619,
    lng: -123.9328,
    date: "2026-07-25",
    observer: "Priya",
    note: "Big one — the size of my hand — crossing the Hall of Mosses trail.",
    photo: "/images/sightings/forest.svg",
    // color: "#C9A227",
  },
  {
    id: "bog-laurustinus",
    species: "Bog Laurel",
    category: "plant",
    location: "Nisqually Wildlife Refuge",
    lat: 47.0824,
    lng: -122.7046,
    date: "2026-07-27",
    observer: "Maya",
    note: "Pink blossoms along the boardwalk; first time I've seen one here.",
    photo: "/images/sightings/marsh.svg",
    // color: "#4D674D",
  },
  {
    id: "marmot",
    species: "Olympic Marmot",
    category: "mammal",
    location: "Hurricane Ridge",
    lat: 47.9715,
    lng: -123.5007,
    date: "2026-07-29",
    observer: "Sam",
    note: "Whistling from the talus slope — snow still in the gullies.",
    photo: "/images/sightings/mountain.svg",
    // color: "#C1442D",
  },
  {
    id: "great-blue-heron",
    species: "Great Blue Heron",
    category: "bird",
    location: "Union Bay Natural Area",
    lat: 47.6536,
    lng: -122.2889,
    date: "2026-08-02",
    observer: "Jordan",
    note: "Stalking the shallows at dusk, then flew up the canal.",
    photo: "/images/sightings/marsh.svg",
    // color: "#274B6D",
  },
  {
    id: "steelhead",
    species: "Steelhead Trout",
    category: "fish",
    location: "Skykomish River, Index",
    lat: 47.8207,
    lng: -121.5543,
    date: "2026-08-03",
    observer: "Priya",
    note: "Saw two jump below the bridge at sunset. No catch, great show.",
    photo: "/images/sightings/river.svg",
    // color: "#2F7A6B",
  },
];

export const SIGHTINGS_BY_ID: Record<string, Sighting> = Object.fromEntries(
  SIGHTINGS.map((s) => [s.id, s]),
);

// Rough bounding box around the Puget Sound / Olympic peninsula so the map
// opens framed on the region instead of a single point.
export const REGION_CENTER: [number, number] = [-122.6, 47.75];
export const REGION_ZOOM = 7;
