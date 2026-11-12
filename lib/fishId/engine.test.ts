// Fish Identification Quiz: dataset integrity and the shared engine's rules.
//
// Run with: npm test   (node --experimental-strip-types --test)

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

import {
  CHOICES_PER_QUESTION,
  askable,
  buildQuestion,
  mulberry32,
  phaseOf,
  questionAt,
  runReducer,
  startRun,
  summarize,
  type Run,
  type RunState,
} from "./engine.ts";
import { QUIZ_MODES, canAsk, getMode } from "./modes.ts";
import { SPECIES_SETS, getSet } from "./sets.ts";
import { SPECIES, speciesIn, type Fish } from "./species.ts";

const world = speciesIn(getSet("world")!);
const run = (modeId: string, seed: number, pool: readonly Fish[] = world): Run => ({ mode: getMode(modeId)!, pool, seed });

// ---- Data ------------------------------------------------------------------

test("species ids, common names and scientific names are unique", () => {
  for (const key of ["id", "commonName", "scientificName"] as const) {
    const values = SPECIES.map((fish) => fish[key].toLowerCase());
    assert.equal(new Set(values).size, values.length, `duplicate ${key}`);
  }
});

test("common names are consistently capitalised, so no choice stands out", () => {
  for (const fish of SPECIES) {
    const words = fish.commonName.split(" ");
    words.forEach((word, i) => {
      if (i > 0 && ["of", "the", "and", "de", "del", "la", "van", "von"].includes(word)) return;
      assert.ok(!/^[a-z]/.test(word), `${fish.id}: "${fish.commonName}"`);
    });
  }
});

test("scientific names are well-formed binomials", () => {
  for (const fish of SPECIES) {
    assert.match(fish.scientificName, /^[A-Z][a-z]+ [a-z]+(-[a-z]+)?$/, fish.id);
  }
});

test("families are capitalised and end in -idae", () => {
  for (const fish of SPECIES) {
    if (fish.family) assert.match(fish.family, /^[A-Z][a-z]+idae$/, fish.id);
  }
});

test("every species is in a known set, and every set is big enough to quiz", () => {
  const ids = new Set(SPECIES_SETS.map((set) => set.id));
  for (const fish of SPECIES) {
    assert.ok(fish.sets.length > 0, `${fish.id} is in no set`);
    for (const set of fish.sets) assert.ok(ids.has(set), `${fish.id}: unknown set ${set}`);
  }
  for (const set of SPECIES_SETS) {
    for (const mode of QUIZ_MODES) assert.ok(askable(mode, speciesIn(set)).length >= 50, `${set.id}/${mode.id} is too small`);
  }
});

test("every photograph is reachable and credited", () => {
  for (const fish of SPECIES) {
    if (!fish.image) continue;
    const { src, width, height, author, license, sourceUrl } = fish.image;
    if (src.startsWith("/")) {
      assert.match(src, /^\/images\/fish-id\/[a-z0-9-]+\.jpg$/, fish.id);
      assert.ok(existsSync(new URL(`../../public${src}`, import.meta.url)), `${fish.id}: missing ${src}`);
    } else {
      assert.match(src, /^https:\/\/(inaturalist-open-data\.s3\.amazonaws\.com|static\.inaturalist\.org)\/photos\/\d+\/large\.\w+$/, fish.id);
    }
    assert.ok(width > 0 && height > 0, fish.id);
    assert.ok(author && license, `${fish.id}: author and license are required`);
    assert.match(sourceUrl, /^https:\/\//, fish.id);
  }
});

// ---- Modes -------------------------------------------------------------------

test("all four modes exist and differ in what they show or ask", () => {
  assert.equal(QUIZ_MODES.length, 4);
  const pairs = QUIZ_MODES.map((m) => `${m.prompt}->${m.answer}`);
  assert.equal(new Set(pairs).size, 4);
  for (const mode of QUIZ_MODES) {
    assert.notEqual(mode.prompt, mode.answer, `${mode.id} would show its own answer`);
    assert.equal(getMode(mode.id), mode);
  }
  assert.equal(getMode("nope"), undefined);
});

test("photo modes only ask about species with a photograph", () => {
  const photo = getMode("photo-common")!;
  const names = getMode("common-scientific")!;
  const noPhoto: Fish = { ...SPECIES[0], id: "test-no-photo", image: null };
  assert.equal(canAsk(photo, noPhoto), false);
  assert.equal(canAsk(names, noPhoto), true);
  for (let i = 0; i < 30; i++) assert.ok(questionAt(run("photo-common", 5, [...world, noPhoto]), i)!.fish.image);
});

// ---- Questions ---------------------------------------------------------------

test("every question has four distinct choices of the right kind, exactly one correct", () => {
  for (const set of SPECIES_SETS) {
    const pool = speciesIn(set);
    for (const mode of QUIZ_MODES) {
      const valid = new Set(pool.map((f) => f[mode.answer]));
      for (let seed = 1; seed <= 4; seed++) {
        for (let i = 0; i < 40; i++) {
          const q = questionAt({ mode, pool, seed }, i)!;
          assert.equal(q.choices.length, CHOICES_PER_QUESTION);
          const labels = q.choices.map((c) => c.label);
          assert.equal(new Set(labels).size, CHOICES_PER_QUESTION, `${mode.id}: duplicate label`);
          for (const label of labels) assert.ok(valid.has(label), `${mode.id}: ${label} is not a ${mode.answer} in ${set.id}`);
          assert.equal(q.choices[q.correctIndex].label, q.fish[mode.answer]);
          assert.equal(q.choices.filter((c) => c.fishId === q.fish.id).length, 1);
        }
      }
    }
  }
});

test("a run is reproducible from its seed and differs between seeds", () => {
  const ids = (seed: number) => Array.from({ length: 20 }, (_, i) => questionAt(run("photo-common", seed), i)!.fish.id).join();
  assert.equal(ids(42), ids(42));
  const orders = new Set(Array.from({ length: 20 }, (_, s) => ids(s)));
  assert.equal(orders.size, 20);
});

test("a run deals every species once before any repeats, then reshuffles", () => {
  const pool = world.slice(0, 30);
  const r = run("scientific-common", 9, pool);
  const lap1 = Array.from({ length: 30 }, (_, i) => questionAt(r, i)!.fish.id);
  const lap2 = Array.from({ length: 30 }, (_, i) => questionAt(r, 30 + i)!.fish.id);
  assert.equal(new Set(lap1).size, 30);
  assert.equal(new Set(lap2).size, 30);
  assert.notEqual(lap1.join(), lap2.join());
});

test("the correct answer's position is randomised", () => {
  const positions = new Set<number>();
  for (let i = 0; i < 40; i++) positions.add(questionAt(run("common-scientific", 3), i)!.correctIndex);
  assert.deepEqual([...positions].sort(), [0, 1, 2, 3]);
});

test("a duplicated name in the pool cannot produce a duplicate choice", () => {
  const [subject, twin] = world;
  const pool = [...world, { ...twin, id: "twin-copy" }, { ...twin, id: "subject-namesake", commonName: subject.commonName }];
  const mode = getMode("scientific-common")!;
  for (let seed = 1; seed <= 50; seed++) {
    const labels = buildQuestion(mode, subject, pool, mulberry32(seed)).choices.map((c) => c.label);
    assert.equal(new Set(labels).size, 4);
  }
});

test("building a question fails loudly when there are too few species", () => {
  const mode = getMode("common-scientific")!;
  assert.throws(() => buildQuestion(mode, world[0], world.slice(0, 3), mulberry32(1)), /Not enough/);
});

test("an empty pool gives no questions instead of crashing", () => {
  assert.equal(phaseOf(startRun(run("photo-common", 1, []))), "over");
});

// ---- Runs --------------------------------------------------------------------

const right = (s: RunState) => runReducer(s, { type: "answer", choice: s.question!.correctIndex });
const wrong = (s: RunState) => runReducer(s, { type: "answer", choice: (s.question!.correctIndex + 1) % 4 });
const next = (s: RunState) => runReducer(s, { type: "next" });

test("correct answers build a streak; the first wrong answer ends the run", () => {
  let state = startRun(run("photo-scientific", 11));
  assert.equal(phaseOf(state), "answering");
  // "next" does nothing before an answer.
  assert.equal(next(state), state);

  state = right(state);
  assert.equal(phaseOf(state), "feedback");
  assert.equal(summarize(state).streak, 1);
  // A second answer to the same plate is ignored.
  assert.equal(wrong(state), state);

  state = next(right(next(state)));
  assert.equal(summarize(state).streak, 2);
  state = next(state);
  assert.equal(state.index, 2);
  assert.equal(state.question!.fish.id, questionAt(state.run, 2)!.fish.id);

  state = wrong(state);
  assert.equal(phaseOf(state), "feedback");
  state = next(state);
  assert.equal(phaseOf(state), "over");
  assert.deepEqual(summarize(state), { streak: 2, skipped: 0, settled: 3 });
  // Nothing more can be answered once the run is over.
  assert.equal(right(state), state);
});

test("skipping a plate neither scores nor ends the run", () => {
  let state = right(startRun(run("photo-common", 2)));
  state = next(state);
  state = next(runReducer(state, { type: "skip" }));
  assert.equal(phaseOf(state), "answering");
  assert.deepEqual(summarize(state), { streak: 1, skipped: 1, settled: 2 });
  // Skip only applies to an unanswered plate.
  const answered = right(state);
  assert.equal(runReducer(answered, { type: "skip" }), answered);
});

test("out-of-range answers are ignored and restart begins a fresh run", () => {
  let state = startRun(run("common-scientific", 9));
  assert.equal(runReducer(state, { type: "answer", choice: 4 }), state);
  assert.equal(runReducer(state, { type: "answer", choice: -1 }), state);
  state = next(wrong(state));
  state = runReducer(state, { type: "restart", seed: 77 });
  assert.equal(phaseOf(state), "answering");
  assert.equal(state.index, 0);
  assert.equal(state.log.length, 0);
  assert.equal(state.run.seed, 77);
});
