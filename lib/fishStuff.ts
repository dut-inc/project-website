// Fish Quiz personality quiz.
// six PNW species currently and six questions with weighted answers.
export type FishId =
  | "chinook"
  | "sockeye"
  | "steelhead"
  | "halibut"
  | "lingcod"
  | "sturgeon";

export type FishSpecies = {
  id: FishId;
  name: string; // display name
  shortName: string;
  tagline: string; // personality archetype,
  color: string; // accent used on the result card
  description: string;
  traits: string[]; // personality bullets
  fact: string; // fun fact
};

export type QuizOption = {
  label: string;
  scores: Partial<Record<FishId, number>>;
};

export type QuizQuestion = {
  prompt: string;
  options: QuizOption[];
};

export const FISHES: FishSpecies[] = [
  {
    id: "chinook",
    name: "Chinook (King) Salmon",
    shortName: "Chinook",
    tagline: "The Trailblazer",
    color: "#3A7CA5",
    description:
      "You're the one who goes farthest and biggest. When everyone else hedges, you commit to the long, hard run upstream — and you'd rather go all the way than almost. Peaks, projects, marathons: you were built for distance and you know it.",
    traits: ["Goes big or goes home", "Takes the long way on purpose", "Gets stronger the farther you get"],
    fact: "Chinook are the largest Pacific salmon — kings have been found more than 100 miles upriver, still going.",
  },
  {
    id: "sockeye",
    name: "Sockeye Salmon",
    shortName: "Sockeye",
    tagline: "The True Believer",
    color: "#C1442D",
    description:
      "When you care, you care all the way. Like a sockeye turning scarlet for the spawn run, you're intense, devoted, and you always know exactly where home is — even when it's a long way off. Nobody matches your fire when something matters.",
    traits: ["Runs on pure passion", "Turns red when it's serious", "Zero to sixty in one second"],
    fact: "Sockeye make one of the toughest journeys in the animal kingdom: they stop eating entirely and swim hundreds of miles on fat reserves alone.",
  },
  {
    id: "steelhead",
    name: "Steelhead Trout",
    shortName: "Steelhead",
    tagline: "The World Traveler",
    color: "#9AA7AE",
    description:
      "Home is a basecamp, not a destination. You leave, explore the whole ocean, and come back with stories — and unlike most salmon, you get to do it all over again. Every trip makes you smarter, stronger, and harder to pin down.",
    traits: ["Thrives on novelty", "Comes back stronger every trip", "Lives to run again"],
    fact: "Steelhead are the repeat offenders of the salmon family — they can spawn multiple times, bouncing between river and open ocean for years.",
  },
  {
    id: "halibut",
    name: "Pacific Halibut",
    shortName: "Halibut",
    tagline: "The Chiller",
    color: "#7C5A3C",
    description:
      "You're big, flat, and unbothered. You hang out near the bottom, let the world drift by, and only really move when it's worth it. People underestimate you — right up until the moment you come up huge.",
    traits: ["Low-key and unbothered", "Takes up space without trying", "Saving it all for the big moment"],
    fact: "Halibut can live 50+ years and grow past 500 pounds — and both eyes end up on the same side of their head.",
  },
  {
    id: "lingcod",
    name: "Lingcod",
    shortName: "Lingcod",
    tagline: "The Ambush Strategist",
    color: "#2F7A6B",
    description:
      "You're patient to a fault and you know your territory cold. You blend in, wait for the perfect opening, and strike with total conviction the second the moment arrives. Quiet — until you're not.",
    traits: ["Plays the long game", "Strikes when the moment is right", "Knows the neighborhood cold"],
    fact: "Lingcod aren't actually cod — they're a greenling, and their ambush strike is one of the fastest in the nearshore.",
  },
  {
    id: "sturgeon",
    name: "White Sturgeon",
    shortName: "Sturgeon",
    tagline: "The Old Soul",
    color: "#6B6250",
    description:
      "You think in decades, not days. You've seen enough to know most things don't need to be rushed — you're slow-moving, deeply wise, and quietly outlasting everyone around you. Your patience isn't a bug; it's the whole superpower.",
    traits: ["Thinks in decades", "Has seen it all before", "Moves slow, lands deep"],
    fact: "White sturgeon have swum the Pacific since the dinosaurs — some live past 100 years and grow longer than a car.",
  },
];

export const FISH_BY_ID: Record<FishId, FishSpecies> = Object.fromEntries(
  FISHES.map((f) => [f.id, f]),
) as Record<FishId, FishSpecies>;

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    prompt: "The weekend finally opens up. What's the move?",
    options: [
      { label: "Up before sunrise, first one on the trail", scores: { chinook: 2, sockeye: 1 } },
      { label: "Sleep in, then drift on the lake with no plan", scores: { halibut: 2, sturgeon: 1 } },
      { label: "Pile in the car and just go with the flow", scores: { steelhead: 2, halibut: 1 } },
      { label: "Stake out one good spot and wait it out", scores: { lingcod: 2, sturgeon: 1 } },
    ],
  },
  {
    prompt: "A goal you've been chasing is finally within reach. You…",
    options: [
      { label: "Go all in. No brakes.", scores: { sockeye: 2, chinook: 1 } },
      { label: "Make a plan, then commit fully", scores: { chinook: 2, steelhead: 1 } },
      { label: "Take the long way — the journey is the point", scores: { steelhead: 2, halibut: 1 } },
      { label: "Wait for the exact right moment", scores: { lingcod: 2, sturgeon: 1 } },
    ],
  },
  {
    prompt: "Pick the compliment you hear most often:",
    options: [
      { label: "“You're going places.”", scores: { chinook: 2, steelhead: 1 } },
      { label: "“You care so much it's contagious.”", scores: { sockeye: 2 } },
      { label: "“Nothing ever rattles you.”", scores: { halibut: 2, sturgeon: 1 } },
      { label: "“You see things no one else does.”", scores: { lingcod: 2, sturgeon: 1 } },
    ],
  },
  {
    prompt: "Potluck. What do you bring?",
    options: [
      { label: "The main dish. Obviously.", scores: { chinook: 2, sockeye: 1 } },
      { label: "Something you perfected after 12 tries", scores: { lingcod: 2, steelhead: 1 } },
      { label: "The family recipe that gets fought over", scores: { sockeye: 2, sturgeon: 1 } },
      { label: "Chairs, grill skills, and good vibes", scores: { halibut: 2, steelhead: 1 } },
    ],
  },
  {
    prompt: "A giant project lands in your lap. Your approach:",
    options: [
      { label: "Full sprint to the finish line", scores: { sockeye: 2, chinook: 1 } },
      { label: "Break it into a thousand small wins", scores: { steelhead: 2, lingcod: 1 } },
      { label: "Nap first, then knock it out perfectly", scores: { halibut: 2, sturgeon: 1 } },
      { label: "Slow and steady — you're built for the long haul", scores: { sturgeon: 2, chinook: 1 } },
    ],
  },
  {
    prompt: "Choose your adventure:",
    options: [
      { label: "Climb the peak", scores: { chinook: 2 } },
      { label: "Swim out past the breakers", scores: { steelhead: 2 } },
      { label: "Dive into the deep", scores: { lingcod: 2, halibut: 1 } },
      { label: "Follow the river to its source", scores: { sockeye: 2, sturgeon: 1 } },
    ],
  },
];

export type Scores = Record<FishId, number>;

export function emptyScores(): Scores {
  return {
    chinook: 0,
    sockeye: 0,
    steelhead: 0,
    halibut: 0,
    lingcod: 0,
    sturgeon: 0,
  };
}

// Add a question answer to a scores tally.
export function applyAnswer(
  scores: Scores,
  questionIndex: number,
  optionIndex: number,
): Scores {
  const option = QUIZ_QUESTIONS[questionIndex]?.options[optionIndex];
  if (!option) return scores;
  const next = { ...scores };
  for (const [id, pts] of Object.entries(option.scores)) {
    next[id as FishId] += pts ?? 0;
  }
  return next;
}

export type QuizResult = { fish: FishSpecies; ranked: FishSpecies[] };

// Ranked scoring with species order above doubles as tiebreak.
export function scoreToResult(scores: Scores): QuizResult {
  const ranked = [...FISHES].sort((a, b) => scores[b.id] - scores[a.id]);
  return { fish: ranked[0], ranked };
}
