export type Status = "ACTIVE" | "PLANNING" | "OPEN";

export type Project = {
  case: string;
  title: string;
  href: string;
  status: Status;
  logged: string;
  summary: string;
};

export const projects: Project[] = [
  {
    case: "001",
    title: "Fish Quiz",
    href: "/fish-quiz",
    status: "PLANNING",
    logged: "2026-07-26",
    summary:
      "Which-fish-are-you personality quiz now, species ID from a photo later once the model's trained.",
  },
  {
    case: "002",
    title: "Sports Lab",
    href: "/sports",
    status: "PLANNING",
    logged: "2026-07-26",
    summary:
      "Basketball and baseball models: win probability, scouting recaps, and a fantasy assistant for the group.",
  },
  {
    case: "003",
    title: "Field Watch",
    href: "/conservation",
    status: "PLANNING",
    logged: "2026-07-26",
    summary:
      "Citizen-science log: upload a photo on a hike, get a species ID, watch the group map fill in.",
  },
  {
    case: "004",
    title: "The Board",
    href: "/board",
    status: "OPEN",
    logged: "2026-07-26",
    summary: "Whatever doesn't need its own case file yet — links, notes, running jokes.",
  },
];
