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
| AI rules assistant | **Built 2026-11-11 as a free, read-only MCP server** (no paid model, by owner decision). See "AI assistant (MCP server)" below |
| Setup tools: reach calculator, standard setup order, advanced draft | **Built 2026-11-11** on `root-gemini-chat`. See "Setup tools" below |
| On-site rules chat (Gemini free tier) | **Built 2026-11-11** on branch `root-gemini-chat`; needs `GEMINI_API_KEY`. Live-checked with the owner's key. See "Rules chat (Gemini)" below |
| Phase 2 (synonyms, related-rules panel, semantic search) | Not started; add only when real use shows a need |

Branches: the encyclopedia was merged to `main` as PR #38 (`root-encyclopedia`, now deleted
locally). The MCP server (`root-ai-assistant`) was merged as PR #39. The Gemini chat is on
`root-gemini-chat`.

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
- For the AI assistant, the owner chose "use them, flag them": the MCP tools return every rule
  with its check status, and the server instructions tell the AI to say when an answer rests
  on an unchecked rule.
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
app/board-games/root/   page.tsx (dashboard), law/page.tsx (lawbook contents), law/[chapter], rule/[slug], faction/[faction],
                        topics, topic/[topic], search  (all static)
scripts/root/make_topic_review.ts  owner review page for topics.json
lib/root/mcpTools.ts    the four read-only rule tools (MCP server and chat share them)
lib/root/geminiChat.ts  the Gemini tool loop + citation checks (server only)
lib/root/chatMarkup.ts  the chat's Markdown subset (pure)
components/root/RulesChat.tsx, app/board-games/root/ask/, app/api/root/chat/   the rules chat
lib/root/setupPlan.ts   reach check, setup order, A.8 draft (pure); lib/root/setup.ts builds its data
app/board-games/root/setup/, app/board-games/root/draft/   setup & reach, advanced draft
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
  - Search boxes: one on the lawbook page (`/board-games/root/law`), and one on each faction page, limited to that
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
- `next build` sometimes fails with "next/font/google queries have exactly one entry"
  (Turbopack, while fetching the site's Google fonts). Nothing in the code causes it, and a
  retry builds.

### AI assistant (MCP server)

**Owner decisions (2026-11-11):**
- Nothing that costs money: no paid model. (No LLM calls from the site was the first rule; it
  was later replaced by the free-tier Gemini chat, below.)
- MCP server only. A "copy a cited prompt to any chatbot" button was offered and declined.
- Unchecked rules are used but flagged.

**How it works.** `app/api/root/mcp/route.ts` serves a stateless Streamable HTTP MCP endpoint
at `/api/root/mcp`, built with `@modelcontextprotocol/server` v2 (`createMcpHandler`) and
`zod` v4. It serves the 2026-07-28 protocol natively, with the SDK's stateless fallback for
2025-era clients; GET and DELETE answer 405. People connect their own AI app, and the AI runs
on their account. The site only looks rules up.

- Tools (all read-only, with `readOnlyHint`) live in `lib/root/mcpTools.ts`, as plain
  functions returning text, tested in `mcpTools.test.ts`:
  - `search_rules` (query, plus optional faction, topic, chapter and limit);
  - `get_rule`;
  - `get_faction_rules` (`full` or `outline`);
  - `get_related_rules`.
- `SERVER_INSTRUCTIONS` carries the AGENTS.md grounding rules:
  - look rules up, and don't answer from memory;
  - cite rule numbers;
  - keep the Law's text separate from interpretation;
  - flag unchecked rules;
  - topics aren't rules;
  - ask about ambiguity, and show conflicts instead of resolving them;
  - this edition has no card text.
- Links in tool output use the request's origin, so they work on any deployment.
- There's no page for it on the site. The owner removed the "Use your own AI" page on
  2026-11-11. The setup notes for users are in `lib/root/USE_YOUR_OWN_AI.md`. The endpoint
  itself still works.
- Verified with curl (2025-06-18 handshake, `tools/list`, `tools/call`) and with the official
  `@modelcontextprotocol/client` 2.4.0, which negotiated 2025-11-25. The SDK's 2026-07-28
  path wasn't exercised by a client yet.
- A claude.ai custom connector needs a public URL, so it works only once this is deployed
  (merged to `main`). Claude Code can connect to localhost for testing:
  `claude mcp add --transport http root-rules http://localhost:3000/api/root/mcp`.
- There's no rate limiting. The endpoint is cheap (no model, no database), but if abuse ever
  shows up on the hosting bill, add a limit in the route.

### Layout (owner requests, 2026-11-11): Root Assistant dashboard

- The project is called **Root Assistant**. That name appears in the dashboard title, the
  `lib/workspace.ts` file title and the Board Games folder card ("AI help with the rules,
  advanced setup, and reach calculator"). The explorer file is still `root.law`.
- `/board-games/root` is the **dashboard**, not the lawbook.
  - The left half is the rules chat: a sticky, full-height panel whose messages scroll inside
    it.
  - The right half has the advanced setup draft on top and the reach calculator below.
  - On phones everything stacks: chat, draft, then reach.
  - The header has one link, Lawbook. The PDF is linked from the lawbook page.
  - An empty chat shows "Let's Root" in large type, with no example prompts.
- **The dashboard is wider than other pages.** Its root element has `.ps-wide`, and
  `app/globals.css` (`#editor:has(.ps-wide)`) raises the editor's max width from max-w-6xl to
  96rem. The owner found 112rem too wide. Other pages are unchanged.
- The lawbook contents live at `/board-games/root/law` (`LAW_HREF`, tab `lawbook.law`).
  Chapter, faction, search and topics pages link back to it.
- Root pages don't use the site's `PageHeader`. They use `RootPage` / `RootHeader` from
  `components/root/ui.tsx`. The **back link sits above the title**, and the title row carries
  the meta and the actions (kraft `TableLink`s).

### The look (owner request, 2026-11-11): paper and ink on a forest table

The owner asked for something that "says Root", not the editor look. They mentioned the small
tears found on paper edges, and asked for no generated images. **Everything is drawn in code.**

- `app/board-games/root/layout.tsx` wraps every Root page in `.root-theme`. It loads three
  fonts (via `next/font`):
  - IM Fell English: titles;
  - Alegreya: reading text;
  - Alegreya SC: labels and numbers, replacing monospace.

  It also injects the torn-edge tiles.
- `app/board-games/root/root-theme.css` holds:
  - the palette, as RGB channels behind Tailwind's `root-*` colours (`tailwind.config.ts`);
  - the table (`.ps-editor:has(.root-theme)`, dark wood under lamplight);
  - paper grain, fibres and stains (SVG `feTurbulence` data URIs; each filter's region is pinned
    to its tile so tiles repeat without seams);
  - torn edges, as two nested masks so the corners tear properly: `.root-torn` (top and
    bottom) wraps `.root-torn-sides` (left and right);
  - wooden-token buttons (`.root-btn`) and cardboard faction tokens (`.root-token`, with `--c` as
    the faction colour);
  - fields;
  - setup cards (`.root-card`; a locked card is tilted and stamped, echoing A.8.2.II "turn it
    sideways");
  - the reach score track.
- `lib/root/paperEdges.ts` generates the torn edges, deterministically from a seed.
  - Each edge is a gently ragged line with **rare, sharp triangular tears**. The owner asked for
    them like the game's torn-paper edges, and for fewer of them.
  - A tile of about 450–540px has at most one deep tear and sometimes a small second one.
  - There are three variants (`torn-a/b/c`), and each edge uses a different tile length so the
    pattern doesn't line up.
- **No tape** (the owner removed it on 2026-11-11). There's no Ask button either: in the chat,
  Enter sends and Shift+Enter adds a new line. The question box starts one line tall and grows
  to 4 lines, then scrolls; `useLayoutEffect` sizes it.
- `components/root/ui.tsx` holds:
  - `Paper` (a sheet with a paper, kraft or cream tone);
  - `RootHeader` and `RootPage`;
  - `TableLink`;
  - `Sword`: the militant marker, an echo of the setup cards' "red name with sword";
  - `InkHeading` (a heading with an inked squiggle).
- Root components use only `root-*` colours and `font-root*` families. The old `studio-*`
  classes were converted by a one-off script. Keep new Root UI in this palette. Faction colours
  stay presentation only (`factionStyle.ts`).
- Keep visible text short. The owner asked to drop lines such as "Law of Root · October 13,
  2025" and "707 entries". The edition stays in page metadata, and the lawbook footer
  attributes Leder Games.
- The chat panel, draft and reach calculator are compact: small chips, M/I badges, and setup
  steps folded in `<details>`. `/board-games/root/setup`, `/draft` and `/ask` reuse the same
  components on their own pages.

### Setup tools

**Owner decisions (2026-11-11):**
- Setup letters (5.1.7 "in setup order (A, B, C, etc.)") follow the Law's faction order:
  A = Marquise … M = Knaves.
- Militant setup cards: Marquise, Eyrie, Duchy, Hundreds, Keepers and Lilypad. The other seven
  are insurgent.
- Both facts are printed on the faction boards and setup cards, **not in the Law**. They live in
  `data/root/editorial/setup.json`, and the pages say so.
- The group's own check is to **show the militant/insurgent count only**, with no warning. It
  is labelled "our own check, not a rule".

**What's derived from the Law:**
- Reach values and totals: `reachTable()` in `lib/root/setup.ts` parses them from 5.2's text.
  It throws if a faction is missing.
- Corner starts: a setup section containing "in a/any corner clearing". That gives 7 factions,
  and chapter 5 requires the Advanced Setup with 5 or more.
- The draft procedure, A.8.1–A.8.3.

**Pages:**
- `/board-games/root/setup` (`setup.law`): pick factions; see reach, counts and the corner
  rule; then standard setup order with each faction's X.3 setup section.
- `/board-games/root/draft` (`draft.law`): the on-screen A.8 draft.
  - Deals one militant card first, then one card per player.
  - Two players: no insurgents, unless kept (A.8.2.I).
  - Locks the last card if it's an insurgent.
  - Vagabond character and Knaves captain notes.
  - Can't include both the Vagabond and the Knaves.
  - Choosing: last player first, counterclockwise.
  - Each faction's setup steps appear as it's chosen.

**Code:**
- `lib/root/setupPlan.ts`: pure logic, also used in the browser.
- `lib/root/setup.ts`: builds the data on the server.
- Components: `SetupHelper`, `AdvancedDraft`, `setupParts` and `FactionSetupSteps`. The last is
  a server component, passed to the client components as `steps` props.
- `lib/root/setup.test.ts`: the deal is checked over 200 seeds.
- State is kept per tab in sessionStorage. The A.1–A.7 one-liners on the draft page are
  summaries that link to the rules.

### Rules chat (Gemini)

**Owner decision (2026-11-11, later the same day):** add a chat window to the site, backed by
Google Gemini's **free tier**. This replaces "no LLM calls from the site". It still has to stay
free: the key must come from a Google Cloud project **without billing**. With billing on, the
same key is billed on the paid tier.

- Page: `/board-games/root/ask` (tab `ask.law`); `?faction=<id>` preselects "Playing as".
  Linked from the contents header and from every faction page.
- `lib/root/geminiChat.ts` runs the loop:
  - It calls the REST `generateContent` endpoint with function calling (no SDK).
  - The tools are the same four functions as the MCP server, from `mcpTools.ts`.
  - The instructions are `SERVER_INSTRUCTIONS` plus chat rules: cite plain rule numbers, no
    URLs, a short answer shape.
  - The model's turns go back verbatim, so Gemini 3 thought signatures survive.
  - At most 6 tool rounds. The last one sets `functionCallingConfig.mode: "NONE"` and adds a
    "last lookup, answer now" text. If the model still asks for a lookup then, its text is used.
  - **Model chain.** A 429, a 500/503/504, a 404 or a 20 s timeout moves the question to the next
    model in `GEMINI_MODELS`, which starts the answer over. The model's own turns are never
    sent to another model. The whole answer has a 55 s deadline.
- After an answer, `citationsIn()` resolves every rule number in it. The page links each
  number and flags these cases:
  - a rule the tools never returned ("cited without looking it up");
  - a number that isn't in the Law;
  - unchecked rule text.
- `lib/root/chatMarkup.ts` handles formatting. It renders a small Markdown subset as React
  nodes, never raw HTML, and keeps links only into `/board-games/root`.
- `app/api/root/chat/route.ts` streams NDJSON `ChatEvent`s. It allows 6 questions a minute and
  100 a day per IP, counted in memory, so this is a soft limit per instance. Google's free quota
  is the hard cap, and hitting it costs nothing.
- Env: `GEMINI_API_KEY` (required) and `GEMINI_MODELS` (optional, comma-separated). The default
  is `gemini-3.6-flash,gemini-3.5-flash-lite,gemini-3.1-flash-lite`. Findings from probing on
  2026-11-11:
  - All three make tool calls correctly in 1–5 s.
  - `gemini-3.8-flash` returned 503 "high demand" or timed out every time, so it is left out.
  - `gemini-2.5-flash` returns 404, because it's no longer offered to new keys.
  - Gemma 4 was overloaded or skipped the tool call, so it isn't used.
  - Free limits are per model per project. `gemini-3.6-flash` allows 5 requests a minute, and
    one question takes 2–6 requests, so overflow to the next model is normal.
  - Usage is visible at https://ai.dev/rate-limit.
  - Locally, put them in `.env.local`. On Vercel, add them under Project Settings › Environment
    Variables.
  - Without the key, the page says the chat isn't set up.
- Google uses free-tier prompts to improve its products. The page tells visitors this.
- Tests: `lib/root/geminiChat.test.ts` uses a fake Gemini (no network). It covers:
  - the loop and the verbatim echo;
  - the model chain, the deadline, errors and the last-round cutoff;
  - citations and markup.

  Live check (2026-11-11, owner's key) with three questions: movement paths, Vagabond into a
  Hostile clearing, and Ambush card text. All three were cited and grounded. The unchecked
  Vagabond rules were flagged, and "no card text in this edition" was stated. The chain took
  over from `gemini-3.6-flash` mid-run on its 5-per-minute limit.
- **Faction links (fix for an owner report, 2026-11-11).**
  - The bug: playing as the Vagabond, "can I move into a forest with the Knaves in it?" got
    "yes". The model only searched "forest" and never found 18.2.1, "The Knaves of the Deepwood
    cannot be played in the same game as the Vagabond". Asked from the Knaves' side, it was
    right.
  - The fix: `lib/root/factionLinks.ts` finds the factions a question involves (the
    playing-as faction plus any named in it). It then finds the Law's rules linking them: rules
    in one faction's chapter, or naming it, that also belong to or name the other. Rules naming
    more than 3 factions are lists (5.2) and are skipped; at most 8 rules are kept.
  - `questionContext()` / `systemText()` give those rules' text to the model up front. They
    count as looked up for the citation check, and the page shows the step "Checked the rules
    linking …".
  - The instructions also say: never conclude something is allowed just because no rule
    forbids it; with two factions, check first that they can share a game.
  - Live check: both directions now answer "no" and cite 18.2.1.

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
