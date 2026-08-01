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

export const projects: Project[] = [
  {
    case: "001",
    title: "Fish Quiz",
    href: "/fish-quiz",
    status: "ACTIVE",
    updated: "2026-08-01",
    summary:
      "Which-PNW-fish-are-you personality quiz is live... photo-based species ID coming soon!",
    rotation: -2,
    paper: "cream",
    pin: "teal",
  },
  {
    case: "002",
    title: "Sports Lab",
    href: "/sports",
    status: "PLANNING",
    updated: "2026-08-01",
    summary:
      "Basketball and baseball models: win probability, scouting recaps, and a fantasy assistant for the group.",
    rotation: 2.5,
    paper: "kraft",
    pin: "gold",
  },
  {
    case: "003",
    title: "Field Watch",
    href: "/conservation",
    status: "PLANNING",
    updated: "Coming soon!",
    summary:
      "Citizen-science log: upload a photo on a hike, get a species ID, watch the group map fill in.",
    rotation: -3,
    paper: "cream",
    pin: "navy",
  },
  {
    case: "004",
    title: "Loose Ends",
    href: "/board",
    status: "OPEN",
    updated: "2027-67-27",
    summary: "Whatever doesn't need its own case file yet — links, notes, running jokes.",
    rotation: 1.5,
    paper: "kraft",
    pin: "red",
    taped: true,
  },
];
