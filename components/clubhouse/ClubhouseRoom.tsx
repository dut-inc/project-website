import { ROOM_OBJECTS } from "@/lib/clubhouse";
import { getProject } from "@/lib/projects";
import RoomBackdrop from "./art/RoomBackdrop";
import RoomBackdropMobile from "./art/RoomBackdropMobile";
import RoomObject from "./RoomObject";

// The homepage room, filling the screen under the navbar. The stage keeps the
// room's aspect ratio (so object placements stay exact) and is fitted inside
// the screen; the desktop backdrop bleeds past the stage to cover the rest.
// Every destination is a RoomObject link, in tab order, in a nav landmark.
export default function ClubhouseRoom() {
  return (
    <section className="clubhouse-screen" aria-labelledby="clubhouse-heading">
      <h1 id="clubhouse-heading" className="sr-only">
        Welcome to the clubhouse
      </h1>
      <div className="clubhouse-room">
        <div className="clubhouse-room__backdrop" aria-hidden>
          <RoomBackdrop className="hidden room:block" />
          <RoomBackdropMobile className="room:hidden" />
        </div>
        <nav aria-label="Clubhouse room">
          {ROOM_OBJECTS.map((object) => (
            <RoomObject key={object.id} object={object} project={getProject(object.projectId)} />
          ))}
        </nav>
      </div>
    </section>
  );
}
