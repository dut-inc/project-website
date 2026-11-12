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
- `next build` sometimes fails with "next/font/google queries have exactly one
  entry" (Turbopack, while fetching Google fonts). Nothing in the code causes
  it, and a retry builds.
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
- `&mode=<id>` starts a run.

The modes are `photo-common`, `photo-scientific`, `scientific-common` and
`common-scientific`.

### How it plays

A run is endless and ends at the first wrong answer. The score is the streak.

- **Order.** The run deals every askable species in the set once, in a shuffled
  order, then reshuffles.
- **Best streak.** Each browser stores its best streak per set and mode, in
  localStorage under `fid-best:<set>:<mode>`.
- **Missing photos.** A plate whose photo fails to load can be skipped. A skip
  doesn't score and doesn't end the run.
- **Water.** The background darkens as the streak grows, reaching its darkest at
  a streak of 30 (`FULL_DEPTH_STREAK` in `QuizSession.tsx`).
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
  (`kinship`). Names are deduplicated, so a choice can't appear twice. Fewer
  than four distinct answers throws.
- **Askable species.** `askable(mode, pool)` drops species that can't be asked:
  photo modes need `image`.
- **Run state.** `runReducer` handles `answer`, `skip`, `next` and
  `restart{seed}`. `phaseOf` returns `answering`, `feedback` or `over`.
  `summarize` gives `{ streak, skipped, settled }`. Wrong answers end the run on
  `next`.
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
- **Best streak.** `streakStore.ts` reads localStorage via
  `useSyncExternalStore`. The server snapshot is `null`, and every storage call
  is wrapped in try/catch.
- **Scientific names.** Always italic. `FieldNote` italicises the binomial
  wherever it appears inside a Wikipedia note.
- **Styling.**
  - Colours are the `fid-*` Tailwind tokens (RGB variables in `fish-id.css`).
  - Titles and species names use EB Garamond; the interface uses the site's IBM
    Plex Sans and Mono.
  - Stay inside this palette and keep the restraint the brief asks for.
  - Respect `prefers-reduced-motion`.

### Verification done (2026-11-12)

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
