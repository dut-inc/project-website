# The Pack — multiplayer "The Gang: Deluxe" (v1 MVP)

This is the implementation plan this feature was built from, checked in for reference. The live feature itself lives at `/the-pack` (top-level, not nested under `/board-games` — see the routing rationale below); this doc lives here because that's where it was asked to live.

## Context

This repo ("The Log") is a Next.js 16 App Router site on Vercel, run by Dennis for a friend group's shared projects (Fish Stuff, Sports Lab, Conservation map, DLE games, Board Games tier-list). The existing `/board-games` section is a CRUD/ranking tool for the group's physical board game shelf — no live multiplayer, no sockets, nothing like it exists anywhere in this codebase otherwise.

The goal of this project is a web multiplayer version of **The Gang: Deluxe**, a cooperative poker board game, codenamed **"The Pack"** in this codebase (avoiding the trademarked name in routes/identifiers). The ask was for the multiplayer feel of [ashermemon/stormhacks](https://github.com/ashermemon/stormhacks) — a single always-on Python process relaying WebSocket messages to everyone at a shared "table."

That architecture doesn't map directly onto this app: stormhacks runs as one persistent process holding in-memory state for the life of the connection, which Vercel's serverless Next.js deployment can't do. Vercel's new (June 2026, public beta) native-WebSocket-on-Functions support was evaluated and ruled out — connections force-close every ~5 minutes by default and still require an external Redis for cross-instance state/fan-out, so it isn't actually less infrastructure than the alternative. Instead this uses **Supabase Realtime** (Broadcast + Presence), already a dependency of this app (previously unused) — it gets the "everyone sees the table update live" feel without introducing or operating any new service.

**Decisions locked in during planning:**
- **Transport/hosting:** Supabase Realtime (Broadcast + Presence). Postgres is the source of truth. No separate server, no Edge Functions — all server-side logic is plpgsql, following this repo's existing "paste a `.sql` file into the Supabase SQL editor" convention (see `supabase/schema.sql`).
- **Language:** TypeScript on the client, plpgsql on the server.
- **Identity:** Supabase Anonymous Auth (`signInAnonymously()`) + room codes. No login screen — consistent with how the rest of the site already has no real per-user auth (just passcodes and hardcoded name lists). Anonymous auth gives each browser a real `auth.uid()` so RLS can actually scope access, instead of hand-rolling a token system like stormhacks did.
- **Routing:** Top-level section `/the-pack` (own entry in `lib/projects.ts`, own nav link), **not** nested under `/board-games`. `/board-games` today is single-player CRUD/ranking tooling; this introduces a live-room/presence/realtime model that shares nothing with it, and `lib/projects.ts` entries are the permanent global nav links regardless of nesting — nesting wouldn't even save a nav edit.
- **v1 scope is deliberately minimal.** Standard hold'em structure (2 private hole cards, flop/turn/river community reveal), a live-updating hand-rank ordering shown openly (no hidden "lock in chips, dramatically reveal, win/lose" resolution, no lives, no heist difficulty tiers — all future work). The one piece that must work really well: a shared pool of **N numbered chips** (N = seated player count) that any player can claim, release, or take from another player in real time, race-safely, visible to everyone instantly — the centerpiece interaction.
- **Hard security constraint:** a player's hole cards must never be sent over Realtime (no Broadcast, no Presence, no Postgres Changes) and must never be queryable by any other player. Everything else (community cards, chip ownership, presence, computed rank ordering) is intentionally public.

## 0. The one design decision that threads through everything

**Hole cards never touch Realtime.** They're delivered exclusively through an ordinary RLS-scoped PostgREST `select` (the same `.from(...).select()` pattern already used everywhere in this codebase), fetched client-side the moment a client learns (via Broadcast) that dealing happened. This makes the hard constraint provable by inspection: no hole card ever appears in a WebSocket frame.

Everything else is explicitly non-secret and goes out over **one private Broadcast channel per room**, server-triggered from inside `security definer` plpgsql functions via `realtime.send()`. Access control uses **Realtime Authorization** — RLS policies on the system table `realtime.messages`, with the channel opened client-side as `private: true`. No `insert` policy is needed: clients never broadcast directly — every event originates from inside a `security definer` RPC.

## 1. Data model — `supabase/the-pack-schema.sql`

Grants `select` to `authenticated` only (never `anon`), and no insert/update/delete grants at all — every write goes through a `security definer` function.

- **`the_pack_rooms`** — code, host, status (`lobby`/`round_active`), current round pointer, max players.
- **`the_pack_room_players`** — durable seat roster, unique per `(room_id, auth_user_id)` and per-room case-insensitive unique display name (via a unique index on `lower(display_name)`, not a plain constraint).
- **`the_pack_rounds`** — round number, street, revealed community cards only (never pre-populated).
- **`the_pack_round_decks`** — the undealt remainder. **No grants at all**, not even select — only reachable through `security definer` functions.
- **`the_pack_hole_cards`** — the protected table. RLS: `auth_user_id = auth.uid()` only. Zero write grants — rows exist only via `the_pack_deal_round`.
- **`the_pack_chips`** — ownership is explicitly public.
- **`the_pack_is_room_member(room_id)`** — `security definer` helper. Must be definer: `the_pack_room_players`'s own select policy calls it, and if it ran as invoker, checking membership would require passing the same membership policy — infinite recursion / false denial.

## 2. Server logic — 100% plpgsql, no Edge Functions

No `supabase/functions/`, no CLI, no `config.toml` anywhere in this repo — shipping this is "paste one more `.sql` file into the SQL editor," same as everything else.

- `the_pack_create_room` / `the_pack_join_room` (idempotent — an already-seated caller just gets their seat back, so join and resume-after-refresh are the same path) / `the_pack_deal_round` (host-only, shuffles via `array_agg(card order by random())`, deals 2/player, stores the remainder, creates N chips) / `the_pack_reveal_next_street` (host-only, pops 3/1/1 cards, recomputes rankings, broadcasts).
- Chip CAS: `the_pack_claim_chip` / `the_pack_release_chip` / `the_pack_transfer_chip` — each one atomic `UPDATE ... WHERE holder_room_player_id IS ...` statement; Postgres's row locking inside that single statement is what makes concurrent claims race-safe, and only the winner's call ever reaches `realtime.send()`.
- Hand evaluator: `the_pack_score5` / `the_pack_score_under5` / `the_pack_hand_rank` / `the_pack_hand_category_label` / `the_pack_rank_table`. Scores are a single orderable bigint (`category * 15^5 + k1*15^4 + ... + k5`), built by grouping ranks by `(count desc, rank desc)` and flattening — one technique that correctly orders every pair/trips/full-house/quads/high-card category at once, with straights/flushes special-cased. `the_pack_rank_table`'s return type structurally excludes `cards` — provably safe by construction.

## 3. Realtime channel design

One private channel per room, topic `the-pack-room-<room_id>`. Events: `player_joined`, `round_dealt` (no card data), `street_revealed` (community cards + rankings), `chip_claimed` / `chip_released` / `chip_transferred`. Presence is tracked client-side only (`channel.track({ auth_user_id })`) — no DB write, no disconnect handling needed; a dropped connection just disappears from `presenceState()`, leaving the durable seat untouched.

## 4. Identity flow

`utils/supabase/middleware.ts` already refreshes sessions (including anonymous ones) on every request via `proxy.ts` — no changes needed there. First visit calls `signInAnonymously()` if no session exists. **One manual dashboard step required:** Authentication → Sign In / Providers → Anonymous Sign-Ins must be toggled ON, or `signInAnonymously()` fails outright.

## 5. What was actually built

- Schema: `supabase/the-pack-schema.sql`
- Shared types + DB row parsers: `lib/thePack.ts`
- Hand evaluator (TS port, test oracle for the SQL version): `lib/thePackHandEvaluator.ts`, tested in `lib/thePackHandEvaluator.test.ts` (all 9 categories, kicker tiebreaks, the wheel straight, best-5-of-7, the <5-card reduced evaluator, ties)
- Pages: `app/the-pack/page.tsx` (create/join), `app/the-pack/room/[code]/page.tsx`
- Components: `components/the-pack/{CreateOrJoinRoom,ThePackRoom,PlayingCard,HoleCards,CommunityCards,ChipBoard,ChipHistory,PlayerRoster,RoundControls}.tsx`
- `lib/projects.ts` — new top-level entry, case `"007"`
- `app/globals.css` — `chip-claim-pop` keyframe, wired into `ChipBoard.tsx` so chip changes pulse for everyone at the table, not just the player who clicked
- **Chip history (added post-v1):** chips now carry a street color (white/yellow/orange/red for preflop/flop/turn/river, `STREET_CHIP_COLOR` in `lib/thePack.ts`) so the live board visually shows which street's arrangement is in play. Every time the host reveals the next street (or deals a fresh round), the server archives the outgoing street's chip arrangement into the new `the_pack_chip_history` table (`security definer`-only writes, same pattern as everything else) so every player can review how the group's chip order evolved across the whole round — rendered by `ChipHistory.tsx`.

## 6. Verification

**Before this works at all:** run `supabase/the-pack-schema.sql` in the Supabase SQL editor, and toggle Anonymous Sign-Ins on in the dashboard.

**Local multi-tab manual loop**, separate browser profiles per "player":
1. Create a room, join from 2+ other tabs with distinct names, confirm the roster/presence updates live.
2. Deal — confirm each tab shows only its own 2 cards (check the WS frame in devtools for `round_dealt`: no `cards` field).
3. Reveal flop/turn/river — confirm all tabs update in lockstep and the rank ordering updates with each street.
4. Chip race test: two tabs click the same unclaimed chip at once, repeatedly — confirm exactly one ever wins.
5. Transfer a chip someone else holds; refresh mid-round and confirm the same seat/cards come back, no re-deal.
6. Decisive proof of the hard constraint: grab a tab's bearer token from devtools and `curl` the PostgREST endpoint for `the_pack_hole_cards` directly — confirm it returns only that player's row.

**Automated:** `npm test` runs `lib/thePackHandEvaluator.test.ts` alongside the existing suites (all 14 cases pass).
