// Shared types for /the-pack, mirroring the DB shapes defined in
// supabase/the-pack-schema.sql. Parallel to how lib/boardGames.ts centralizes
// types for the board-games section.

export const SUITS = ["S", "H", "D", "C"] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"] as const;
export type Rank = (typeof RANKS)[number];

// Two-char card code, e.g. "AS" (ace of spades), "TD" (ten of diamonds).
export type Card = `${Rank}${Suit}`;

export function parseCard(card: Card): { rank: Rank; suit: Suit } {
  return { rank: card[0] as Rank, suit: card[1] as Suit };
}

export const STREETS = ["preflop", "flop", "turn", "river"] as const;
export type Street = (typeof STREETS)[number];

export type RoomStatus = "lobby" | "round_active";

export type ThePackRoom = {
  id: string;
  code: string;
  hostAuthUserId: string;
  status: RoomStatus;
  currentRoundId: string | null;
  maxPlayers: number;
  createdAt: string;
};

export type ThePackRoomPlayer = {
  id: string;
  roomId: string;
  authUserId: string;
  displayName: string;
  seatNumber: number | null;
  joinedAt: string;
};

export type ThePackRound = {
  id: string;
  roomId: string;
  roundNumber: number;
  street: Street;
  communityCards: Card[];
  createdAt: string;
  endedAt: string | null;
};

export type ThePackChip = {
  id: string;
  roundId: string;
  chipNumber: number;
  holderRoomPlayerId: string | null;
  updatedAt: string;
  version: number;
};

// One street's archived chip arrangement -- permanent, unlike
// ThePackChip's live/mutable state. See the_pack_chip_history in the schema.
export type ThePackChipHistoryEntry = {
  id: string;
  roundId: string;
  street: Street;
  chipNumber: number;
  holderRoomPlayerId: string | null;
  capturedAt: string;
};

// Poker-chip colors, in street order -- not part of the "shelf" decorative
// palette on purpose, since these represent physical chip colors. Each bg is
// a solid (non-pastel) tone paired with whichever number color reads best
// against it (dark on white/yellow, white on orange/red) -- not the same
// ink color for every street, since that only holds up on the light ones.
export const STREET_CHIP_COLOR: Record<Street, { bg: string; border: string; text: string; label: string }> = {
  preflop: { bg: "bg-white", border: "border-stone-400", text: "text-stone-900", label: "White" },
  flop: { bg: "bg-yellow-400", border: "border-yellow-600", text: "text-stone-900", label: "Yellow" },
  turn: { bg: "bg-orange-700", border: "border-orange-900", text: "text-white", label: "Orange" },
  river: { bg: "bg-red-700", border: "border-red-900", text: "text-white", label: "Red" },
};

export type HandRanking = {
  roomPlayerId: string;
  displayName: string;
  rankPosition: number;
  label: string;
};

// Broadcast payloads exactly as the plpgsql functions in
// the-pack-schema.sql build them (snake_case, matching the wire format).
export type ThePackBroadcastEvent =
  | {
      type: "player_joined";
      payload: { room_player_id: string; display_name: string; seat_number: number };
    }
  | {
      type: "round_dealt";
      payload: {
        round_id: string;
        round_number: number;
        player_count: number;
        chip_numbers: number[];
      };
    }
  | {
      type: "street_revealed";
      payload: {
        round_id: string;
        street: Street;
        community_cards: Card[];
        // Deliberately no rankings here -- the_pack_rank_table masks every
        // row's hand-category label except the caller's own, which only
        // works per-request. A broadcast is one shared payload for every
        // recipient, so it can't carry a correctly-masked version of it;
        // each client calls the_pack_rank_table itself on this event.
      };
    }
  | {
      type: "chip_claimed";
      payload: {
        round_id: string;
        chip_number: number;
        holder_room_player_id: string;
        holder_display_name: string;
      };
    }
  | { type: "chip_released"; payload: { round_id: string; chip_number: number } }
  | {
      type: "chip_transferred";
      payload: {
        round_id: string;
        chip_number: number;
        from_room_player_id: string | null;
        to_room_player_id: string;
        to_display_name: string;
      };
    };

export function roomChannelTopic(roomId: string): string {
  return `the-pack-room-${roomId}`;
}

// Row <-> app type mapping. There's no generated Supabase Database type in
// this repo (every table is queried with loosely-typed `data`, see
// lib/boardGamesDatabase.ts's boardGameFromDatabase for the house
// convention), so each RPC/select response is validated through one of
// these rather than cast directly.

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function roomFromRow(row: unknown): ThePackRoom | null {
  if (!isObject(row) || typeof row.id !== "string" || typeof row.code !== "string") return null;
  return {
    id: row.id,
    code: row.code,
    hostAuthUserId: String(row.host_auth_user_id ?? ""),
    status: row.status === "round_active" ? "round_active" : "lobby",
    currentRoundId: typeof row.current_round_id === "string" ? row.current_round_id : null,
    maxPlayers: typeof row.max_players === "number" ? row.max_players : 8,
    createdAt: String(row.created_at ?? ""),
  };
}

export function roomPlayerFromRow(row: unknown): ThePackRoomPlayer | null {
  if (!isObject(row) || typeof row.id !== "string") return null;
  return {
    id: row.id,
    roomId: String(row.room_id ?? ""),
    authUserId: String(row.auth_user_id ?? ""),
    displayName: String(row.display_name ?? ""),
    seatNumber: typeof row.seat_number === "number" ? row.seat_number : null,
    joinedAt: String(row.joined_at ?? ""),
  };
}

export function roundFromRow(row: unknown): ThePackRound | null {
  if (!isObject(row) || typeof row.id !== "string") return null;
  const street = row.street;
  return {
    id: row.id,
    roomId: String(row.room_id ?? ""),
    roundNumber: typeof row.round_number === "number" ? row.round_number : 0,
    street: STREETS.includes(street as Street) ? (street as Street) : "preflop",
    communityCards: Array.isArray(row.community_cards) ? (row.community_cards as Card[]) : [],
    createdAt: String(row.created_at ?? ""),
    endedAt: typeof row.ended_at === "string" ? row.ended_at : null,
  };
}

export function chipFromRow(row: unknown): ThePackChip | null {
  if (!isObject(row) || typeof row.id !== "string") return null;
  return {
    id: row.id,
    roundId: String(row.round_id ?? ""),
    chipNumber: typeof row.chip_number === "number" ? row.chip_number : 0,
    holderRoomPlayerId: typeof row.holder_room_player_id === "string" ? row.holder_room_player_id : null,
    updatedAt: String(row.updated_at ?? ""),
    version: typeof row.version === "number" ? row.version : 0,
  };
}

export function chipHistoryEntryFromRow(row: unknown): ThePackChipHistoryEntry | null {
  if (!isObject(row) || typeof row.id !== "string") return null;
  const street = row.street;
  return {
    id: row.id,
    roundId: String(row.round_id ?? ""),
    street: STREETS.includes(street as Street) ? (street as Street) : "preflop",
    chipNumber: typeof row.chip_number === "number" ? row.chip_number : 0,
    holderRoomPlayerId: typeof row.holder_room_player_id === "string" ? row.holder_room_player_id : null,
    capturedAt: String(row.captured_at ?? ""),
  };
}

export function holeCardsFromRow(row: unknown): Card[] | null {
  if (!isObject(row) || !Array.isArray(row.cards)) return null;
  return row.cards as Card[];
}

export function handRankingFromRow(row: unknown): HandRanking | null {
  if (!isObject(row) || typeof row.room_player_id !== "string") return null;
  return {
    roomPlayerId: row.room_player_id,
    displayName: String(row.display_name ?? ""),
    rankPosition: typeof row.rank_position === "number" ? row.rank_position : 0,
    label: String(row.label ?? ""),
  };
}
