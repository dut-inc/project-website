# The Log

A shared hub site for the group's projects: Fish Quiz, Sports Lab, Field Watch
(conservation), and The Board (general clubhouse). Built with Next.js 14 (App
Router) + TypeScript + Tailwind so it's easy to split work across a few
people — each project lives on its own route and can grow independently.

## Design concept

The homepage is **the clubhouse**: an illustrated, angled room (a warm,
slightly magical storybook living room / workshop) where the objects *are*
the navigation. The top navbar stays as the plain fallback.

| Object in the room | Section | Route |
| --- | --- | --- |
| Aquarium | Fish Stuff | `/fish-stuff` |
| Television | Sports Lab | `/sports` |
| Overgrown tree | Nature and Conservation | `/conservation` |
| Bulletin board | Loose Ends | `/board` |
| Game shelf | Board Games (incl. **The Pack**) | `/board-games` |
| Wall calendar | DLE (daily guessing games) | `/dle` |

**The Pack** is nested under Board Games: it lives at `/board-games/the-pack`
(rooms at `/board-games/the-pack/room/<code>`), shows up as "the special box"
on the Board Games page, and is drawn on the game shelf. Old `/the-pack/*`
links permanently redirect there (`next.config.js`). Nesting is driven by
`parent: "board-games"` in `lib/projects.ts`, which also keeps it out of the
navbar and the room.

On desktop the room is one angled two-wall composition; on phones it becomes
a three-storey cutaway of the same clubhouse (loft → den → ground floor) so
every object stays big enough to tap. Each object has an always-visible paper
name tag, a hover/focus hint, and is a real link (mouse, keyboard, touch).
Ambient motion (fish, bubbles, swaying leaves, TV flicker, fireflies) is pure
CSS and is switched off under `prefers-reduced-motion`.

Inner project pages keep the original corkboard/case-file look
(`components/CaseHeader.tsx`, `components/Pin.tsx`).

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

### NBA standings freeze (2026–27)

The live standings freeze at 9:00 AM Pacific on April 13, 2027. A Vercel Cron Job runs at 16:00 UTC (9:00 AM PDT) on April 13, captures the ESPN standings once, and stores the immutable snapshot in `nba_standings_snapshots`; requests after the cutoff serve that saved snapshot. If the cron misses the exact hour, the first request within that same hour can capture it; later requests will not overwrite it with standings potentially affected by play-in games. The scheduled run requires `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` in the deployment environment. Add the `nba_standings_snapshots` table by running the updated `supabase/nba-standings-schema.sql` in the Supabase SQL editor.

### Supabase view security

If the database was created before the leaderboard view was updated, run `supabase/game-leaderboard-security-invoker.sql` in the Supabase SQL editor once. New installs can use the `security_invoker` view definition in `supabase/schema.sql`; the view will then evaluate underlying-table RLS using the querying user rather than the view creator.

## Structure

```
app/
  layout.tsx          shared shell: fonts, nav, page container
  page.tsx            home — the clubhouse room
  fish-stuff/ sports/ conservation/ board/ dle/
  board-games/
    the-pack/         The Pack (nested under Board Games)
components/
  Nav.tsx, NavLinks.tsx   top navbar (top-level sections, current-section highlight)
  CaseHeader.tsx          shared header used on each project's own page
  clubhouse/
    ClubhouseRoom.tsx     the room: backdrop + one RoomObject per destination
    RoomObject.tsx        a clickable object: link, art, name tag, hover/focus
    ObjectArt.tsx         custom image with automatic fallback to placeholder SVG
    art/                  placeholder illustrations (one file per object + backdrops)
lib/
  projects.ts         single source of truth for sections, routes and nesting
  clubhouse.ts        which object leads where, and where it sits in the room
```

## The clubhouse room & replacing the artwork

The room is split into three independent layers, so artwork can be swapped
without touching navigation:

1. **Routes / titles** — `lib/projects.ts` (title, `href`, `parent`).
2. **Room layout** — `lib/clubhouse.ts`: for each object, the `projectId` it
   links to, an accessible `objectName`, a short `hint`, an optional `image`,
   and separate `desktop` / `mobile` placements.
3. **Artwork** — `components/clubhouse/art/`: one placeholder SVG component per
   object (`AquariumArt.tsx`, `TelevisionArt.tsx`, `TreeArt.tsx`,
   `BulletinBoardArt.tsx`, `GameShelfArt.tsx`, `CalendarArt.tsx`) plus the room
   shells (`RoomBackdrop.tsx` for desktop, `RoomBackdropMobile.tsx` for phones),
   registered in `art/index.ts`. The art has no links or logic in it.

### Swapping in a custom illustration for one object

1. Export the illustration with a transparent background (SVG, PNG or WebP),
   cropped tightly to the object. Draw it in the room's perspective; the
   placeholders' front faces slope down to the right at about 11° (a 0.2 rise
   per unit of width), parallel to the right-hand wall.
2. Drop it in `public/images/clubhouse/`, e.g. `public/images/clubhouse/aquarium.webp`.
3. In `lib/clubhouse.ts`, set `image: "/images/clubhouse/aquarium.webp"` on
   that object. If the file is missing or fails to load, the built-in
   placeholder SVG is shown instead.
4. Adjust that object's `desktop` / `mobile` placement if the new art has a
   different shape:
   - `x`, `y`: top-left corner, as a % of the room; `w`: width as a % of the
     room (height follows the image's aspect ratio).
   - `z`: stacking order (higher sits in front).
   - `label`: where the name tag hangs, as a % of the object's own box
     (default `{ x: 50, y: 100 }`, centred just below it).
   - `plane: "left-wall"`: only for flat, front-on art that should be skewed
     onto the left wall (the corkboard and calendar placeholders use this).
     Set it to `"none"` (or remove it) if your art is already drawn in
     perspective.

The room canvases are 1600 × 1000 (desktop) and 1000 × 3000 (mobile) —
`ROOM_ASPECT` in `lib/clubhouse.ts`. To replace a room shell, either redraw
`RoomBackdrop.tsx` / `RoomBackdropMobile.tsx` or have them render a single
`<img>` at the same aspect ratio. To restyle the name tags or hover glow, edit
the `.room-object*` rules in `app/globals.css`.

### Adding an object

Add the section to `lib/projects.ts`, add an id to `RoomObjectId` and an
entry to `ROOM_OBJECTS` in `lib/clubhouse.ts`, and register an art component
in `components/clubhouse/art/index.ts`. TypeScript flags a missing art entry.

## Daily character games

The DLE hub lives at `/dle`. Its game catalog is defined in `lib/dleGames.ts`, and every entry automatically gets a route at `/dle/<slug>` using the shared shell in `components/dle/DleGameShell.tsx`. Add a future universe or game format by adding a definition to `DLE_GAMES`; the catalog and static routes will pick it up without another page component.

The retired `/db-management` route redirects to `/dle` so old bookmarks still land in the new section.

## Adding a new project page

1. Add an entry to `lib/projects.ts` (case number, title, route, status, summary).
   Set `parent` to nest it under an existing section instead of making it top-level.
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
