# Project Status

_Last updated: 2026-11-03 (branch `overhaul`)._

## Current state

The site has been redesigned as **Perpetual Studio**, an editor-style workspace
(title bar, file explorer, tabs, editor) that wraps every existing
route. All existing pages, APIs and routes are unchanged in behavior; only the
navigation shell, the home page and the shared section header changed.

The redesign is **uncommitted** in the working tree on `overhaul`.

## Completed

- Workspace shell: `components/workspace/*` (WorkspaceShell, WorkspaceProvider,
  Explorer, EditorTabs, TitleBar, QuickOpen, EmptyEditor, icons).
- Explorer tree defined in `lib/workspace.ts`. The top-level folders are Fish
  Lab, Sports Lab, Nature & Conservation, Loose Ends, Board Games and DLE, plus
  `welcome.md`. The Pack is a regular file (`the-pack.deal`) inside Board
  Games, with open rooms listed beside it; per the user it is not a folder or
  a special-cased card.
- Folders are pages: clicking a folder's name opens its section page (and
  expands it; clicking it again while it's open folds it), and the chevron only
  toggles. This replaced the per-section `README.md` files. Folder pages show their folder icon in tabs and quick open.
- Color: the accent is Visual Studio blue (`#007ACC`, `#3794FF` for text),
  with blue selection and cooler neutral text. It replaced
  the earlier amber accent.
- Tabs: open, switch, no duplicates, close (button or middle-click), neighbour
  selection, empty state when all are closed, persistence across refresh.
- Preview tabs (VS Code style, user request): single click / quick open /
  in-page links open a temporary italic tab that the next new page replaces;
  double-clicking the explorer row or the tab keeps it. On phones the drawer
  closes after the first tap, so pages are kept by double-tapping their tab.
- Explorer: expand and collapse, collapse all, active-file highlight, open-file
  dots, auto-reveal of the active file, and arrow-key
  navigation.
- Quick open (Ctrl/⌘ P), explorer toggle (Ctrl/⌘ B), breadcrumbs. The status bar and the "Open editors" explorer section were
  removed at the user's request; open tabs are shown by the tab strip and the
  dots in the tree.
- Mobile: explorer drawer (menu, Esc, overlay tap), scrollable tab strip, and
  touch-sized rows and close buttons.
- `/` is now `welcome.md`, built from `lib/projects.ts` and `lib/workspace.ts`.
- Shared page frame: every page starts with `components/PageHeader.tsx` (back
  link to its explorer folder, mono kicker with the file name, display-font
  title, description, optional GitHub link). `CaseHeader` is now a thin wrapper
  for section pages; at the user's request it no longer shows the "Case №" and
  status kicker (the `case` field is still used by the tier list's passcode
  dialog). Page width is one `max-w-6xl` on the editor's `<main>`.
  The tools' own titles and back links were replaced by it (the dashboard's
  neon "Seattle Sports Center" sign, the pitch
  predictor's brush title, the DLE and fish-quiz card titles, the tool pages'
  custom back links). Offensive Profiles and Behind the Plate no longer paint a
  full-bleed black background. Everything below the header keeps its theme,
  per the user's choice of "shared frame only".
  Exception: the NBA standings pool (`/sports/nba-standings`) was reverted at
  the user's request and keeps its own cut-out headline and sticker back link.
- About Us: a top-level folder (`/about-us`, case 008) with a page per member
  (`/about-us/ben`, `dennis`, `ivan`, `senlin`) from `lib/members.ts`. A
  member's `bio`, `links` (GitHub, LinkedIn…) and `projects` (routes; a folder
  route also lists its files) live there too. Every member page has the same
  layout: name, links, bio, then "What I've worked on". These pages hide the
  header's file-name kicker. Ben's page is filled in; the others show "Nothing
  here yet." / "Nothing listed yet." until their entries are written.
- Copy changes requested by the user: welcome.md's description is "What we're
  working on"; The Pack's summary is "cooperative poker".
- DLE games (user request): renamed "Genshindle" and "Wuwadle", with explorer
  files `genshin.dle` and `wuwa.dle` (a `file` field in
  `lib/dleGames.ts`; the URLs `/dle/genshin-impact` and `/dle/wuthering-waves`
  are unchanged). Both game boxes were compacted so the guess input and the
  latest clues fit on screen: tighter padding, smaller in-box heading (its
  JENSHINDLE/WUWADLE kicker was dropped as it repeated the page title),
  56px clue rows with smaller icons, a table narrow enough not to scroll
  sideways in the editor, and the Developer tools moved below the board.
- Link previews (user request): the site description is "View our projects"
  and every page has its own title and description in its metadata and Open
  Graph/Twitter tags (`lib/metadata.ts`), the same text as its page header.
  Section pages use their summary, DLE games their description, member pages
  the first line of their bio. The tier list gets its metadata from a route
  `layout.tsx` because the page is a client component; The Pack's page no
  longer needed `"use client"`. The NBA pool keeps its own title and
  "View our predictions!!". Offensive Profiles' description is now "search an
  NBA player to see their offensive profile". Checked in the raw HTML of all
  21 routes.
- The logo's infinity loop was re-centred (it sat 0.5 units left of centre).
- Section titles: "Fish Stuff" became "Fish Lab", and "Nature and Conservation"
  became "Nature & Conservation".
- Added a favicon at `app/icon.svg`.
- Removed the clubhouse room (`components/clubhouse/*`, `lib/clubhouse.ts`, its
  CSS) and the old navbar (`components/Nav.tsx`, `NavLinks.tsx`).
- Codebase cleanup (user request): deleted the archived `backup/` folder
  (pre-punk NBA layout), the unused `components/DatabaseManager.tsx` (the old
  `/db-management` page, which now redirects to `/dle`) and
  `components/board-games/QuickStartGuide.tsx`, the finished one-off
  `standings-agent.md` prompt, every `.DS_Store` (now in `.gitignore`), the
  unused `.text-outline` CSS, and dead exports nothing imported
  (`STARTER_GAMES`, `makeBoardGameId`, `SIGHTINGS_BY_ID`, `groupByArchetype`,
  `teamMetaById`, `espnTeamDisplay`, `teamOf`, `PredictionRecord`,
  `pitcherTopPitches`, `isPitchType`, `topLevelProjects`, and the dashboard's
  `ChevronUpIcon` and `TrophyIcon`). Everything in `public/` is in use (the NBA
  logos are loaded by computed paths). All of it is in Git history.
- Deleted unreferenced assets: `public/images/ibisreview.png` (only used by the
  removed clubhouse), `public/images/shelf.avif`, and the sighting placeholders
  `forest`, `marsh`, `mountain` and `river.svg` (`coast.svg` is still the
  fallback photo).

## Important decisions

- The URL is the source of truth for the active tab, and everything navigates
  through the Next.js router. There is no client-only mock navigation.
- The window stays the scroll container, because several pages lock
  `document.body` scroll and render fixed or portaled dialogs. Shell chrome is
  at z-index 45 or below.
- `SightingMap` wrapper got `isolate` so Leaflet's z-index 400+ panes stay
  under the sticky tab strip.

## Verification performed

- `npx tsc --noEmit`: passes.
- `npx next build`: passes after the cleanup; every route still builds (plus
  `/icon.svg` and the About Us pages).
- `npx eslint app components lib proxy.ts`: clean. The two old "refs during
  render" errors in `components/sports/dashboard/TeamCardGrid.tsx` were fixed
  in the cleanup (the refs are now updated in a layout effect); drag-to-reorder
  on the dashboard was re-checked in the browser.
- Smoke test after the cleanup: all 22 routes return 200 with their title and
  no console errors.
- `npm test`: 40 pass, 2 fail. Both failures are date-dependent ESPN schedule
  fixtures in `normalize.test.ts`, and they also fail without these changes.
- Browser (headless Chrome via Playwright against `next dev`):
  - 62/62 desktop checks (latest run, after the cleanup): every explorer file opens the right route with the
    tab and explorer in sync; tab switching, closing and empty state; refresh
    and deep links; the `/the-pack/*` and `/db-management` redirects; dynamic
    room tabs; quick open; Ctrl+B; keyboard tree navigation; a 404 opening as
    a tab; chevron toggles without navigating, folder name opens the section
    and expands it, clicking the active folder folds it, empty folders have
    no chevron.
  - 21/21 mobile checks (390×844): drawer, navigation, no horizontal
    overflow, tab strip scrolling, touch sizes.
  - Page dialogs (portaled and inline) cover the chrome; the Leaflet map stays
    under the tabs.
  - No console errors on the pages tested.

## Not done / known limitations

- Switching tabs navigates between routes, so a page's in-memory state
  resets when you leave its tab. Pages that persist their own state, such as
  the DLEs, are unaffected. Keeping pages mounted would need a non-route
  approach.
- Scroll position isn't remembered per tab (Next.js scrolls to the top on
  navigation).
- Not tested with real accounts or writes: The Pack rooms with multiple
  players, NBA standings and board-game passcode unlocks, and sighting uploads.
  These pages render and their dialogs open, but their flows weren't exercised
  end to end.
- Inner tool UIs keep their own themes on purpose (paper collage, card shelf,
  cream cards). Some still carry an inner heading under the page title, e.g.
  the tier list's "Our Board Games" with its counts.
- The keyboard hint reads "Ctrl P" on every platform, even though ⌘P also
  works on macOS.

## Recommended next steps

1. Review the redesign in a browser and commit on `overhaul` when happy.
2. Decide whether any inner tool UIs should move to workspace styling.
3. Fix or refresh the two date-dependent ESPN fixture tests.
