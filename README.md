# The Log

A shared hub site for the group's projects: Fish Quiz, Sports Lab, Field Watch
(conservation), and The Board (general clubhouse). Built with Next.js 14 (App
Router) + TypeScript + Tailwind so it's easy to split work across a few
people — each project lives on its own route and can grow independently.

## Design concept

Visual theme is a corkboard mounted on a dark wall. The board itself doesn't
span the full screen — there's wall showing on the sides, which is where a
few original (non-logo) Seattle sports stickers live for personality
(`components/Stickers.tsx`). Projects are pinned index/kraft cards
(`components/PinnedNote.tsx`), each with a colored pushpin and a status
(`ACTIVE` / `PLANNING` / `OPEN`). Fraunces for display type, IBM Plex
Sans/Mono for body and data. Add new projects by adding an entry to
`lib/projects.ts` (including rotation, paper color, and pin color) — the
home page grid picks it up automatically.

The stickers are original art referencing Seattle basketball/baseball
fandom (a pennant, an anchor, a rain drop) rather than reproductions of
actual team logos, since those are trademarked. Swap in real merch photos
of your own stuff if you'd rather — `components/Stickers.tsx` is just three
small components positioned absolutely in `app/page.tsx`.

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

## Structure

```
app/
  layout.tsx        shared shell: fonts, nav, page container
  page.tsx           home — the case-file grid
  fish-quiz/page.tsx
  sports/page.tsx
  conservation/page.tsx
  board/page.tsx
  dle/page.tsx        daily character guessing game catalog
components/
  Nav.tsx
  ProjectCard.tsx    card used on the home grid
  CaseHeader.tsx     shared header used on each project's own page
  StampBadge.tsx     the status stamp
lib/
  projects.ts        single source of truth for what shows on the home page
```

## Daily character games

The DLE hub lives at `/dle`. Its game catalog is defined in `lib/dleGames.ts`, and every entry automatically gets a route at `/dle/<slug>` using the shared shell in `components/dle/DleGameShell.tsx`. Add a future universe or game format by adding a definition to `DLE_GAMES`; the catalog and static routes will pick it up without another page component.

The retired `/db-management` route redirects to `/dle` so old bookmarks still land in the new section.

## Adding a new project page

1. Add an entry to `lib/projects.ts` (case number, title, route, status, summary).
2. Create `app/<route>/page.tsx` — copy an existing stub (e.g. `app/board/page.tsx`)
   and swap in a `<CaseHeader />` with the same case number/status.
3. Build out the actual page content underneath the header.

## Offensive Archetypes (Sports Lab)

`/sports/offensive-profiles` is intentionally a different visual theme from
the rest of the site — dark, modern, orange-accented — rather than the
corkboard look, since it's meant to feel like a distinct data tool. Search a
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
