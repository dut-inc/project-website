import { ROOM_OBJECTS } from "@/lib/clubhouse";
import { getProject } from "@/lib/projects";
import RoomBackdrop from "./art/RoomBackdrop";
import RoomBackdropMobile from "./art/RoomBackdropMobile";
import RoomObject from "./RoomObject";

// The homepage room. Backdrop art is decorative; every destination is a
// RoomObject link, in tab order, inside a labelled nav landmark.
export default function ClubhouseRoom() {
  return (
    <div className="clubhouse-room">
      <div className="clubhouse-room__backdrop" aria-hidden>
        <RoomBackdrop className="hidden md:block" />
        <RoomBackdropMobile className="md:hidden" />
      </div>
      <nav aria-label="Clubhouse room">
        {ROOM_OBJECTS.map((object) => (
          <RoomObject key={object.id} object={object} project={getProject(object.projectId)} />
        ))}
      </nav>
    </div>
  );
}
