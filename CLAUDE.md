# CLAUDE.md

Project guide for Claude Code, shared by every machine this repo is checked out on
(Windows PC and Mac). Claude's local memory does not sync between machines, so
anything a new session needs to know belongs here.

@AGENTS.md

AGENTS.md (imported above) is the brief for the **Root Rules Encyclopedia**. The
rest of the site is described in [README.md](README.md) and
[PROJECT_STATUS.md](PROJECT_STATUS.md).

## The site

Perpetual Studio is the group's projects site. It uses Next.js 16 (App Router),
TypeScript, Tailwind and Supabase, and looks like a code editor: a file
explorer, tabs and an editor pane.

- The explorer tree is `lib/workspace.ts`; section metadata is `lib/projects.ts`.
  A section nested under another uses `parent: "board-games"`.
- The URL is the source of truth for the active tab. Navigate with the Next.js
  router and `<Link>`; don't add client-only navigation.
- The window is the scroll container. Shell chrome stays at z-index 45 or below.
- Every page starts with `components/PageHeader.tsx`. Page metadata comes from
  `lib/metadata.ts`.

```
npm install
npm run dev          # http://localhost:3000
npx tsc --noEmit
npm run lint
npm test
npx next build
```

Secrets go in `.env.local`, which is not committed. See README.md for the passcode
variables.

## Python

`.venv` is gitignored, so create it on each machine. Python 3.12 is used.

| | Windows | Mac |
| --- | --- | --- |
| Create | `py -3.12 -m venv .venv` | `python3 -m venv .venv` |
| Python | `.venv/Scripts/python` | `.venv/bin/python` |

```
<python> -m pip install -r scripts/root/requirements.txt
```

The commands below use `.venv/bin/python`; on Windows use `.venv/Scripts/python`.

## Root Rules Encyclopedia

### Owner decisions (2026-11-10)

- Source PDF: `public/data/root/Root_2025_Law.pdf`, the Law of Root dated
  October 13, 2025 (32 pages, selectable text).
- Commit the PDF and the extracted rule text, and show both publicly. The owner
  accepted that Leder Games owns the text.
- Placement: a file inside the existing **Board Games** explorer folder, at
  `/board-games/root`. It is not a top-level folder. Register it in
  `lib/workspace.ts` / `lib/projects.ts` with `parent: "board-games"`.
- Verification: Claude runs automated checks and the owner spot-checks a sample
  on a side-by-side review page. The owner doesn't need to know the rules; they
  compare the words with the PDF.

### Status

| Step | State |
| --- | --- |
| Phase 0: inspect the PDF | Done |
| Extractor, tests, docs (`scripts/root/`) | Done, extractor 0.1.1 |
| Sample review: 80 records (ch. 2, 6, G + 7 edge cases) | **Passed 2026-11-10**: 80 match, 0 problems |
| Text review batch 2: 126 records (rest of ch. 1, 3, 4, 5 + ch. 7 Eyrie, 8 Alliance) | **Passed 2026-11-11**: all match (owner confirmed in chat). 206 of 707 records now verified. https://claude.ai/artifact/SCnc14yNCx8iaK4RvP2HzX |
| Later text batches | **Stopped 2026-11-11 by owner decision.** The other 501 records rely on the automated checks (conservation, numbering, cross-references, tests) and say "Extracted automatically, not checked by hand". |
| Full-book extraction (`data/root/law-2025-10-13/`) | Done: 707 records, clean report |
| Editorial overlay (`data/root/editorial/`) | `verification.json` (80 records verified), `topics.json` (**reviewed 2026-11-11**, 20/20 approved) |
| MVP step 1: contents, chapter pages, rule pages, go-to-rule | **Done 2026-11-11** |
| MVP step 2: faction pages (own rules, icon-marked rules, name mentions) | **Done 2026-11-11** |
| MVP step 3: full-text search with faction/chapter filters | **Done 2026-11-11** |
| MVP step 4: topics + "general rules that apply" (editorial; owner spot-checks) | **Done 2026-11-11** (owner approved all 20 cards) |
| Edition diff script | Not started |
| Phase 2+ (synonyms, semantic search, AI assistant) | Not started. AGENTS.md says not yet |

Branch: `root-encyclopedia` (from `main`).

### Layout

```
public/data/root/Root_2025_Law.pdf   source PDF; the site links source pages to it
scripts/root/extract_law.py          PDF -> JSON (PyMuPDF)
scripts/root/make_review.py          JSON + PDF -> review page (with review_template.html)
scripts/root/test_extract_law.py     19 unittest tests
scripts/root/README.md               full ingestion docs: schema, markup, re-import steps, PDF facts
data/root/law-2025-10-13/            extracted data (generated; never hand-edit)
  source.json  sections.json  rules.json  factions.json  extraction-report.json
```

```
.venv/bin/python scripts/root/extract_law.py --pdf public/data/root/Root_2025_Law.pdf \
    --version 2025-10-13 --out data/root/law-2025-10-13
.venv/bin/python -m unittest scripts/root/test_extract_law.py -v
```

A good run prints:
`0 warnings, 0 unresolved refs, 0 numbering gaps, 0 duplicate ids, 1 tables` and
`Conservation: 96077 characters read, 96077 written`.

### Data facts the site should rely on

- The book has 707 records in 184 sections, with 13 factions:
  - 454 rules
  - 135 sub-rules
  - 36 glossary entries
  - 78 section texts
  - 4 chapter texts
- IDs:
  - rules: `rule-6-2-3`, `rule-4-3-5-ii`, `rule-9-2-9-iii-a`, `rule-g-20`
  - section text: `rule-2-5`
  - chapter intros: `rule-<n>-intro`
  - the preface: `rule-reading-the-law`
  - sections: `section-4-3`, `section-g`

  IDs are stable. Use them in URLs.
- `rules.json` is in book order (`order`). Each record has:
  - `rule_number`, `title`, `text`
  - `rule_type`: rule / sub-rule / glossary / section-text / chapter-text
  - `section_id`, `parent_rule_id`
  - `source_page_start` / `source_page_end`, and `source_locations` (page + bbox)
  - `faction_ids`: the faction whose chapter holds the rule
  - `faction_markers`: faction icons printed after a rule. The Law says these mark
    rules modified by that faction. They are good input for a faction page's
    "Interactions and exceptions" group.
  - `cross_references`: `[{cited, target_id}]`, all resolved
  - `layout_flags`
- Markup in `text`, which the renderer must handle:
  - `*…*` italic reminder text
  - `{item:boots}` item icons: boots, bag, crossbow, hammer, sword, tea, coins, torch
  - `{icon}`: an icon the extractor couldn't read (only in H.2.1–H.2.4)
  - a blank line separates paragraphs
  - `a | b` lines are table rows (only 5.2 Reach)
- Factions:
  - base game: Marquise de Cat, Eyrie Dynasties, Woodland Alliance, Vagabond
  - Riverfolk: Lizard Cult, Riverfolk Company
  - Underworld: Underground Duchy, Corvid Conspiracy
  - Marauder: Lord of the Hundreds, Keepers in Iron
  - Homeland: Lilypad Diaspora, Twilight Council, Knaves of the Deepwood

  `factions.json` has the exact names and expansions.
- This PDF does **not** contain card text, hireling cards, landmarks or the
  Clockwork bots. The site must not imply that it does.
- Small-caps key terms extract as ordinary lowercase.

### Source vs editorial

`data/root/law-*/` is regenerated from the PDF. Editorial data lives in
`data/root/editorial/`, keyed by rule and section ids, so a re-import never
overwrites human review:

- `verification.json`: text checked by hand against the PDF. It holds the 80
  sample records; everything else is unreviewed.
- `topics.json`: the topic vocabulary (17 topics) plus the faction-page extras.
  - A topic gathers rules in three ways:
    - whole `sections`;
    - single `rules`, each with a `reason`;
    - `title_terms`, matched as whole words in printed titles;
    - optionally `section_titles` too (for example, every "Faction Setup").
  - Each topic has a `status` of `draft` or `reviewed`, and pages show it.
  - Never present topics as rule text.

**Topic review workflow.** Regenerate the review page with
`node --experimental-strip-types scripts/root/make_topic_review.ts <out.html>` and publish
it as an artifact. Owner review page (approved in full on 2026-11-11):
https://claude.ai/artifact/SmnVMk1YzMhpuTMAx789Yi. When the owner pastes results back:
- fix the problems they report;
- set the approved topics and extras to `"status": "reviewed"`;
- add a `review` note (date and result) to `topics.json`;
- run `npm test`.

**Manual text review is stopped** (owner decision, 2026-11-11). Don't propose more batches
unless the owner asks, or a new edition or an extractor change makes them necessary.
Consequences:
- 206 records are verified, covering chapters 1–8 and G plus the first sample's edge cases.
  The other 501 are automated extraction only. The site labels them
  "Extracted automatically, not checked by hand".
- For the future AI assistant (Phase 3), AGENTS.md says unverified records must not be
  treated as authoritative. Decide with the owner before building it: either the assistant
  says when an answer rests on an unchecked rule, or that rule's chapter gets reviewed first.
- If a player reports a text error, fix the extractor, re-extract, and add a test for it.

**Text review workflow** (kept for later use; the extracted text checked against the PDF):

```
.venv/bin/python scripts/root/make_review.py --pdf public/data/root/Root_2025_Law.pdf \
    --data data/root/law-2025-10-13 --chapters 9,V \
    --skip-verified data/root/editorial/verification.json \
    --batch "Vagabond" --title "Root Law Review Batch 3" --out <out.html>
```

Publish the page as an artifact. Each batch saves its own progress in the reviewer's
browser. When the owner pastes results back:
- add each record marked "Matches" to `verification.json`, with a new entry in `reviews`
  (id, date, method, scope, result). Records marked "Problem" stay out until fixed.
- fix any problem in the extractor, not in the data, and re-extract;
- update the expected verified count in `lib/root/law.test.ts` ("reviewed records are marked verified…"; 206 after batch 2).

### Site code (steps 1–4)

```
lib/root/paths.ts       URLs, slug <-> printed number (no data; the shell uses it for tab names)
lib/root/markup.ts      parses the text markup and cross-reference links; plainText() (pure)
lib/root/law.ts         data access over the JSON + editorial overlay (server only)
lib/root/factions.ts    faction page groups: rulesModifiedBy (icons), rulesNaming (name match)
lib/root/topics.ts      topic membership, topicsOfRule, generalRulesFor(faction) (server only)
lib/root/search.ts      search engine (pure; runs in the browser)
lib/root/searchIndex.ts builds the index + faction scopes + topics at build time (server only)
lib/root/*.test.ts      law, factions, search, topics; run by `npm test`
lib/root/factionStyle.ts  chip colors/short names (presentation only, not from the PDF)
components/root/        RuleText, RuleEntry, RuleCard, ChapterBody, Editorial, SearchBox, RootSearch, CopyLinkButton
app/board-games/root/   page.tsx (contents), law/[chapter], rule/[slug], faction/[faction],
                        topics, topic/[topic], search  (all static)
scripts/root/make_topic_review.ts  owner review page for topics.json
```

- URLs: `/board-games/root/law/6`, `/board-games/root/rule/6-2-3`,
  `/board-games/root/faction/vagabond`, `/board-games/root/topic/battle`,
  `/board-games/root/search?q=&faction=&chapter=&topic=`.
- Faction page order (per AGENTS.md):
  1. faction rules;
  2. **general rules that apply**:
     - the rules its chapter cites (from the Law);
     - by topic: for each topic where the faction has its own rule, that topic's core and
       glossary rules;
     - extras: Appendix V for the Vagabond and K for the Knaves;
  3. rules it changes (icons);
  4. named elsewhere.

  Anchors: `#faction-rules`, `#general`, `#changes`, `#named`. Section anchors use the
  section id (`#section-6-2`) and rule anchors use the rule id.
- Topic tags on rule pages, the topic filter in search, and topic pages all come from
  `topics.ts`. A sub-rule inherits its parent's topics.
- The explorer file is `root.law`. `lib/workspace.ts` gained `pages` on a file, which names
  routes under it without listing them in the tree. Tabs show names like `6.2.3.law`,
  `chapter-6.law`, `vagabond.faction`, `search.law`, `topics.law` and `battle.topic`.
- How search works:
  - The search page ships the whole index (about 300 KB before compression) and searches in
    the browser.
  - Query language: a rule number lists that rule, then the rules under it. Words must all
    match, with prefixes and simple plurals counting. Text in "quotes" matches as a phrase.
  - Ranking: a title match beats text matches, and core rules and glossary entries win ties
    on a title match, so `move` finds 4.2 first.
  - The faction filter means "what that faction's page lists".
  - Search boxes: one on the contents page, and one on each faction page, limited to that
    faction. Typing an existing rule number and pressing Enter opens the rule directly.
- **Search URL gotcha:** `RootSearch` keeps query and filters in React state. It reads the URL
  once and writes it back with `history.replaceState`. Don't switch it to reading
  `useSearchParams` after load or to `router.replace`. On this static page, neither tracked
  URL changes made from the page once it had loaded with `?q=`: filters silently stopped
  applying. This was verified in headless Chrome.
- Faction pages contain three groups, all derived from the PDF:
  - the faction's own chapter;
  - "Rules the X changes": rules outside the chapter printed with its icon (`faction_markers`);
  - "Named elsewhere": a name match using the terms in `NAME_TERMS`. It skips "(Riverfolk)"
    tags and "… Expansion" lists, and the page says a mention isn't necessarily a rule that applies.

  The Marquise and Keepers have no icons outside their chapters in this edition.
  "General rules that apply" comes from topics.json (see above).
- The existing ESPN schedule tests in `lib/backend/providers/normalize.test.ts` fail because
  their fixtures depend on today's date. That's unrelated to Root.

### MVP plan

Build at `/board-games/root`, reading the JSON at build time. There is no new
backend, database or search service. The MVP needs:

- browse in book order
- core rules
- one page per faction, grouped as faction rules / general rules that apply /
  interactions and exceptions / related
- topics
- full-text search with faction, topic and section filters, and exact rule-number
  lookup
- a rule page with a deep link, page reference linking to the PDF page
  (`Root_2025_Law.pdf#page=N`), clickable cross-references and a visible
  verification state
- a layout that works on phones

Add an explorer file under Board Games.

## Working conventions

- Commit or push only when the owner asks. Stage only the files for the task.
  The working tree also holds the owner's unrelated edits, such as `AGENTS.md`,
  `app/layout.tsx`, `components/workspace/*`, `lib/members.ts` and
  `tailwind.config.ts`.
- Never invent Root rules. If the PDF doesn't say it, the site doesn't either.
- Keep `scripts/root/README.md`'s changelog and this file's status table current
  when the Root work moves forward.
- Don't add dependencies or infrastructure without a concrete need.
