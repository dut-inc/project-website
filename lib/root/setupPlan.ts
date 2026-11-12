// Setup tools: the reach check (Law 5.2), standard setup order (5.1.7) and the
// Advanced Setup faction draft (A.8). Pure: no rule data is imported, so it runs
// in the browser; lib/root/setup.ts builds the inputs from the Law (server only).
//
// Sources, kept apart on purpose:
// - from the Law: reach values and totals (5.2), corner starts (each faction's
//   setup text), the draft procedure (A.8.1–A.8.3);
// - from the project owner: militant/insurgent setup cards and setup letters
//   (data/root/editorial/setup.json). The militant count is the group's own
//   check and is never presented as a rule.

export type SetupCard = "militant" | "insurgent";

export type FactionSetup = {
  id: string;
  name: string;
  short: string;
  color: string;
  letter: string; // setup order letter (owner: lawbook order)
  reach: number; // 5.2
  secondReach?: number; // 5.2: a second Vagabond
  card: SetupCard; // owner
  corner: boolean; // its setup places it in a corner clearing
  expansion: string | null;
  setupSection: { number: string; title: string };
};

export type ReachTable = {
  thresholds: Record<number, number>; // players -> total reach needed
  adventurous: number; // "any faction mix with 17+ Reach"
};

// A faction in play, or a setup card in the draft. The Vagabond can appear
// twice ("vagabond" and "vagabond-2"), the second with its own reach.
export type Entry = { key: string; factionId: string; second: boolean };

export const SECOND_VAGABOND = "vagabond-2";

export function entry(key: string): Entry {
  return key === SECOND_VAGABOND
    ? { key, factionId: "vagabond", second: true }
    : { key, factionId: key, second: false };
}

type ById = Record<string, FactionSetup>;

export function entryReach(e: Entry, byId: ById): number {
  const faction = byId[e.factionId];
  return e.second ? (faction.secondReach ?? faction.reach) : faction.reach;
}

export type ReachResult = {
  players: number;
  total: number;
  needed: number | null; // null when the table has no row for this player count
  meets: boolean | null;
  adventurous: boolean; // meets the adventurous minimum
};

// 5.2: one player per faction (5.1.1), so the player count is the faction count.
export function reachCheck(entries: Entry[], byId: ById, table: ReachTable): ReachResult {
  const players = entries.length;
  const total = entries.reduce((sum, e) => sum + entryReach(e, byId), 0);
  const needed = table.thresholds[players] ?? null;
  return { players, total, needed, meets: needed === null ? null : total >= needed, adventurous: total >= table.adventurous };
}

export function cardCounts(entries: Entry[], byId: ById): Record<SetupCard, number> {
  const counts = { militant: 0, insurgent: 0 };
  for (const e of entries) counts[byId[e.factionId].card]++;
  return counts;
}

// The Law (chapter 5): five or more factions that start in corner clearings
// must use the Advanced Setup.
export const CORNER_LIMIT = 5;

export function cornerStarters(entries: Entry[], byId: ById): Entry[] {
  return entries.filter((e) => byId[e.factionId].corner);
}

// Standard setup (5.1.7): in setup order, A, B, C...
export function bySetupLetter(entries: Entry[], byId: ById): Entry[] {
  return [...entries].sort(
    (a, b) => byId[a.factionId].letter.localeCompare(byId[b.factionId].letter) || Number(a.second) - Number(b.second),
  );
}

// --- Advanced Setup draft (A.8) ------------------------------------------------

export type DraftOptions = {
  players: number;
  include: string[]; // faction ids in the draft pool (A.8.1)
  vagabondCards: 1 | 2; // A.8.1
  keepInsurgents: boolean; // two players with hirelings (A.8.2.I)
};

export type DealtCard = Entry & { card: SetupCard; locked: boolean };

export type Problem = { text: string; rule: string };

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

function setupCardEntries(options: DraftOptions): Entry[] {
  const out: Entry[] = [];
  for (const id of options.include) {
    out.push(entry(id));
    if (id === "vagabond" && options.vagabondCards === 2) out.push(entry(SECOND_VAGABOND));
  }
  return out;
}

function decks(options: DraftOptions, byId: ById) {
  const cards = setupCardEntries(options).filter((e) => byId[e.factionId]);
  const militant = cards.filter((e) => byId[e.factionId].card === "militant");
  const insurgent =
    options.players === 2 && !options.keepInsurgents ? [] : cards.filter((e) => byId[e.factionId].card === "insurgent");
  return { militant, insurgent };
}

export function draftProblems(options: DraftOptions, byId: ById): Problem[] {
  const problems: Problem[] = [];
  if (options.players < MIN_PLAYERS || options.players > MAX_PLAYERS) {
    problems.push({ text: `Choose between ${MIN_PLAYERS} and ${MAX_PLAYERS} players.`, rule: "5.2" });
  }
  if (options.include.includes("vagabond") && options.include.includes("knaves-of-the-deepwood")) {
    problems.push({ text: "You can't include both the Vagabond and the Knaves of the Deepwood.", rule: "A.8.1" });
  }
  const { militant, insurgent } = decks(options, byId);
  if (militant.length === 0) {
    problems.push({ text: "Include at least one militant faction: the first setup card dealt is militant.", rule: "A.8.2" });
  } else if (militant.length - 1 + insurgent.length < options.players) {
    problems.push({
      text: `Not enough setup cards: the draft deals ${options.players + 1} (one more than the number of players).`,
      rule: "A.8.2",
    });
  }
  return problems;
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// A.8.2: one militant card to the pool, then the remaining militant cards
// shuffled with the insurgent cards (none with two players unless kept), one
// card per player. If the last card dealt is an insurgent, it is locked.
export function deal(options: DraftOptions, byId: ById, random: () => number = Math.random): DealtCard[] {
  if (draftProblems(options, byId).length) throw new Error("The draft options have problems; check draftProblems first.");
  const { militant, insurgent } = decks(options, byId);
  const [first, ...otherMilitant] = shuffle(militant, random);
  const rest = shuffle([...otherMilitant, ...insurgent], random).slice(0, options.players);
  const pool = [first, ...rest].map((e) => ({ ...e, card: byId[e.factionId].card, locked: false }));
  const last = pool[pool.length - 1];
  if (last.card === "insurgent") last.locked = true;
  return pool;
}

// A.8.3: starting with the last player in turn order and going counterclockwise.
// Players are numbered in turn order (1 = first player).
export function chooserOrder(players: number): number[] {
  return Array.from({ length: players }, (_, i) => players - i);
}

// A.8.2.II: a locked card can't be chosen unless a militant faction has been chosen.
export function canChoose(card: DealtCard, chosen: DealtCard[]): boolean {
  if (chosen.some((c) => c.key === card.key)) return false;
  return !card.locked || chosen.some((c) => c.card === "militant");
}
