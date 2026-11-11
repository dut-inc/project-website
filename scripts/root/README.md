# Law of Root ingestion

Turns the official Law of Root PDF into structured JSON for the Root Rules
Encyclopedia (`/board-games/root`). See `AGENTS.md` for the product rules.

```
public/data/root/Root_2025_Law.pdf   source PDF (committed, also served by the site)
scripts/root/extract_law.py          PDF -> JSON
scripts/root/make_review.py          JSON + PDF -> side-by-side review page
scripts/root/test_extract_law.py     tests
data/root/law-2025-10-13/            extracted data for that edition
```

## Setup

The project's Python environment is `.venv` (Python 3.12).

```
.venv/Scripts/python -m pip install -r scripts/root/requirements.txt
```

## Extract

```
.venv/Scripts/python scripts/root/extract_law.py \
    --pdf public/data/root/Root_2025_Law.pdf \
    --version 2025-10-13 \
    --out data/root/law-2025-10-13
```

`--only 2,6,G` writes only those chapters. The whole book is still parsed, so
cross-references resolve and the report covers every chapter. `source.json`
then records `"partial": true`. The committed data is the whole book.

The script prints a summary. A good run looks like this:

```
Report: 0 warnings, 0 unresolved refs, 0 numbering gaps, 0 duplicate ids, 1 tables
Conservation: 96077 characters read, 96077 written; all accounted for.
```

## Test

```
.venv/Scripts/python -m unittest scripts/root/test_extract_law.py -v
```

The whole-book tests pin facts checked by hand against the 2025-10-13 PDF
(counts, faction list, specific rules). If a new PDF changes them, update the
tests on purpose after reviewing the change.

## Review against the PDF

```
.venv/Scripts/python scripts/root/make_review.py \
    --pdf public/data/root/Root_2025_Law.pdf --data data/root/law-2025-10-13 \
    --chapters 2,6,G --out review.html
```

This builds one page with a crop of the PDF beside each extracted record. Reviewers mark
each one "Matches" or "Problem" and copy a text summary. Review results are
editorial data and will live outside the extracted folder (see below).

## Output files

| File | Contents |
| --- | --- |
| `source.json` | Edition, PDF path and SHA-256, extractor version, extraction time |
| `sections.json` | Chapters (level 1) and numbered sections (level 2) in book order |
| `rules.json` | One record per addressable piece of text, in book order |
| `factions.json` | Factions found from chapter headings (name, icon glyph, expansion) |
| `extraction-report.json` | Counts, conservation check, flags, warnings, known limitations |

### Rule records

- `id` is derived from the printed number: `6.2.3` → `rule-6-2-3`,
  `4.3.5.II` → `rule-4-3-5-ii`, `9.2.9.IIIa` → `rule-9-2-9-iii-a`,
  `G.20` → `rule-g-20`. Section text uses the section number (`2.5` → `rule-2-5`).
  Chapter introductions are `rule-<n>-intro`, and the preface is `rule-reading-the-law`.
- `rule_type`: `rule`, `sub-rule` (roman numerals and letters), `glossary`,
  `section-text` (body text directly under a section heading),
  `chapter-text` (text directly under a chapter heading, and the preface).
- `text` uses a small markup:
  - `*…*` marks italic reminder or clarification text, as printed;
  - `{item:boots}` marks an item icon (boots, bag, crossbow, hammer, sword, tea, coins, torch);
  - `{icon}` marks an inline icon the extractor cannot read (flagged in `layout_flags`);
  - a blank line separates paragraphs;
  - `cell | cell` lines are table rows.
- `faction_ids` is the faction whose chapter contains the rule.
- `faction_markers` lists the faction icons printed after the rule. The Law says
  these "mark rules modified by Faction Rules and Abilities sections".
- `cross_references` lists every number cited in the text with its resolved `target_id`.
  A target can be a rule or a section, and `null` means unresolved.
- `source_locations` holds one bounding box per page column the record occupies, in PDF points.

### Source data vs editorial data

Everything in `data/root/law-*/` comes from the PDF and is regenerated
on every import, so nothing in it should be edited by hand. Topics, related-rule links,
verification status and notes are editorial. They will live in separate files keyed by
rule `id` (planned: `data/root/editorial/`), so a re-import never overwrites
human review.

## Importing a new edition

1. Add the new PDF next to the old one. Don't overwrite the old PDF.
2. Extract it into a new folder named for its edition date, for example
   `data/root/law-2026-xx-xx/`.
3. Check the summary and `extraction-report.json`. Any warning, gap, unresolved
   reference, unknown glyph or conservation mismatch needs a look. A new layout
   may need parser changes.
4. Compare it with the previous edition: changed text, new or removed rule ids.
   *(A diff script is still to do.)* Reset `verification_status` for changed rules.
5. Point the site at the new folder once reviewed.

## How the PDF is read (2025-10-13 edition)

Facts about the source that the parser relies on:

- Selectable text throughout, no OCR. There are 32 pages: page 1 is the cover and table of contents, pages 2–29 hold the rules,
  and the credits, index (pp. 30–31) and a key-rules summary (p. 32) follow. Parsing stops
  at the CREDITS heading.
- Two columns split at x ≈ 315pt. The raw text order jumps between columns,
  so lines are sorted by page, then column, then position.
- Fonts mark structure:
  - chapter headings: Luminari;
  - section numbers: 12pt, followed by a 14pt title;
  - rule numbers, roman sub-rules and letters: 6pt;
  - rule titles: bold;
  - reminders: italic.
- Faction icons use `RootFactionFontRegular`. Each letter maps to a faction by
  the icon beside its chapter heading (M Marquise, E Eyrie, A Alliance,
  V Vagabond, L Lizard Cult, O Riverfolk, D Duchy, C Corvids, H Hundreds,
  K Keepers, F Lilypad, B Twilight Council, S Knaves). Lowercase letters draw
  the same faction (checked visually for `b`, `f`, `s`).
- Item icons use `GearIcons` (M boots, B bag, C crossbow, H hammer, S sword,
  T tea, X coins, F torch), identified by rendering each glyph.
- Expansion banners ("The next two sections refer to factions in The Riverfolk
  Expansion.") set `expansion` on the chapters that follow.
- The four hireling ability titles in H.2 contain vector icons, which become `{icon}`.

### Known limitations

- Small-caps key terms are encoded as ordinary lowercase text, so they can't be detected.
- Table layout is flattened to rows (only 5.2 Reach in this edition).
- The PDF doesn't contain card text, hireling cards, landmark cards or the
  Law of Rootbotics (Clockwork bots). The site must not imply that it does.

## Changelog

- **0.1.0** (2026-11-10): first extractor. Parses the whole 2025-10-13 Law (707 records:
  454 rules, 135 sub-rules, 36 glossary entries, 78 section texts and 4 chapter texts),
  with a character conservation check, review page and tests. The owner reviewed a
  sample of 80 records (chapters 2, 6, G and seven edge cases) against the PDF:
  80 match, 0 problems. The whole book was then written to `data/root/law-2025-10-13/`.
