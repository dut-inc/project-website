# CLAUDE.md

Project guide for Claude Code on every machine this repo is checked out on
(Windows PC and Mac). Claude's local memory does not sync between machines, so
anything a new session needs to know belongs here.

@AGENTS.md

AGENTS.md (imported above) is the brief for the **Fish Identification Quiz**.
Its section 10 records the owner's later decisions and the current status. The
rest of the site is described in [README.md](README.md) and
[PROJECT_STATUS.md](PROJECT_STATUS.md).

## The site

Perpetual Studio is the group's projects site. It uses Next.js 16 (App Router),
React 18, TypeScript, Tailwind 3 and Supabase. It looks like a code editor: a
file explorer, tabs and an editor pane.

- The explorer tree is `lib/workspace.ts`; section metadata is `lib/projects.ts`.
  A section nested under another uses `parent: "..."`.
- The URL is the source of truth for the active tab. Navigate with the Next.js
  router and `<Link>`; don't add client-only navigation.
- The window is the scroll container. Shell chrome stays at z-index 45 or below.
- Pages start with `components/PageHeader.tsx`. Page metadata comes from
  `lib/metadata.ts`.

```
npm install
npm run dev          # http://localhost:3000
npx tsc --noEmit
npm run lint
npm test             # node --experimental-strip-types --test <files listed in package.json>
npm run build
```

A new test file must be added to the `test` script in `package.json`; it isn't
discovered automatically.

Secrets go in `.env.local`, which is not committed. See README.md for the
variables.

### Machine gotchas

- **Never delete `.next` or run `next build` while `npm run dev` is running.**
  Doing so once broke the owner's dev server and made pages hang. Check first:
  - Mac: `lsof -i :3000`
  - Windows: `netstat -ano | findstr :3000`

  If the server is up, skip the build and tell the owner to run it after
  stopping the dev server.
- `next build` rewrites `next-env.d.ts`. Revert it with
  `git checkout next-env.d.ts`.
- `npm run build` uses webpack (`next build --webpack`); dev still uses
  Turbopack. Turbopack's production build failed on Vercel (2026-11-12) with
  "next/font/google queries have exactly one entry" for IBM Plex Sans in
  `app/layout.tsx`, even though it built locally. The error is in Turbopack's
  Google-font URL rewriting, which webpack doesn't use. Try going back to plain
  `next build` only after a Next.js upgrade, and check it on a Vercel deploy,
  not just locally.
- Git has `core.autocrlf=true` on the Windows PC, so files there are CRLF and the
  repo stores LF. When editing on Windows by script, keep a file's line endings.

### Python

Python is only used for the Root ingestion scripts (`scripts/root/`). `.venv` is
gitignored, so create it on each machine (Python 3.12):

| | Windows | Mac |
| --- | --- | --- |
| Create | `py -3.12 -m venv .venv` | `python3 -m venv .venv` |
| Python | `.venv/Scripts/python` | `.venv/bin/python` |

```
<python> -m pip install -r scripts/root/requirements.txt
```

## Fish Identification Quiz

`/fish-stuff/identify`, explorer file `identify-the-fish.quiz` under the
`fish-stuff` folder.
- `?set=world|pnw` picks the species set (default `world`).
- `&mode=<id>` starts a run with a fresh code.
- `?code=<4 letters>` plays a shared run. The code names its own set and mode,
  so it overrides `set` and `mode`.

The modes are `photo-common`, `photo-scientific`, `scientific-common` and
`common-scientific`.

### How it plays

Owner decisions (2026-11-12): runs are a fixed 12 plates (`RUN_LENGTH`), each
dealt from a four-letter code so friends can replay the same run, and the
distractors were made slightly easier. A wrong answer no longer ends the run.

- **Score.** The number correct out of 12. The header shows the code, score and
  best.
- **Codes.** `lib/fishId/codes.ts` writes a number in base 24 (A–Z without I
  and O). The number modulo 8 picks the set and mode (`COMBOS`, sets × modes);
  the rest gives the seed. `parseCode` ignores case and spaces. The server
  picks a random code for a new run (`randomCode`).
  - Adding a set or mode, or re-importing species, changes what old codes deal.
    Codes are for sharing today, not for keeping.
  - "New run" deals a fresh code locally. On a friend's link (`shared`), it
    instead replaces the URL with the plain mode URL, which remounts the session
    with a server-picked code.
  - The selection screen has a "Play a friend's code" box (`next/form`, GET
    `?code=`). A bad code shows the selection screen with an error.
- **Copy results.** `lib/fishId/share.ts` builds the text: code, set and mode,
  `9/12` with one square per plate (🟩 correct, 🟥 wrong, ⬜ skipped), and a link
  `<origin>/fish-stuff/identify?code=XXXX`. If the clipboard is blocked, the
  text appears in a box to copy by hand.
- **Order.** A run deals 12 different species from a shuffled deck of the set.
- **Best score.** Each browser stores its best score per set and mode, in
  localStorage under `fid-score:<set>:<mode>`. (The old streak key
  `fid-best:` is no longer read.)
- **Missing photos.** A plate whose photo fails to load can be skipped. A skip
  doesn't score but still uses up one of the 12 plates.
- **Water.** The background darkens as the score grows, reaching its darkest at
  12.
- **Keys.** A–D or 1–4 answer. Focus moves to the question, then to the Next
  button, then to the results.

### Files

```
data/fish-id/species.json         generated species data (~1 MB); see "Data" below
scripts/fish-id/import-inat.ts    npm run fish:import: rebuilds species.json from iNaturalist
public/images/fish-id/*.jpg       local photos for the 20 hand-curated species (Wikimedia Commons)
lib/fishId/types.ts               Fish, FishImage, SetId: the only fish module client code may import
lib/fishId/species.ts             SPECIES, speciesIn(set): imports the JSON, server only
lib/fishId/sets.ts                SPECIES_SETS (world, pnw), getSet, DEFAULT_SET
lib/fishId/modes.ts               QUIZ_MODES (configuration only), canAsk, quizHref(set, mode?)
lib/fishId/engine.ts              seeded question generation, distractors, run reducer, summary (no React)
lib/fishId/codes.ts               four-letter codes <-> set, mode, seed (pure; client-safe)
lib/fishId/share.ts               the copied results text (pure)
lib/fishId/engine.test.ts         data integrity + engine tests (part of npm test)
app/fish-stuff/identify/          page.tsx (reads set/mode, picks the seed), layout.tsx (EB Garamond), fish-id.css (theme)
components/fish-id/               ModeSelect (server), QuizSession, SpecimenPlate, AnswerList, FieldNote,
                                  Results, Water, BestStreak, FishName, streakStore.ts, photo.ts, buttons.ts
```

### Engine rules worth knowing

- **Pure questions.** A question is a pure function of `(seed, index)`, built by
  `questionAt(run, index)` from per-purpose PRNG streams (`mulberry32`).
  - The server picks the seed (`newSeed()` in `page.tsx`), so server and client
    render the same first question.
  - Restart dispatches a new seed.
- **Distractors.** `pickDistractors` favours the same genus, then the same family
  (`kinship`), but at most `MAX_RELATIVES` (2) of the three are relatives, so
  at least one wrong answer is from outside the family. This is the owner's
  "slightly easier" setting (2026-11-12); before it, a species from a big
  family could get three lookalikes. Names are deduplicated, so a choice can't
  appear twice. Fewer than four distinct answers throws.
- **Askable species.** `askable(mode, pool)` drops species that can't be asked:
  photo modes need `image`.
- **Run state.** `runReducer` handles `answer`, `skip`, `next` and
  `restart{seed}`. `phaseOf` returns `answering`, `feedback` or `over`.
  `summarize` gives `{ score, wrong, skipped, settled }`. The run ends on the
  `next` after plate 12.
- **Adding a mode.** A new mode is a new entry in `QUIZ_MODES` (prompt field and
  answer field). The engine and UI don't change.

### Data

`species.json` has `{ _comment, generated, species: Fish[] }`, sorted by
scientific name. Each record has these fields:

- `id`
- `commonName`
- `scientificName`
- `family`
- `habitat`
- `distribution`
- `description`
- `sets: ("world" | "pnw")[]`
- `image: { src, thumb?, width, height, author, license, licenseUrl, source, sourceUrl } | null`

**The import** (`npm run fish:import`) uses the iNaturalist API v1. It needs no
key, makes about one request a second, and takes about a minute.

- World is the top 1,000 species by research-grade observations under these
  taxa:
  - ray-finned fishes, `47178`
  - cartilaginous fishes, `196614`
  - lampreys, `49231`
  - hagfishes, `49099`
- Pacific Northwest is every fish with at least 3 research-grade observations in
  these places:
  - WA, `46`
  - OR, `10`
  - ID, `22`
  - BC, `7085`
- Common names come from iNaturalist and are title-cased.
- Families come from iNaturalist.
- The `description` is the first sentence of the Wikipedia summary iNaturalist
  carries, kept only when it is 25–300 characters long.
- Photos are iNaturalist's default photo:
  - `src` is the "large" size (1024px), `thumb` the "small" size.
  - They are hotlinked, not copied.
  - The author and license are stored with each photo.
- Re-running the import reads the current `species.json` first.
  - It keeps every record whose photo is a local file (`/images/...`): the
    photo, habitat, range and notes are preserved, the record is always in
    World, and only its common name is refreshed.
  - So to hand-curate a species, give it a local photo.

**Data rules.** The tests enforce these:
- Ids and both names are unique.
- Common names are capitalised.
- Scientific names match `Genus species` (an optional hyphenated epithet is
  allowed).
- Families end in `-idae`.
- Every set has at least 50 askable species per mode.
- Every photo is either an existing local file or an iNaturalist "large" URL,
  and is credited.

Never invent species facts or image URLs. If something is missing, leave it
`null`; the UI handles missing photos, notes and families.

### UI rules

- **Keep the species data out of the browser bundle.** Client components import
  only `lib/fishId/types.ts`, never `species.ts`, because the JSON is about 1 MB.
  The page passes only the chosen set's pool as props (World is about 109 KB
  gzipped, Pacific Northwest about 42 KB).
- **Remote images.** They use `next/image` with `unoptimized` (`isRemote()` in
  `photo.ts`), so no `remotePatterns` config is needed. Thumbnails use `thumb`.
  The next plate's photo is preloaded while the current one is answered.
- **Best score.** `streakStore.ts` reads localStorage via
  `useSyncExternalStore`. The server snapshot is `null`, and every storage call
  is wrapped in try/catch.
- **Back link.** During a run, the page header's back link goes to the set's
  mode list ("Identify the Fish"). On the mode list it goes to Fish Lab. There
  is no footer link in a run.
- **Run bar.** The set/mode and code/score bar is pulled up to the header's rule
  (`-mt-5 py-3`), so its text sits centred between the two lines. The owner
  asked for no mode numeral there, no "Answer with the …" line and no key hint;
  the A–D / 1–4 keys still work.
- **Name-mode plate.** In the two name modes, the plate is just the beige label
  until the question is answered, with no dark photo frame around it. The label
  holds only the name, centred. The owner removed "Specimen", "No. 01" and the
  field name. The framed photo replaces the label on reveal.
- **Plate caption.** It's only the photo credit (author, license, and the source
  link after answering), and only while a photo is on show. The owner removed
  the "Pl. 01" number and "Photograph shown after you answer" from every mode.
- **Scientific names.** Always italic. `FieldNote` italicises the binomial
  wherever it appears inside a Wikipedia note.
- **Styling.**
  - Colours are the `fid-*` Tailwind tokens (RGB variables in `fish-id.css`).
  - Titles and species names use EB Garamond. Body text uses the site's IBM
    Plex Sans.
  - The small all-caps labels, buttons and A–D keys use EB Garamond capitals:
    `font-fidserif font-medium lining-nums uppercase tracking-[0.14em]`, at
    12–13px. The owner asked on 2026-11-12 for a caps face that blends better
    than Plex Mono. Only the photo credit and the copy fallback box are still
    mono.
  - In the name modes, the label plate is `lg:self-center`, so it sits centred
    against the question and choices the way a photo's height does.
  - The back link in a run reads "All Quizzes".
  - The results screen shows only the score ("9 of 12") and the buttons, then
    the field log, with no rule between them. The code is shown in the run bar,
    so it isn't repeated. The owner removed:
    - the "New best / Run complete · Your best is" line;
    - the "Field log · set · mode" caption (kept as an sr-only caption);
    - the code line under the score.
  - Stay inside this palette and keep the restraint the brief asks for.
  - Respect `prefers-reduced-motion`.

### Verification done for codes and 12-plate runs (2026-11-12, Mac)

- `node --test lib/fishId/engine.test.ts` passed 23 tests, including codes,
  the relative cap and the share text. ESLint is clean on the fish files, and
  `tsc` shows no fish errors. (On the Mac, `tsc` reports the Root MCP route
  because `@modelcontextprotocol/server` isn't installed there; that has nothing
  to do with the quiz.)
- Headless Chrome against the dev server:
  - It played code KQZT through 12 plates to the results.
  - Copy results fell back to the manual box, because headless Chrome blocks
    the clipboard. The text was right.
  - "New run" from the shared link dropped the code from the URL.
  - Typing `kqzt` in the code box on a 390px screen dealt the same first plate
    as on desktop.
  - There was no horizontal scroll.

### Verification done (2026-11-12, before codes)

- **Tests.** `npm test` passed all 126 tests, 18 of them for the fish quiz.
  Lint and `tsc` are clean.
- **Desktop browser check (1440×900).**
  - Correct answers built the streak and the best streak.
  - A wrong answer ended the run, focus moved to the results, and the screen
    showed "New best".
  - A new run reset the streak and kept the best.
  - A plate whose photo was blocked could be skipped.
- **Phone width (390px).** No horizontal scroll.
- **Not done.** No production build has been run since this work. Run it with
  the dev server stopped.

## Root Assistant

The Root rules encyclopedia, MCP server, Gemini rules chat and setup tools live
under these paths:
- `/board-games/root`
- `lib/root/`
- `components/root/`
- `scripts/root/`
- `data/root/`

Ingestion docs are in `scripts/root/README.md`. The full working notes that used
to be in this file are in git history: `git show a493638:CLAUDE.md`. They cover:
- owner decisions
- data facts
- the review workflows
- the MCP server
- the Gemini chat and its env vars
- the setup tools
- the paper-and-ink look

Read them before changing Root code.

## Working conventions

- Commit or push only when the owner asks. Stage only the files for the task.
- Don't add dependencies or infrastructure without a concrete need.
- Never invent facts: species names and photos for the fish quiz, rule text for
  Root.
- Keep AGENTS.md section 10 and the fish section of this file current when the
  quiz changes.
