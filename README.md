# Perpetual Studio

A shared workspace site for the group's projects: Fish Lab, Sports Lab, Nature
& Conservation, Loose Ends, Board Games (incl. The Pack), DLE and About Us. Built with
Next.js (App Router) + TypeScript + Tailwind so it's easy to split work across
a few people — each project lives on its own route and can grow independently.


## Design concept

The site is an editor-style workspace inspired by the layout of Visual Studio
Code (not a copy of it): a **title bar** branded Perpetual Studio, a **file
explorer** on the left that is the primary navigation, and an **editor** on the
right that shows the selected page under a strip of **tabs**, with breadcrumbs.
Folders are sections and are pages themselves: clicking a
folder's name opens the section's page and expands it, and its chevron only
expands or collapses it. Files inside are the section's tools. The file names
(`seattle-dashboard.live`, …) are a navigation metaphor, not source filenames.

| Explorer | Route |
| --- | --- |
| Fish Lab (folder) / `which-fish-are-you.quiz` | `/fish-stuff`, `/fish-stuff/personality` |
| Sports Lab (folder) / `seattle-dashboard.live`, `offensive-archetypes.ipynb`, `nba-standings-pool.race`, `behind-the-plate.ipynb` | `/sports`, `/sports/dashboard`, `/sports/offensive-profiles`, `/sports/nba-standings`, `/sports/pitch-predictor` |
| Nature & Conservation (folder) / `sighting-map.geojson` | `/conservation`, `/conservation/sightings` |
| Loose Ends (folder) | `/board` |
| Board Games (folder) / `tier-list.rank` | `/board-games`, `/board-games/tierlist` |
| Board Games / `the-pack.deal` (+ `room-<code>.deal` while a room is open) | `/board-games/the-pack`, `/board-games/the-pack/room/<code>` |
| DLE (folder) / `genshin.dle`, `wuwa.dle` | `/dle`, `/dle/genshin-impact`, `/dle/wuthering-waves` |
| About Us (folder) / `ben.md`, `dennis.md`, `ivan.md`, `senlin.md` | `/about-us`, `/about-us/<name>` |
| `welcome.md` | `/` |

**The Pack** is nested under Board Games: it lives at `/board-games/the-pack`
(rooms at `/board-games/the-pack/room/<code>`). Old `/the-pack/*` links
permanently redirect there (`next.config.js`). Nesting is driven by
`parent: "board-games"` in `lib/projects.ts`.

How it behaves:

- **The URL is the source of truth.** The active tab is always the current
  route; tabs and explorer files are real `<Link>`s, so every page keeps its
  URL and refreshes, deep links and back/forward work.
- Tabs work like VS Code's preview mode: a single click (or quick open, or a
  link on a page) opens a page in a temporary tab with an italic name, which
  the next newly opened page replaces. Double-clicking the file in the
  explorer, or the tab itself, keeps it as a permanent tab. Clicking a page
  that already has a tab switches to it (never a duplicate). Closing a tab only removes it from the strip; closing the
  active one moves to its right-hand neighbour (else the left), and closing
  the last one shows an empty editor at `/`.
- Open tabs, collapsed folders and the explorer's visibility persist in
  `localStorage`. Navigating anywhere reveals the active file's folders.
- Shortcuts: <kbd>Ctrl/⌘ P</kbd> go to file, <kbd>Ctrl/⌘ B</kbd> toggle the
  explorer, middle-click closes a tab, arrow keys move through the explorer.
- Under 768px the explorer becomes a drawer (menu button, Esc or tapping
  outside closes it) and the tab strip scrolls sideways.
- The window is the scroll container, so pages' own scroll locks, portals and
  fixed dialogs keep working. Shell chrome stays at z-index ≤ 45; page dialogs
  (z-50+) cover it.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

### Board-game developer controls

The board-game tier list is publicly viewable, while add, edit, delete, and tier movement controls are hidden behind a developer passcode. Set the passcode in the server environment before starting Next.js:

```bash
BOARD_GAMES_PASSCODE=choose-a-local-dev-passcode npm run dev
```

For a local `.env.local` file, use `BOARD_GAMES_PASSCODE=...` without a `NEXT_PUBLIC_` prefix. The passcode is checked by `app/api/board-games/access/route.ts` and is not sent to the client as an environment variable. This is a UI/convenience gate; because the current Supabase CRUD client is public and its RLS policies permit anonymous writes, it is not a database security boundary. Use authenticated Supabase policies and server-side write routes if the table needs real access control.

### NBA standings passcode

The NBA standings edit controls use the same server-only signed-cookie pattern. Add `NBA_STANDINGS_PASSCODE` to the deployment environment before unlocking the boards:

```bash
NBA_STANDINGS_PASSCODE=choose-a-passcode
```

On Vercel, add it under **Project Settings → Environment Variables** for every environment that should support editing (for example, Production), then redeploy. Do not use a `NEXT_PUBLIC_` prefix: this value must remain server-only. If it is missing, `/api/nba-standings/access` intentionally returns the “Set NBA_STANDINGS_PASSCODE…” configuration message.

### Root rules chat (Gemini free tier)

The chat at `/board-games/root/ask` answers Root rules questions using Google Gemini's free tier. Set it up like this:

1. Create a key at [Google AI Studio](https://aistudio.google.com/apikey). Use a Google Cloud project with **no billing account**: that keeps the key on the free tier, so it can't cost money.
2. Add `GEMINI_API_KEY=...` to `.env.local` and restart `npm run dev`.
3. On Vercel, add the same variable under **Project Settings → Environment Variables**, then redeploy.

Keep the key server-only: no `NEXT_PUBLIC_` prefix. `GEMINI_MODELS` (comma-separated) optionally overrides the list of free models the chat tries in turn. Without the key, the page says the chat isn't set up.

Free-tier limits are per model and shared by every visitor (for example, `gemini-3.6-flash` allows 5 requests a minute, and one question takes 2–6 requests). When one model is busy or out of quota, the chat starts over on the next one. You can see your usage at https://ai.dev/rate-limit. Google may use free-tier prompts to improve its products, and the page tells visitors that.

### NBA standings freeze (2026–27)

The live standings freeze at 9:00 AM Pacific on April 13, 2027. A Vercel Cron Job runs at 16:00 UTC (9:00 AM PDT) on April 13, captures the ESPN standings once, and stores the immutable snapshot in `nba_standings_snapshots`; requests after the cutoff serve that saved snapshot. If the cron misses the exact hour, the first request within that same hour can capture it; later requests will not overwrite it with standings potentially affected by play-in games. The scheduled run requires `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` in the deployment environment. Add the `nba_standings_snapshots` table by running the updated `supabase/nba-standings-schema.sql` in the Supabase SQL editor.

### Supabase view security

If the database was created before the leaderboard view was updated, run `supabase/game-leaderboard-security-invoker.sql` in the Supabase SQL editor once. New installs can use the `security_invoker` view definition in `supabase/schema.sql`; the view will then evaluate underlying-table RLS using the querying user rather than the view creator.

## Structure

```
app/
  layout.tsx          fonts + the WorkspaceShell around every page
  page.tsx            welcome.md — the workspace start page
  icon.svg            favicon (the Perpetual Studio mark)
  fish-stuff/ sports/ conservation/ board/ dle/
  board-games/
    the-pack/         The Pack (nested under Board Games)
components/
  workspace/
    WorkspaceShell.tsx      frame: title bar, explorer, tabs, editor
    WorkspaceProvider.tsx   tab / folder / sidebar state, keyboard shortcuts
    Explorer.tsx            file tree
    EditorTabs.tsx          tab strip + breadcrumbs
    TitleBar.tsx, QuickOpen.tsx, EmptyEditor.tsx
    icons.tsx               decorative SVG icons (no routing logic)
  PageHeader.tsx            shared page header (back link, kicker, title, description) on every page
  CaseHeader.tsx            PageHeader for a section's own page (title + summary, no kicker)
lib/
  projects.ts         sections: titles, routes, status, nesting
  workspace.ts        the explorer tree: which file opens which route
  members.ts          the group's members (About Us pages)
  metadata.ts         link previews: site defaults and per-page title/description
```

Routes and titles come from `lib/projects.ts`; the explorer tree (file names,
icons, which route each file opens) lives in `lib/workspace.ts`; icons are
drawn in `components/workspace/icons.tsx` and referenced only by kind, so the
look can change without touching navigation. Workspace colors are the
`studio.*` Tailwind tokens in `tailwind.config.ts`; shell layout rules are the
`.ps-*` rules at the end of `app/globals.css`.


## Daily character games

The DLE hub lives at `/dle`. Its game catalog is defined in `lib/dleGames.ts`, and every entry automatically gets a route at `/dle/<slug>` using the shared shell in `components/dle/DleGameShell.tsx`. Add a future universe or game format by adding a definition to `DLE_GAMES`; the catalog and static routes will pick it up without another page component.

The retired `/db-management` route redirects to `/dle` so old bookmarks still land in the new section.

## Adding a new project page

1. For a new top-level section, add an entry to `lib/projects.ts` (case number,
   title, route, status, summary). Set `parent` to nest it under an existing
   section instead.
2. Create `app/<route>/page.tsx`. A section page starts with
   `<CaseHeader projectId="…" />` (copy `app/board/page.tsx`); any other page
   starts with `<PageHeader href="/its/route" … />`, which fills in the back
   link and file name from the explorer tree.
3. Add a file (and, for a new section, a folder) for it in `WORKSPACE_TREE` in
   `lib/workspace.ts` so it shows up in the explorer, quick open and the
   welcome page.
4. Give it a link preview: `export const metadata = pageMetadata("/its/route",
   { description })` (or `sectionMetadata("…")` for a section page), using the
   same description as its header. A client-component page puts this in a
   `layout.tsx` next to it (see `app/board-games/tierlist/`).
5. Build out the actual page content underneath the header.


## Offensive Archetypes (Sports Lab)

`/sports/offensive-profiles` is intentionally a different visual theme from
the rest of the site — dark, modern, orange-accented — rather than the
shared workspace styling, since it's meant to feel like a distinct data tool. Search a
player by name; their card shows photo/bio/stats on the left and a shot-zone
efficiency heatmap on the right, with the card's gradient tinted to their
team's colors (falls back to the default orange gradient if the team isn't
recognized or the player has none).

Key files:
- `lib/archetypes.ts` — typed access to `public/data/player-archetypes.json`
- `lib/teamColors.ts` — approximate NBA team brand colors used for the card gradient
- `components/ShotZoneHeatmap.tsx` — the shot-zone SVG (flat/stylized, not to exact court scale)
- `components/PlayerCardModern.tsx` — the card itself; falls back to initials if the NBA CDN headshot 404s (expected for the sample/fake player IDs)
- `components/PlayerSearchModern.tsx` — the search input + suggestion dropdown

It currently shows sample data (flagged with `"sample": true` in the JSON,
which triggers the banner on the page).

To use real data:

1. Run `notebooks/nba_shot_archetype_clustering.ipynb` locally (`pip install
   nba_api` first — it's not in the default scientific-Python stack, and
   `stats.nba.com` needs real internet access, so this won't run in a
   sandboxed environment).
2. Work through the notebook: it pulls a season's shot-location, assist-split,
   and box-score data, engineers features, clusters players with K-Means, and
   — after you eyeball the `cluster_profile` heatmap and fill in
   `CLUSTER_NAMES` — exports `player-archetypes.json`.
3. Copy that file over `public/data/player-archetypes.json` and rebuild.

Cluster naming is manual by design: K-Means only gives you numbers, and which
number corresponds to "rim runner" isn't stable across reruns.
