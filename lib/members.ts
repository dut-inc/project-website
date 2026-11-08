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
  {
    slug: "dennis",
    name: "Dennis",
    bio: ["hi! im dennis and i LOVE systems engineering. my interests include lifting, bouldering, and swimming :)."],
    links: [
      { label: "GitHub", href: "https://github.com/dennis-kritchko" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/dennis-kritchko" },
    ],
    projects: [{ href: "/board-games/the-pack", note: "Pack Plus, the extended version of The Pack." }],
  },
  { slug: "ivan",
    name: "Ivan",
    bio: ["hey guys! im ivan and i love playing fortnite and getting the one piece! my interests include badminton, speedcubing, and deadlock."],
    links: [
      { label: "GitHub", href: "https://github.com/ivnkwok" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/ivnkwok/" },
    ],
    projects: [
      { href: "/board-games/tierlist", note: "Our group's personal rankings of the board games we've played." },
      { href: "/dle/wuthering-waves", note: "Let's do the wuwadle." },
      { href: "/dle/genshin-impact", note: "Let's do the jenshindle." },
    ], },
  { slug: "senlin", name: "Senlin" },
];

export function getMember(slug: string) {
  return MEMBERS.find((member) => member.slug === slug);
}
