import type { ProjectId } from "@/lib/projects";

// The clubhouse homepage room: which object leads where, and where it sits.
// Routing comes from lib/projects.ts (via projectId); artwork comes from
// components/clubhouse/art (keyed by id). Nothing in here draws anything, so
// moving an object or swapping its art never touches the other two.

export type RoomObjectId =
  | "aquarium"
  | "television"
  | "tree"
  | "bulletin-board"
  | "game-shelf"
  | "calendar";

// Every number is a percentage of the room: x/y are the object's top-left
// corner, w is its width (height follows the artwork's aspect ratio).
export type Placement = {
  x: number;
  y: number;
  w: number;
  // Stacking order inside the room; higher sits in front.
  z?: number;
  // Where the name plaque hangs, as a % of the object's own box.
  // Defaults to centered just below the artwork (50, 100).
  label?: { x: number; y: number };
  // "left-wall" skews flat artwork onto the angled left wall. Art that is
  // already drawn in perspective (or a custom illustration) uses "none".
  plane?: "left-wall" | "none";
};

export type RoomObject = {
  id: RoomObjectId;
  projectId: ProjectId;
  // What the thing in the room is, used in the accessible name ("the aquarium").
  objectName: string;
  // One short line shown on the plaque when the object is hovered or focused.
  hint: string;
  // Optional custom illustration (a file in public/). When it is missing or
  // fails to load, the built-in placeholder SVG is drawn instead.
  image?: string;
  desktop: Placement;
  mobile: Placement;
};

// Room canvases. Desktop is one angled room; mobile is a three-storey
// cutaway of the same clubhouse so each object stays big enough to tap.
export const ROOM_ASPECT = {
  desktop: { width: 1600, height: 1000 },
  mobile: { width: 1000, height: 3000 },
} as const;

// Listed in reading / tab order: around the room left to right.
export const ROOM_OBJECTS: RoomObject[] = [
  {
    id: "tree",
    projectId: "conservation",
    objectName: "the overgrown tree",
    hint: "sightings map & field notes",
    desktop: { x: 0, y: 2, w: 17.5, z: 2, label: { x: 85, y: 90 } },
    mobile: { x: 0, y: 5, w: 30, z: 2, label: { x: 118, y: 93 } },
  },
  {
    id: "bulletin-board",
    projectId: "board",
    objectName: "the bulletin board",
    hint: "notes, odds & ends",
    desktop: { x: 18.1, y: 20.5, w: 15.6, z: 3, plane: "left-wall" },
    mobile: { x: 34, y: 11, w: 60, z: 3 },
  },
  {
    id: "calendar",
    projectId: "dle",
    objectName: "the wall calendar",
    hint: "daily guessing games",
    desktop: { x: 35, y: 21.5, w: 7.4, z: 3, plane: "left-wall" },
    mobile: { x: 69, y: 28, w: 22, z: 3 },
  },
  {
    id: "game-shelf",
    projectId: "board-games",
    objectName: "the game shelf",
    hint: "tier list, The Pack & more",
    desktop: { x: 44.7, y: 29, w: 11.9, z: 4, label: { x: 45, y: 90 } },
    mobile: { x: 5, y: 44, w: 29, z: 4 },
  },
  {
    id: "television",
    projectId: "sports",
    objectName: "the television",
    hint: "models, standings & live scores",
    desktop: { x: 58.1, y: 40, w: 16.25, z: 4, label: { x: 44, y: 89 } },
    mobile: { x: 40, y: 42.7, w: 56, z: 4, label: { x: 44, y: 91 } },
  },
  {
    id: "aquarium",
    projectId: "fish-stuff",
    objectName: "the aquarium",
    hint: "which PNW fish are you?",
    desktop: { x: 74.7, y: 33.7, w: 24.1, z: 5, label: { x: 40, y: 90 } },
    mobile: { x: 12, y: 71, w: 64, z: 5, label: { x: 44, y: 96 } },
  },
];
