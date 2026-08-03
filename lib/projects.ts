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

export const projects: Map<string, Project> = new Map([
  ["fish-quiz", {
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
  }],
  ["sports", {
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
  }],
  ["conservation", {
    case: "003",
    title: "Field Watch",
    href: "/conservation",
    status: "PLANNING",
    updated: "2026-0",
    summary:
      "citizen-science log, e.g. upload a photo on a hike, get a species ID, fill in the map",
    rotation: -3,
    paper: "cream",
    pin: "navy",
  }],
  ["board", {
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
  }],
])