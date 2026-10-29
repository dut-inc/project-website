import Link from "next/link";
import type { CSSProperties } from "react";
import type { Placement, RoomObject as RoomObjectConfig } from "@/lib/clubhouse";
import type { Project } from "@/lib/projects";
import { ROOM_ART } from "./art";
import ObjectArt from "./ObjectArt";

// Placement → CSS custom properties; app/globals.css (.room-object) picks the
// desktop or mobile set by breakpoint, so each object renders exactly once.
function placementVars(prefix: "d" | "m", p: Placement) {
  return {
    [`--${prefix}x`]: `${p.x}%`,
    [`--${prefix}y`]: `${p.y}%`,
    [`--${prefix}w`]: `${p.w}%`,
    [`--${prefix}z`]: p.z ?? 1,
    [`--${prefix}lx`]: `${p.label?.x ?? 50}%`,
    [`--${prefix}ly`]: `${p.label?.y ?? 100}%`,
    [`--${prefix}skew`]: p.plane === "left-wall" ? "-11.31deg" : "0deg",
  };
}

// One clickable thing in the clubhouse: artwork + a name plaque, wrapped in a
// real link so mouse, keyboard and touch all behave like normal navigation.
export default function RoomObject({ object, project }: { object: RoomObjectConfig; project: Project }) {
  const Art = ROOM_ART[object.id];
  const style = { ...placementVars("d", object.desktop), ...placementVars("m", object.mobile) } as CSSProperties;

  return (
    <Link
      href={project.href}
      className="room-object group"
      style={style}
      data-object={object.id}
      aria-label={`${project.title} — ${object.objectName}`}
    >
      <span className="room-object__lift">
        <span className="room-object__plane">
          <ObjectArt image={object.image} fallback={<Art />} />
        </span>
      </span>
      <span className="room-object__label" aria-hidden>
        <span className="room-object__title">{project.title}</span>
        <span className="room-object__hint">{object.hint}</span>
      </span>
    </Link>
  );
}
