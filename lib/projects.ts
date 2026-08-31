export type Status = "ACTIVE" | "PLANNING" | "OPEN";
export type PinColor = "red" | "teal" | "gold" | "navy";

export type Project = {
  case: string;
  title: string;
  href: string;
  status: Status;
  updated: string;
  summary: string;
  rotation: number;
  paper: "cream" | "kraft";
  pin: PinColor;
  taped?: boolean;
};

// Map keys are the URL slugs — the single source of truth for project data.
export type ProjectId =
  | "fish-quiz"
  | "sports"
  | "conservation"
  | "board"
  | "board-games"
  | "dle";

export const statusColor: Record<Status, string> = {
  ACTIVE: "text-pinTeal",
  PLANNING: "text-pinGold",
  OPEN: "text-pinRed",
};

export const projects: Map<ProjectId, Project> = new Map([
  [
    "fish-quiz",
    {
      case: "001",
      title: "Fish Quiz",
      href: "/fish-quiz",
      status: "ACTIVE",
      updated: "2026-08-01",
      summary:
        "pnw fish personality quiz live, guess the fish quiz and photo-based species ID coming soon",
      rotation: -2,
      paper: "cream",
      pin: "teal",
    },
  ],
  [
    "sports",
    {
      case: "002",
      title: "Sports Lab",
      href: "/sports",
      status: "ACTIVE",
      updated: "2026-08-01",
      summary:
        "basketball and baseball models, Seattle sports dashboard, etc.",
      rotation: 2.5,
      paper: "kraft",
      pin: "gold",
    },
  ],
  [
    "conservation",
    {
      case: "003",
      title: "Field Watch",
      href: "/conservation",
      status: "ACTIVE",
      updated: "2026-08-05",
      summary:
        "geotagged sighting map with photos, pin a spot from your next hike, species ID coming soon",
      rotation: -3,
      paper: "cream",
      pin: "navy",
    },
  ],
  [
    "board",
    {
      case: "004",
      title: "Loose Ends",
      href: "/board",
      status: "OPEN",
      updated: "2027-07-27",
      summary: "random notes, smaller things",
      rotation: 1.5,
      paper: "kraft",
      pin: "red",
      taped: true,
    },
  ],
  [
    "board-games",
    {
      case: "005",
      title: "Game Tiers",
      href: "/board-games",
      status: "ACTIVE",
      updated: "2026-08-04",
      summary: "rank the shelf, leave a note, and keep the arguments organized",
      rotation: -1.5,
      paper: "cream",
      pin: "teal",
    },
  ],
  [
    "dle",
    {
      case: "006",
      title: "DLE",
      href: "/dle",
      status: "PLANNING",
      updated: "2026-08-31",
      summary: "daily character guessing games for Teyvat, Solaris-3, and whatever world comes next",
      rotation: 1.5,
      paper: "kraft",
      pin: "gold",
    },
  ],
]);

// Throws on a bad slug so case pages can grab their project data without
// null-checking every field.
export function getProject(id: ProjectId): Project {
  const project = projects.get(id);
  if (!project) throw new Error(`Unknown project id: ${id}`);
  return project;
}
