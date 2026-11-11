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
| Extractor, tests, docs (`scripts/root/`) | Done, extractor 0.1.0 |
| Sample review: 80 records (ch. 2, 6, G + 7 edge cases) | **Passed 2026-11-10**: 80 match, 0 problems |
| Full-book extraction (`data/root/law-2025-10-13/`) | Done: 707 records, clean report |
| Editorial overlay (`data/root/editorial/`) | Not started |
| MVP site at `/board-games/root` | **Next** |
| Edition diff script | Not started |
| Phase 2+ (synonyms, semantic search, AI assistant) | Not started. AGENTS.md says not yet |

Branch: `root-encyclopedia` (from `main`).

### Layout

```
public/data/root/Root_2025_Law.pdf   source PDF; the site links source pages to it
scripts/root/extract_law.py          PDF -> JSON (PyMuPDF)
scripts/root/make_review.py          JSON + PDF -> review page (with review_template.html)
scripts/root/test_extract_law.py     18 unittest tests
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

`data/root/law-*/` is regenerated from the PDF. Topics, related-rule links,
`verification_status` and notes go in `data/root/editorial/` (planned), keyed by
rule `id`, so a re-import never overwrites human review. Rules in the reviewed
sample can be marked verified there. Everything else stays `unreviewed` until
checked.

### Next: MVP site

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
