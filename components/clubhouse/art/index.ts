import type { ComponentType } from "react";
import type { RoomObjectId } from "@/lib/clubhouse";
import AquariumArt from "./AquariumArt";
import BulletinBoardArt from "./BulletinBoardArt";
import CalendarArt from "./CalendarArt";
import GameShelfArt from "./GameShelfArt";
import TelevisionArt from "./TelevisionArt";
import TreeArt from "./TreeArt";

// Built-in placeholder illustration for each room object. A custom image set
// via `image` in lib/clubhouse.ts takes precedence; these are the fallback.
export const ROOM_ART: Record<RoomObjectId, ComponentType> = {
  aquarium: AquariumArt,
  television: TelevisionArt,
  tree: TreeArt,
  "bulletin-board": BulletinBoardArt,
  "game-shelf": GameShelfArt,
  calendar: CalendarArt,
};
