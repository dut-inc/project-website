export type Status = "ACTIVE" | "PLANNING" | "OPEN";
export type PinColor = "red" | "teal" | "gold" | "navy";

export type Project = {
  case: string;
  title: string;
  href: string;
  status: Status;
  logged: string;
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
    logged: "2026-07-26",
    summary:
      "Which-PNW-fish-are-you personality quiz is live — photo-based species ID comes later once the model's trained.",
    rotation: -2,
    paper: "cream",
    pin: "teal",
  },
  {
    case: "002",
    title: "Sports Lab",
    href: "/sports",
    status: "PLANNING",
    logged: "2026-07-26",
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
    logged: "2026-07-26",
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
    logged: "2026-07-26",
    summary: "Whatever doesn't need its own case file yet — links, notes, running jokes.",
    rotation: 1.5,
    paper: "kraft",
    pin: "red",
    taped: true,
  },
];
