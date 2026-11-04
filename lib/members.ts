// The people behind Perpetual Studio. Each gets a page at /about-us/<slug>
// and a file in the explorer's About Us folder (lib/workspace.ts).
export type MemberProject = {
  // A route from lib/workspace.ts. A folder's route also lists its files.
  href: string;
  note: string;
};

export type MemberLink = {
  label: string;
  href: string;
};

export type Member = {
  slug: string;
  name: string;
  // Paragraphs of the member's own introduction.
  bio?: string[];
  // Profiles shown under the name (GitHub, LinkedIn, ...).
  links?: MemberLink[];
  projects?: MemberProject[];
};

export const MEMBERS: Member[] = [
  {
    slug: "ben",
    name: "Ben",
    bio: ["Hi, I'm Ben. My interests include sports, the ocean, conservation, and story writing."],
    links: [
      { label: "GitHub", href: "https://github.com/l0stpanda" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/ben-zeng-15630a133/" },
    ],
    projects: [
      { href: "/sports", note: "Seattle sports, NBA and MLB data, and the models behind them." },
      { href: "/board-games/tierlist", note: "Our group's personal rankings of the board games we've played." },
    ],
  },
  { slug: "dennis", name: "Dennis" },
  { slug: "ivan", name: "Ivan" },
  { slug: "senlin", name: "Senlin" },
];

export function getMember(slug: string) {
  return MEMBERS.find((member) => member.slug === slug);
}
