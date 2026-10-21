-- "The Pack" (web multiplayer version of The Gang: Deluxe) tables, RPCs, and
-- Realtime wiring, used by /the-pack. Run this in the Supabase SQL editor.
--
-- Requires one manual dashboard step first: Authentication -> Sign In /
-- Providers -> Anonymous Sign-Ins must be toggled ON, or signInAnonymously()
-- fails outright on the client.
--
-- Security model: every table here grants `select` to `authenticated` only
-- (never `anon`) and grants NO insert/update/delete at all -- every write
-- goes through a `security definer` function below. `the_pack_round_decks`
-- gets no grants whatsoever (not even select), since it holds the undealt
-- remainder of the deck. `the_pack_hole_cards` is the one hard constraint:
-- its select policy only ever returns the calling player's own row, and it
-- is never broadcast over Realtime.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.the_pack_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_auth_user_id uuid not null,
  status text not null default 'lobby' check (status in ('lobby', 'round_active')),
  -- No FK to the_pack_rounds here (it would create a circular table
  -- dependency); only set via the_pack_deal_round / the_pack_reveal_next_street.
  current_round_id uuid null,
  max_players smallint not null default 8 check (max_players between 2 and 10),
  created_at timestamptz not null default now()
);

create table if not exists public.the_pack_room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.the_pack_rooms(id) on delete cascade,
  auth_user_id uuid not null,
  display_name text not null,
  seat_number smallint null,
  joined_at timestamptz not null default now(),
  constraint the_pack_room_players_room_user_key unique (room_id, auth_user_id)
);

-- Per-room (not global) name uniqueness, case-insensitive. A unique
-- constraint can't reference an expression like lower(...), so this has to
-- be a unique index instead of a table constraint.
create unique index if not exists the_pack_room_players_room_name_key
  on public.the_pack_room_players (room_id, lower(display_name));

create index if not exists the_pack_room_players_room_idx
  on public.the_pack_room_players (room_id);

create table if not exists public.the_pack_rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.the_pack_rooms(id) on delete cascade,
  round_number int not null,
  street text not null default 'preflop' check (street in ('preflop', 'flop', 'turn', 'river')),
  -- Only cards actually revealed so far -- never pre-populate future streets.
  community_cards text[] not null default '{}',
  created_at timestamptz not null default now(),
  ended_at timestamptz null
);

create index if not exists the_pack_rounds_room_idx on public.the_pack_rounds (room_id);

-- The undealt remainder of the shuffled deck. No grants at all (see header) --
-- only security definer functions ever read or write this table.
create table if not exists public.the_pack_round_decks (
  round_id uuid primary key references public.the_pack_rounds(id) on delete cascade,
  deck text[] not null
);

-- The protected table. Card encoding: two-char text codes like 'AS', 'TD',
-- '2C' (rank from 23456789TJQKA, suit from SHDC) -- chosen for SQL-editor
-- debuggability over a packed integer encoding.
create table if not exists public.the_pack_hole_cards (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.the_pack_rounds(id) on delete cascade,
  room_player_id uuid not null references public.the_pack_room_players(id) on delete cascade,
  -- Denormalized so RLS is a flat equality check with no join needed.
  auth_user_id uuid not null,
  cards text[] not null check (array_length(cards, 1) = 2),
  constraint the_pack_hole_cards_round_player_key unique (round_id, room_player_id)
);

create index if not exists the_pack_hole_cards_auth_user_idx
  on public.the_pack_hole_cards (auth_user_id);

-- Chip ownership is explicitly not secret.
create table if not exists public.the_pack_chips (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.the_pack_rounds(id) on delete cascade,
  chip_number smallint not null,
  holder_room_player_id uuid null references public.the_pack_room_players(id) on delete set null,
  updated_at timestamptz not null default now(),
  version bigint not null default 0,
  constraint the_pack_chips_round_number_key unique (round_id, chip_number)
);

create index if not exists the_pack_chips_round_idx on public.the_pack_chips (round_id);

-- Permanent snapshot of each street's chip arrangement, captured right
-- before the group moves on (the next street is revealed, or a fresh round
-- is dealt). Unlike the_pack_chips (live, mutable), rows here are never
-- updated -- this is what lets every player review how the group's chip
-- order evolved across preflop/flop/turn/river after the fact.
create table if not exists public.the_pack_chip_history (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.the_pack_rounds(id) on delete cascade,
  street text not null check (street in ('preflop', 'flop', 'turn', 'river')),
  chip_number smallint not null,
  holder_room_player_id uuid null references public.the_pack_room_players(id) on delete set null,
  captured_at timestamptz not null default now(),
  constraint the_pack_chip_history_round_street_chip_key unique (round_id, street, chip_number)
);

create index if not exists the_pack_chip_history_round_idx on public.the_pack_chip_history (round_id);

-- ---------------------------------------------------------------------------
-- Membership helper
-- ---------------------------------------------------------------------------

-- Must be security definer: the_pack_room_players' own select policy calls
-- this to check membership. If this ran as security invoker, checking
-- membership would itself require passing the membership-check policy on
-- the same table -- infinite recursion / false denial. security definer
-- lets it bypass RLS internally to safely answer one boolean question.
create or replace function public.the_pack_is_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.the_pack_room_players
    where room_id = p_room_id and auth_user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Room lifecycle
-- ---------------------------------------------------------------------------

-- Internal only (never granted to authenticated) -- only called from inside
-- the_pack_create_room.
create or replace function public.the_pack_generate_room_code()
returns text
language plpgsql
as $$
declare
  alphabet text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; -- excludes 0 O 1 I
  result text := '';
  i int;
begin
  for i in 1..5 loop
    result := result || substr(alphabet, (floor(random() * length(alphabet)) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.the_pack_create_room(
  p_display_name text,
  p_max_players smallint default 8
)
returns table (room_id uuid, code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_name text := btrim(p_display_name);
  new_room_id uuid;
  new_code text;
  attempt int := 0;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to create a room';
  end if;
  if normalized_name = '' then
    raise exception 'Display name cannot be empty';
  end if;
  if p_max_players < 2 or p_max_players > 10 then
    raise exception 'Room size must be between 2 and 10 players';
  end if;

  loop
    attempt := attempt + 1;
    new_code := public.the_pack_generate_room_code();
    begin
      insert into public.the_pack_rooms (code, host_auth_user_id, max_players)
      values (new_code, auth.uid(), p_max_players)
      returning id into new_room_id;
      exit;
    exception when unique_violation then
      if attempt >= 10 then
        raise exception 'Could not generate a unique room code, try again';
      end if;
    end;
  end loop;

  insert into public.the_pack_room_players (room_id, auth_user_id, display_name, seat_number)
  values (new_room_id, auth.uid(), normalized_name, 1);

  return query select new_room_id, new_code;
end;
$$;

create or replace function public.the_pack_join_room(
  p_code text,
  p_display_name text
)
returns table (room_id uuid, room_player_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_name text := btrim(p_display_name);
  found_room_id uuid;
  room_status text;
  room_max_players smallint;
  existing_player_id uuid;
  new_player_id uuid;
  next_seat smallint;
  seated_count int;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to join a room';
  end if;

  -- Deliberately selecting into plain scalars rather than a generic `record`:
  -- a zero-row SELECT INTO a `record` variable leaves it unassigned, and a
  -- later field access throws "record is not assigned yet" instead of
  -- letting us raise our own "no room found" error. Scalars are always safe.
  select id, status, max_players
  into found_room_id, room_status, room_max_players
  from public.the_pack_rooms
  where code = upper(btrim(p_code));

  if found_room_id is null then
    raise exception 'No room found with that code';
  end if;

  select id into existing_player_id
  from public.the_pack_room_players
  where the_pack_room_players.room_id = found_room_id and auth_user_id = auth.uid();

  -- Idempotent: an already-seated caller just gets their existing seat back.
  -- This makes "join" and "resume after refresh" the same code path.
  if existing_player_id is not null then
    return query select found_room_id, existing_player_id;
    return;
  end if;

  if room_status <> 'lobby' then
    raise exception 'This room already started a round -- you can only join before dealing starts';
  end if;
  if normalized_name = '' then
    raise exception 'Display name cannot be empty';
  end if;
  if exists (
    select 1 from public.the_pack_room_players
    where the_pack_room_players.room_id = found_room_id and lower(display_name) = lower(normalized_name)
  ) then
    raise exception 'That name is already taken in this room';
  end if;

  select count(*) into seated_count
  from public.the_pack_room_players where the_pack_room_players.room_id = found_room_id;
  if seated_count >= room_max_players then
    raise exception 'This room is full';
  end if;

  select coalesce(max(seat_number), 0) + 1 into next_seat
  from public.the_pack_room_players
  where the_pack_room_players.room_id = found_room_id;

  insert into public.the_pack_room_players (room_id, auth_user_id, display_name, seat_number)
  values (found_room_id, auth.uid(), normalized_name, next_seat)
  returning id into new_player_id;

  perform realtime.send(
    jsonb_build_object(
      'room_player_id', new_player_id,
      'display_name', normalized_name,
      'seat_number', next_seat
    ),
    'player_joined',
    'the-pack-room-' || found_room_id::text,
    true
  );

  return query select found_room_id, new_player_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Poker hand evaluator (pure, no table access)
-- ---------------------------------------------------------------------------

-- Scores exactly 5 cards. Returns a single orderable bigint: higher is
-- better. Encoding is category * 15^5 + k1*15^4 + k2*15^3 + k3*15^2 + k4*15 + k5,
-- category 0 (high card) .. 8 (straight flush). Kickers are built by
-- grouping ranks by (count desc, rank desc) and flattening -- this single
-- technique correctly orders pairs/two-pair/trips/full-house/quads/high-card
-- all at once. Straights and flushes (without pairs) are special-cased
-- since rank counts alone don't capture "five in a row" or "all one suit".
create or replace function public.the_pack_score5(p_ranks int[], p_suits text[])
returns bigint
language plpgsql
immutable
as $$
declare
  is_flush boolean;
  distinct_ranks int[];
  is_straight boolean := false;
  straight_high int := 0;
  sorted_desc int[];
  kickers int[] := array[0, 0, 0, 0, 0];
  category int;
  base bigint := 15;
  score bigint;
  flat int[] := '{}';
  g record;
  max_count int := 0;
  count_of_2s int := 0;
  i int;
begin
  is_flush := p_suits[1] = p_suits[2] and p_suits[1] = p_suits[3]
          and p_suits[1] = p_suits[4] and p_suits[1] = p_suits[5];

  select array_agg(r order by r desc) into sorted_desc from unnest(p_ranks) r;
  select array_agg(d order by d desc) into distinct_ranks
  from (select distinct r as d from unnest(p_ranks) r) s;

  if array_length(distinct_ranks, 1) = 5 then
    if distinct_ranks[1] - distinct_ranks[5] = 4 then
      is_straight := true;
      straight_high := distinct_ranks[1];
    elsif distinct_ranks[1] = 14 and distinct_ranks[2] = 5 and distinct_ranks[3] = 4
      and distinct_ranks[4] = 3 and distinct_ranks[5] = 2 then
      -- The wheel: A-2-3-4-5 is a straight with 5 as its high card.
      is_straight := true;
      straight_high := 5;
    end if;
  end if;

  if is_straight and is_flush then
    category := 8;
    kickers := array[straight_high, 0, 0, 0, 0];
  elsif is_straight then
    category := 4;
    kickers := array[straight_high, 0, 0, 0, 0];
  elsif is_flush then
    category := 5;
    kickers := sorted_desc;
  else
    for g in
      select r, count(*)::int as cnt from unnest(p_ranks) r group by r order by count(*) desc, r desc
    loop
      for i in 1..g.cnt loop
        flat := flat || g.r;
      end loop;
      if g.cnt > max_count then max_count := g.cnt; end if;
      if g.cnt = 2 then count_of_2s := count_of_2s + 1; end if;
    end loop;

    kickers := flat;
    category := case
      when max_count = 4 then 7
      when max_count = 3 and count_of_2s >= 1 then 6
      when max_count = 3 then 3
      when count_of_2s = 2 then 2
      when count_of_2s = 1 then 1
      else 0
    end;
  end if;

  score := category::bigint;
  for i in 1..5 loop
    score := score * base + coalesce(kickers[i], 0);
  end loop;

  return score;
end;
$$;

-- Scores 2-4 cards (only reachable in principle -- v1 only ever calls the
-- evaluator starting at the flop, i.e. always >= 5 cards). Straight, flush,
-- and full house are structurally impossible with fewer than 5 cards, so
-- this reuses the same group-by-count-then-rank flatten technique without
-- any straight/flush special-casing.
create or replace function public.the_pack_score_under5(p_ranks int[])
returns bigint
language plpgsql
immutable
as $$
declare
  flat int[] := '{}';
  kickers int[] := array[0, 0, 0, 0, 0];
  category int;
  base bigint := 15;
  score bigint;
  g record;
  max_count int := 0;
  count_of_2s int := 0;
  i int;
begin
  for g in
    select r, count(*)::int as cnt from unnest(p_ranks) r group by r order by count(*) desc, r desc
  loop
    for i in 1..g.cnt loop
      flat := flat || g.r;
    end loop;
    if g.cnt > max_count then max_count := g.cnt; end if;
    if g.cnt = 2 then count_of_2s := count_of_2s + 1; end if;
  end loop;

  for i in 1..5 loop
    kickers[i] := coalesce(flat[i], 0);
  end loop;

  category := case
    when max_count = 4 then 7
    when max_count = 3 then 3
    when count_of_2s = 2 then 2
    when count_of_2s = 1 then 1
    else 0
  end;

  score := category::bigint;
  for i in 1..5 loop
    score := score * base + kickers[i];
  end loop;

  return score;
end;
$$;

-- Dispatches on card count: for >=5 cards, tries every 5-card subset (at
-- most C(7,5)=21) and keeps the best; for <5, uses the reduced evaluator.
-- Pure/stable, touches no table -- safe to grant execute directly, which is
-- why it (and the two helpers above) are granted straight to `authenticated`
-- below even though they're also reached through security-definer callers.
create or replace function public.the_pack_hand_rank(p_cards text[])
returns bigint
language plpgsql
stable
as $$
declare
  n int := coalesce(array_length(p_cards, 1), 0);
  ranks int[] := '{}';
  suits text[] := '{}';
  i int;
  j int;
  k int;
  l int;
  m int;
  best bigint := -1;
  candidate bigint;
  rank_char text;
  rank_val int;
begin
  if n < 2 then
    raise exception 'Need at least 2 cards to score a hand';
  end if;

  for i in 1..n loop
    rank_char := substr(p_cards[i], 1, 1);
    rank_val := case rank_char
      when 'T' then 10 when 'J' then 11 when 'Q' then 12 when 'K' then 13 when 'A' then 14
      else rank_char::int
    end;
    ranks := ranks || rank_val;
    suits := suits || substr(p_cards[i], 2, 1);
  end loop;

  if n < 5 then
    return public.the_pack_score_under5(ranks);
  end if;

  for i in 1..n loop
    for j in i + 1..n loop
      for k in j + 1..n loop
        for l in k + 1..n loop
          for m in l + 1..n loop
            candidate := public.the_pack_score5(
              array[ranks[i], ranks[j], ranks[k], ranks[l], ranks[m]],
              array[suits[i], suits[j], suits[k], suits[l], suits[m]]
            );
            if candidate > best then
              best := candidate;
            end if;
          end loop;
        end loop;
      end loop;
    end loop;
  end loop;

  return best;
end;
$$;

-- Internal only -- only reached via the_pack_rank_table's security definer
-- context, never directly, so not granted to authenticated.
create or replace function public.the_pack_hand_category_label(p_score bigint)
returns text
language sql
immutable
as $$
  select case p_score / 759375 -- 15^5: isolates the category digit
    when 0 then 'High Card'
    when 1 then 'Pair'
    when 2 then 'Two Pair'
    when 3 then 'Three of a Kind'
    when 4 then 'Straight'
    when 5 then 'Flush'
    when 6 then 'Full House'
    when 7 then 'Four of a Kind'
    when 8 then 'Straight Flush'
    else 'Unknown'
  end;
$$;

-- Return type structurally excludes `cards` -- provably safe by
-- construction, not just convention: reading this function's signature
-- alone proves raw hole cards never leave it.
create or replace function public.the_pack_rank_table(p_round_id uuid)
returns table (room_player_id uuid, display_name text, rank_position int, label text)
language plpgsql
security definer
set search_path = public
as $$
declare
  round_room_id uuid;
  round_community text[];
  caller_room_player_id uuid;
begin
  select room_id, community_cards into round_room_id, round_community
  from public.the_pack_rounds where id = p_round_id;

  if round_room_id is null then
    raise exception 'Round not found';
  end if;
  if not public.the_pack_is_room_member(round_room_id) then
    raise exception 'Not a member of this room';
  end if;

  select id into caller_room_player_id
  from public.the_pack_room_players
  where room_id = round_room_id and auth_user_id = auth.uid();

  return query
  with scored as (
    select
      hc.room_player_id as rpid,
      rp.display_name as pname,
      public.the_pack_hand_rank(hc.cards || round_community) as score
    from public.the_pack_hole_cards hc
    join public.the_pack_room_players rp on rp.id = hc.room_player_id
    where hc.round_id = p_round_id
  )
  select
    scored.rpid,
    scored.pname,
    dense_rank() over (order by scored.score desc)::int,
    -- The relative order is fine for everyone to see (that's the "REVEALED
    -- ranks" feature), but the hand type itself (pair/two pair/...) is
    -- exactly what makes the real game's guessing/negotiation meaningful --
    -- only the caller's own row gets a label; everyone else's is masked.
    case when scored.rpid = caller_room_player_id
      then public.the_pack_hand_category_label(scored.score)
      else null
    end
  from scored;
end;
$$;

-- ---------------------------------------------------------------------------
-- Dealing and street reveals
-- ---------------------------------------------------------------------------

create or replace function public.the_pack_deal_round(p_room_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  room_host uuid;
  prev_round_id uuid;
  prev_round_street text;
  ranks text[] := array['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  suits text[] := array['S', 'H', 'D', 'C'];
  deck text[] := '{}';
  shuffled text[];
  remaining_deck text[];
  next_round_number int;
  new_round_id uuid;
  player_rec record;
  player_count int;
  r text;
  s text;
begin
  select host_auth_user_id, current_round_id into room_host, prev_round_id
  from public.the_pack_rooms where id = p_room_id;
  if room_host is null then
    raise exception 'Room not found';
  end if;
  if room_host <> auth.uid() then
    raise exception 'Only the host can deal a round';
  end if;

  select count(*) into player_count from public.the_pack_room_players where room_id = p_room_id;
  if player_count < 2 then
    raise exception 'Need at least 2 players to deal';
  end if;

  -- Dealing a new round means the previous one is over -- archive wherever
  -- its chips ended up (normally 'river') before its chip rows are orphaned
  -- by the fresh the_pack_chips rows below.
  if prev_round_id is not null then
    select street into prev_round_street from public.the_pack_rounds where id = prev_round_id;
    insert into public.the_pack_chip_history (round_id, street, chip_number, holder_room_player_id)
    select prev_round_id, prev_round_street, c.chip_number, c.holder_room_player_id
    from public.the_pack_chips c
    where c.round_id = prev_round_id
    on conflict (round_id, street, chip_number) do nothing;
  end if;

  foreach r in array ranks loop
    foreach s in array suits loop
      deck := deck || (r || s);
    end loop;
  end loop;

  select array_agg(card order by random()) into shuffled from unnest(deck) as card;

  select coalesce(max(round_number), 0) + 1 into next_round_number
  from public.the_pack_rounds where room_id = p_room_id;

  insert into public.the_pack_rounds (room_id, round_number, street)
  values (p_room_id, next_round_number, 'preflop')
  returning id into new_round_id;

  remaining_deck := shuffled;

  for player_rec in
    select id, auth_user_id from public.the_pack_room_players
    where room_id = p_room_id order by seat_number
  loop
    insert into public.the_pack_hole_cards (round_id, room_player_id, auth_user_id, cards)
    values (new_round_id, player_rec.id, player_rec.auth_user_id, remaining_deck[1:2]);
    remaining_deck := remaining_deck[3:array_length(remaining_deck, 1)];
  end loop;

  insert into public.the_pack_round_decks (round_id, deck) values (new_round_id, remaining_deck);

  insert into public.the_pack_chips (round_id, chip_number)
  select new_round_id, g.n from generate_series(1, player_count) as g(n);

  update public.the_pack_rooms
  set status = 'round_active', current_round_id = new_round_id
  where id = p_room_id;

  -- Payload never contains card data -- only that dealing happened and how
  -- many chips are in play. Each client fetches its own hole cards
  -- separately via the_pack_hole_cards' RLS-scoped select.
  perform realtime.send(
    jsonb_build_object(
      'round_id', new_round_id,
      'round_number', next_round_number,
      'player_count', player_count,
      'chip_numbers', (select jsonb_agg(g.n) from generate_series(1, player_count) as g(n))
    ),
    'round_dealt',
    'the-pack-room-' || p_room_id::text,
    true
  );

  return new_round_id;
end;
$$;

create or replace function public.the_pack_reveal_next_street(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  room_host uuid;
  active_round_id uuid;
  round_street text;
  round_community text[];
  cards_to_reveal int;
  new_street text;
  current_deck text[];
  drawn text[];
  updated_community text[];
begin
  select host_auth_user_id, current_round_id into room_host, active_round_id
  from public.the_pack_rooms where id = p_room_id;

  if room_host is null then
    raise exception 'Room not found';
  end if;
  if room_host <> auth.uid() then
    raise exception 'Only the host can reveal the next street';
  end if;
  if active_round_id is null then
    raise exception 'No active round';
  end if;

  select street, community_cards into round_street, round_community
  from public.the_pack_rounds where id = active_round_id;

  if round_street = 'preflop' then
    new_street := 'flop';
    cards_to_reveal := 3;
  elsif round_street = 'flop' then
    new_street := 'turn';
    cards_to_reveal := 1;
  elsif round_street = 'turn' then
    new_street := 'river';
    cards_to_reveal := 1;
  else
    raise exception 'All community cards are already revealed for this round';
  end if;

  select deck into current_deck from public.the_pack_round_decks where round_id = active_round_id;
  if current_deck is null or array_length(current_deck, 1) < cards_to_reveal then
    raise exception 'Not enough cards left in the deck';
  end if;

  drawn := current_deck[1:cards_to_reveal];
  update public.the_pack_round_decks
  set deck = current_deck[cards_to_reveal + 1 : array_length(current_deck, 1)]
  where round_id = active_round_id;

  updated_community := round_community || drawn;

  -- Archive the chip arrangement the group settled on for the street that's
  -- ending, before it moves on and the live the_pack_chips rows change again.
  insert into public.the_pack_chip_history (round_id, street, chip_number, holder_room_player_id)
  select active_round_id, round_street, c.chip_number, c.holder_room_player_id
  from public.the_pack_chips c
  where c.round_id = active_round_id
  on conflict (round_id, street, chip_number) do nothing;

  update public.the_pack_rounds
  set street = new_street, community_cards = updated_community
  where id = active_round_id;

  -- Community cards are non-secret, so including them directly in the
  -- payload is simpler than making every client re-fetch after each reveal.
  -- Rankings are NOT included here: the_pack_rank_table masks every row's
  -- hand-category label except the caller's own, which only works for a
  -- per-client RPC call -- a single broadcast payload is identical for
  -- every recipient, so it can never carry a correctly-masked version of
  -- it. Each client calls the_pack_rank_table itself after this event.
  perform realtime.send(
    jsonb_build_object(
      'round_id', active_round_id,
      'street', new_street,
      'community_cards', to_jsonb(updated_community)
    ),
    'street_revealed',
    'the-pack-room-' || p_room_id::text,
    true
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Chip claim / release / transfer -- the centerpiece interaction
-- ---------------------------------------------------------------------------

-- Each of these wraps one atomic UPDATE (Postgres's row locking inside a
-- single statement is what makes concurrent calls race-safe: only one
-- caller can ever affect a row, the loser affects zero rows and gets an
-- exception, and only the winner's call reaches realtime.send -- so only
-- one chip_claimed event ever goes out per claim, immediately correcting
-- the loser's optimistic UI) plus a broadcast in the same transaction.

create or replace function public.the_pack_claim_chip(p_round_id uuid, p_chip_number smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_room_player_id uuid;
  room_uuid uuid;
  caller_name text;
  updated_count int;
  released_chip_number smallint;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in';
  end if;

  select rp.id, rp.room_id, rp.display_name
  into caller_room_player_id, room_uuid, caller_name
  from public.the_pack_rounds r
  join public.the_pack_room_players rp
    on rp.room_id = r.room_id and rp.auth_user_id = auth.uid()
  where r.id = p_round_id;

  if caller_room_player_id is null then
    raise exception 'You are not seated in this room';
  end if;

  -- Each player holds at most one chip at a time -- claiming a new chip
  -- releases whatever chip they were already holding in this round, the
  -- same way picking up a different physical chip means putting the old
  -- one down.
  for released_chip_number in
    update public.the_pack_chips
    set holder_room_player_id = null, version = version + 1, updated_at = now()
    where round_id = p_round_id
      and holder_room_player_id = caller_room_player_id
      and chip_number <> p_chip_number
    returning chip_number
  loop
    perform realtime.send(
      jsonb_build_object('round_id', p_round_id, 'chip_number', released_chip_number),
      'chip_released',
      'the-pack-room-' || room_uuid::text,
      true
    );
  end loop;

  update public.the_pack_chips
  set holder_room_player_id = caller_room_player_id,
      version = version + 1,
      updated_at = now()
  where round_id = p_round_id
    and chip_number = p_chip_number
    and holder_room_player_id is null;

  get diagnostics updated_count = row_count;
  if updated_count = 0 then
    raise exception 'Chip % is already claimed', p_chip_number;
  end if;

  perform realtime.send(
    jsonb_build_object(
      'round_id', p_round_id,
      'chip_number', p_chip_number,
      'holder_room_player_id', caller_room_player_id,
      'holder_display_name', caller_name
    ),
    'chip_claimed',
    'the-pack-room-' || room_uuid::text,
    true
  );
end;
$$;

create or replace function public.the_pack_release_chip(p_round_id uuid, p_chip_number smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_room_player_id uuid;
  room_uuid uuid;
  updated_count int;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in';
  end if;

  select rp.id, rp.room_id into caller_room_player_id, room_uuid
  from public.the_pack_rounds r
  join public.the_pack_room_players rp
    on rp.room_id = r.room_id and rp.auth_user_id = auth.uid()
  where r.id = p_round_id;

  if caller_room_player_id is null then
    raise exception 'You are not seated in this room';
  end if;

  update public.the_pack_chips
  set holder_room_player_id = null,
      version = version + 1,
      updated_at = now()
  where round_id = p_round_id
    and chip_number = p_chip_number
    and holder_room_player_id = caller_room_player_id;

  get diagnostics updated_count = row_count;
  if updated_count = 0 then
    raise exception 'You are not holding chip %', p_chip_number;
  end if;

  perform realtime.send(
    jsonb_build_object('round_id', p_round_id, 'chip_number', p_chip_number),
    'chip_released',
    'the-pack-room-' || room_uuid::text,
    true
  );
end;
$$;

-- Deliberately not gated on "only the current holder may authorize" -- this
-- models the real game's trust-based table-talk mechanic (anyone can slide
-- a chip to anyone), not an adversarial permission system.
create or replace function public.the_pack_transfer_chip(
  p_round_id uuid,
  p_chip_number smallint,
  p_to_room_player_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_room_player_id uuid;
  room_uuid uuid;
  from_holder uuid;
  to_name text;
  updated_count int;
  released_chip_number smallint;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in';
  end if;

  select rp.id, rp.room_id into caller_room_player_id, room_uuid
  from public.the_pack_rounds r
  join public.the_pack_room_players rp
    on rp.room_id = r.room_id and rp.auth_user_id = auth.uid()
  where r.id = p_round_id;

  if caller_room_player_id is null then
    raise exception 'You are not seated in this room';
  end if;

  select display_name into to_name
  from public.the_pack_room_players
  where id = p_to_room_player_id and room_id = room_uuid;

  if to_name is null then
    raise exception 'That player is not seated in this room';
  end if;

  select holder_room_player_id into from_holder
  from public.the_pack_chips
  where round_id = p_round_id and chip_number = p_chip_number;

  -- Same one-chip-per-player invariant as the_pack_claim_chip: whatever
  -- other chip the recipient already held in this round gets released.
  for released_chip_number in
    update public.the_pack_chips
    set holder_room_player_id = null, version = version + 1, updated_at = now()
    where round_id = p_round_id
      and holder_room_player_id = p_to_room_player_id
      and chip_number <> p_chip_number
    returning chip_number
  loop
    perform realtime.send(
      jsonb_build_object('round_id', p_round_id, 'chip_number', released_chip_number),
      'chip_released',
      'the-pack-room-' || room_uuid::text,
      true
    );
  end loop;

  update public.the_pack_chips
  set holder_room_player_id = p_to_room_player_id,
      version = version + 1,
      updated_at = now()
  where round_id = p_round_id and chip_number = p_chip_number;

  get diagnostics updated_count = row_count;
  if updated_count = 0 then
    raise exception 'Chip % not found for this round', p_chip_number;
  end if;

  perform realtime.send(
    jsonb_build_object(
      'round_id', p_round_id,
      'chip_number', p_chip_number,
      'from_room_player_id', from_holder,
      'to_room_player_id', p_to_room_player_id,
      'to_display_name', to_name
    ),
    'chip_transferred',
    'the-pack-room-' || room_uuid::text,
    true
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.the_pack_rooms enable row level security;
alter table public.the_pack_room_players enable row level security;
alter table public.the_pack_rounds enable row level security;
alter table public.the_pack_round_decks enable row level security;
alter table public.the_pack_hole_cards enable row level security;
alter table public.the_pack_chips enable row level security;
alter table public.the_pack_chip_history enable row level security;

drop policy if exists "the pack rooms are readable by any signed-in player" on public.the_pack_rooms;
create policy "the pack rooms are readable by any signed-in player"
  on public.the_pack_rooms for select to authenticated using (true);

drop policy if exists "the pack room players are readable by room members" on public.the_pack_room_players;
create policy "the pack room players are readable by room members"
  on public.the_pack_room_players for select to authenticated
  using (public.the_pack_is_room_member(room_id));

drop policy if exists "the pack rounds are readable by room members" on public.the_pack_rounds;
create policy "the pack rounds are readable by room members"
  on public.the_pack_rounds for select to authenticated
  using (public.the_pack_is_room_member(room_id));

-- the_pack_round_decks: intentionally no policy at all. RLS is enabled with
-- zero policies (default deny) and there are no grants either (see below) --
-- belt and suspenders.

drop policy if exists "the pack hole cards are readable only by their owner" on public.the_pack_hole_cards;
create policy "the pack hole cards are readable only by their owner"
  on public.the_pack_hole_cards for select to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists "the pack chips are readable by room members" on public.the_pack_chips;
create policy "the pack chips are readable by room members"
  on public.the_pack_chips for select to authenticated
  using (
    exists (
      select 1 from public.the_pack_rounds r
      where r.id = round_id and public.the_pack_is_room_member(r.room_id)
    )
  );

drop policy if exists "the pack chip history is readable by room members" on public.the_pack_chip_history;
create policy "the pack chip history is readable by room members"
  on public.the_pack_chip_history for select to authenticated
  using (
    exists (
      select 1 from public.the_pack_rounds r
      where r.id = round_id and public.the_pack_is_room_member(r.room_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Realtime Authorization -- one private channel per room
-- ---------------------------------------------------------------------------
-- Clients never broadcast directly (no insert policy needed): every event
-- originates from inside a security definer function via realtime.send(),
-- so there is no way for a client to fabricate e.g. a chip_claimed event.
-- Presence on the same private channel is authorized by this same policy.

drop policy if exists "the pack room members can use their room channel" on realtime.messages;
create policy "the pack room members can use their room channel"
on realtime.messages for select to authenticated
using (
  realtime.topic() like 'the-pack-room-%'
  and public.the_pack_is_room_member(replace(realtime.topic(), 'the-pack-room-', '')::uuid)
);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated;

grant select on table public.the_pack_rooms to authenticated;
grant select on table public.the_pack_room_players to authenticated;
grant select on table public.the_pack_rounds to authenticated;
grant select on table public.the_pack_hole_cards to authenticated;
grant select on table public.the_pack_chips to authenticated;
grant select on table public.the_pack_chip_history to authenticated;
-- the_pack_round_decks: intentionally no grants at all.

grant execute on function public.the_pack_is_room_member(uuid) to authenticated;
grant execute on function public.the_pack_create_room(text, smallint) to authenticated;
grant execute on function public.the_pack_join_room(text, text) to authenticated;
grant execute on function public.the_pack_deal_round(uuid) to authenticated;
grant execute on function public.the_pack_reveal_next_street(uuid) to authenticated;
grant execute on function public.the_pack_claim_chip(uuid, smallint) to authenticated;
grant execute on function public.the_pack_release_chip(uuid, smallint) to authenticated;
grant execute on function public.the_pack_transfer_chip(uuid, smallint, uuid) to authenticated;
grant execute on function public.the_pack_rank_table(uuid) to authenticated;
-- Pure/stateless -- safe to expose directly, and the_pack_hand_rank calls
-- these two as the invoking (authenticated) role when called directly by a
-- client, so they need their own grants too.
grant execute on function public.the_pack_hand_rank(text[]) to authenticated;
grant execute on function public.the_pack_score5(int[], text[]) to authenticated;
grant execute on function public.the_pack_score_under5(int[]) to authenticated;
-- the_pack_generate_room_code and the_pack_hand_category_label are internal
-- only, always reached via a security definer caller already running as the
-- function owner -- intentionally not granted to authenticated.
