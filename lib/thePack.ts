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
        rankings: {
          room_player_id: string;
          display_name: string;
          rank_position: number;
          label: string;
        }[];
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
