# The Log

A shared hub site for the group's projects: Fish Quiz, Sports Lab, Field Watch
(conservation), and The Board (general clubhouse). Built with Next.js 14 (App
Router) + TypeScript + Tailwind so it's easy to split work across a few
people — each project lives on its own route and can grow independently.

## Design concept

Visual theme is a "field log / case file" — deep ink background, moss/stamp/gold
accents, Fraunces for display type, IBM Plex Sans/Mono for body and data. Each
project is a "case" with a status stamp (`ACTIVE` / `PLANNING` / `OPEN`), logged
chronologically on the home page. Add new projects by adding an entry to
`lib/projects.ts` — the home page grid picks it up automatically.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Structure

```
app/
  layout.tsx        shared shell: fonts, nav, page container
  page.tsx           home — the case-file grid
  fish-quiz/page.tsx
  sports/page.tsx
  conservation/page.tsx
  board/page.tsx
components/
  Nav.tsx
  ProjectCard.tsx    card used on the home grid
  CaseHeader.tsx     shared header used on each project's own page
  StampBadge.tsx     the status stamp
lib/
  projects.ts        single source of truth for what shows on the home page
```

## Adding a new project page

1. Add an entry to `lib/projects.ts` (case number, title, route, status, summary).
2. Create `app/<route>/page.tsx` — copy an existing stub (e.g. `app/board/page.tsx`)
   and swap in a `<CaseHeader />` with the same case number/status.
3. Build out the actual page content underneath the header.

## Suggested next steps

- **Fish Quiz**: start with the personality-quiz version (a few questions →
  a result mapped to a fish); the photo-based species ID model can slot in later
  and double as the model for Field Watch.
- **Sports Lab**: pick one narrow thing first — a win-probability chart for a
  single game is enough to prove the data pipeline (`nba_api` / `pybaseball`)
  works end to end.
- **Field Watch**: once the species ID model exists, this is mostly a shared
  map/log UI — could reuse Sports Lab's data-viz components.
- **Auth**: none yet — this is meant for a small trusted group. If you want to
  gate it, [NextAuth](https://authjs.dev) with a single shared password or
  GitHub OAuth (just you + friends) is the least-fuss option.
- **Deploy**: push to GitHub, import into [Vercel](https://vercel.com) — zero
  config needed for a project this shape.
