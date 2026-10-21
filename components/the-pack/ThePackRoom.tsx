"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import {
  chipFromRow,
  chipHistoryEntryFromRow,
  handRankingFromRow,
  holeCardsFromRow,
  roomChannelTopic,
  roomFromRow,
  roomPlayerFromRow,
  roundFromRow,
  type Card,
  type HandRanking,
  type RoomStatus,
  type ThePackBroadcastEvent,
  type ThePackChip,
  type ThePackChipHistoryEntry,
  type ThePackRoom as ThePackRoomRecord,
  type ThePackRoomPlayer,
  type ThePackRound,
} from "@/lib/thePack";
import { ensureSignedIn } from "./CreateOrJoinRoom";
import PlayerRoster from "./PlayerRoster";
import RoundControls from "./RoundControls";
import HoleCards from "./HoleCards";
import CommunityCards from "./CommunityCards";
import ChipBoard from "./ChipBoard";
import ChipHistory from "./ChipHistory";

type LoadState = "loading" | "needs-name" | "blocked" | "ready" | "not-found";

type EventPayload<T extends ThePackBroadcastEvent["type"]> = Extract<
  ThePackBroadcastEvent,
  { type: T }
>["payload"];

export default function ThePackRoom({ code }: { code: string }) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<ThePackRoomRecord | null>(null);
  const [myAuthUserId, setMyAuthUserId] = useState<string | null>(null);
  const [myRoomPlayerId, setMyRoomPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<ThePackRoomPlayer[]>([]);
  const [round, setRound] = useState<ThePackRound | null>(null);
  const [holeCards, setHoleCards] = useState<Card[] | null>(null);
  const [chips, setChips] = useState<ThePackChip[]>([]);
  const [chipHistory, setChipHistory] = useState<ThePackChipHistoryEntry[]>([]);
  const [rankings, setRankings] = useState<HandRanking[]>([]);
  const [onlineAuthUserIds, setOnlineAuthUserIds] = useState<Set<string>>(new Set());
  const [nameInput, setNameInput] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Always a fresh per-request RPC call, never trusted from a broadcast --
  // the_pack_rank_table masks every row's hand-category label except the
  // caller's own, which only holds up when each client fetches its own copy.
  const loadRankings = useCallback(async (roundId: string) => {
    const supabase = createClient();
    const { data: rankingRows } = await supabase.rpc("the_pack_rank_table", { p_round_id: roundId });
    setRankings(
      (Array.isArray(rankingRows) ? rankingRows : [])
        .map(handRankingFromRow)
        .filter((r): r is HandRanking => r !== null),
    );
  }, []);

  const loadChipHistory = useCallback(async (roundId: string) => {
    const supabase = createClient();
    const { data: historyRows } = await supabase
      .from("the_pack_chip_history")
      .select("*")
      .eq("round_id", roundId);
    setChipHistory(
      (historyRows ?? []).map(chipHistoryEntryFromRow).filter((h): h is ThePackChipHistoryEntry => h !== null),
    );
  }, []);

  // Resume-after-refresh and the post-join path both end up here: load every
  // piece of room state fresh rather than trusting anything seen before.
  const loadRoomState = useCallback(async (roomId: string, authUserId: string) => {
    const supabase = createClient();

    const { data: roomRow } = await supabase.from("the_pack_rooms").select("*").eq("id", roomId).single();
    const loadedRoom = roomFromRow(roomRow);
    if (loadedRoom) setRoom(loadedRoom);

    const { data: playerRows } = await supabase.from("the_pack_room_players").select("*").eq("room_id", roomId);
    const loadedPlayers = (playerRows ?? [])
      .map(roomPlayerFromRow)
      .filter((p): p is ThePackRoomPlayer => p !== null);
    setPlayers(loadedPlayers);
    setMyRoomPlayerId(loadedPlayers.find((p) => p.authUserId === authUserId)?.id ?? null);

    if (!loadedRoom?.currentRoundId) {
      setRound(null);
      setChips([]);
      setChipHistory([]);
      setHoleCards(null);
      setRankings([]);
      return;
    }

    const roundId = loadedRoom.currentRoundId;
    const { data: roundRow } = await supabase.from("the_pack_rounds").select("*").eq("id", roundId).single();
    const loadedRound = roundFromRow(roundRow);
    setRound(loadedRound);

    const { data: chipRows } = await supabase.from("the_pack_chips").select("*").eq("round_id", roundId);
    setChips((chipRows ?? []).map(chipFromRow).filter((c): c is ThePackChip => c !== null));
    await loadChipHistory(roundId);

    // RLS on the_pack_hole_cards means this can only ever return the
    // caller's own row -- never another player's.
    const { data: holeRow } = await supabase
      .from("the_pack_hole_cards")
      .select("cards")
      .eq("round_id", roundId)
      .maybeSingle();
    setHoleCards(holeCardsFromRow(holeRow));

    if (loadedRound && loadedRound.street !== "preflop") {
      await loadRankings(roundId);
    } else {
      setRankings([]);
    }
  }, [loadChipHistory, loadRankings]);

  // Initial load: resolve the anonymous session, look up the room by code,
  // and decide whether we're already seated, need a name prompt, or are
  // blocked from a round already in progress (v1 has no spectator mode).
  useEffect(() => {
    let isCurrent = true;

    async function init() {
      try {
        const supabase = await ensureSignedIn();
        const { data: userData } = await supabase.auth.getUser();
        const authUserId = userData.user?.id ?? null;
        if (!authUserId) throw new Error("Could not establish a session.");
        if (!isCurrent) return;
        setMyAuthUserId(authUserId);

        const { data: roomRow } = await supabase
          .from("the_pack_rooms")
          .select("*")
          .eq("code", code.toUpperCase())
          .maybeSingle();
        const loadedRoom = roomFromRow(roomRow);
        if (!isCurrent) return;
        if (!loadedRoom) {
          setLoadState("not-found");
          return;
        }
        setRoom(loadedRoom);

        const { data: playerRows } = await supabase
          .from("the_pack_room_players")
          .select("*")
          .eq("room_id", loadedRoom.id);
        const loadedPlayers = (playerRows ?? [])
          .map(roomPlayerFromRow)
          .filter((p): p is ThePackRoomPlayer => p !== null);
        if (!isCurrent) return;
        setPlayers(loadedPlayers);

        const alreadySeated = loadedPlayers.some((p) => p.authUserId === authUserId);
        if (alreadySeated) {
          await loadRoomState(loadedRoom.id, authUserId);
          if (!isCurrent) return;
          setLoadState("ready");
        } else if (loadedRoom.status === "lobby") {
          setLoadState("needs-name");
        } else {
          setLoadState("blocked");
        }
      } catch (err) {
        if (!isCurrent) return;
        setError(err instanceof Error ? err.message : "Could not load this room.");
        setLoadState("not-found");
      }
    }

    void init();
    return () => {
      isCurrent = false;
    };
  }, [code, loadRoomState]);

  // The private per-room channel. player_joined and round_dealt trigger a
  // full refetch (rare events, and round_dealt needs a fresh hole-cards
  // fetch anyway); chip and street events update local state directly from
  // the broadcast payload so chip moves feel instant.
  useEffect(() => {
    if (!room || !myAuthUserId) return;

    const supabase = createClient();
    const channel = supabase.channel(roomChannelTopic(room.id), { config: { private: true } });
    channelRef.current = channel;

    channel.on("broadcast", { event: "player_joined" }, () => {
      void loadRoomState(room.id, myAuthUserId);
    });

    channel.on("broadcast", { event: "round_dealt" }, () => {
      void loadRoomState(room.id, myAuthUserId);
    });

    channel.on("broadcast", { event: "street_revealed" }, (message: { payload: EventPayload<"street_revealed"> }) => {
      const { payload } = message;
      setRound((current) =>
        current ? { ...current, street: payload.street, communityCards: payload.community_cards } : current,
      );
      // Rankings and chip history both need a per-client/fresh fetch rather
      // than trusting the broadcast payload -- see loadRankings and
      // the_pack_rank_table's masking.
      void loadRankings(payload.round_id);
      void loadChipHistory(payload.round_id);
    });

    channel.on("broadcast", { event: "chip_claimed" }, (message: { payload: EventPayload<"chip_claimed"> }) => {
      const { payload } = message;
      setChips((current) =>
        current.map((chip) =>
          chip.chipNumber === payload.chip_number
            ? { ...chip, holderRoomPlayerId: payload.holder_room_player_id, version: chip.version + 1 }
            : chip,
        ),
      );
    });

    channel.on("broadcast", { event: "chip_released" }, (message: { payload: EventPayload<"chip_released"> }) => {
      const { payload } = message;
      setChips((current) =>
        current.map((chip) =>
          chip.chipNumber === payload.chip_number ? { ...chip, holderRoomPlayerId: null, version: chip.version + 1 } : chip,
        ),
      );
    });

    channel.on("broadcast", { event: "chip_transferred" }, (message: { payload: EventPayload<"chip_transferred"> }) => {
      const { payload } = message;
      setChips((current) =>
        current.map((chip) =>
          chip.chipNumber === payload.chip_number
            ? { ...chip, holderRoomPlayerId: payload.to_room_player_id, version: chip.version + 1 }
            : chip,
        ),
      );
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<{ auth_user_id: string }>();
      const ids = new Set<string>();
      for (const presences of Object.values(state)) {
        for (const presence of presences) ids.add(presence.auth_user_id);
      }
      setOnlineAuthUserIds(ids);
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        void channel.track({ auth_user_id: myAuthUserId });
      }
    });

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id, myAuthUserId, loadRoomState, loadChipHistory, loadRankings]);

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isJoining || !room || !myAuthUserId) return;
    setIsJoining(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase
        .rpc("the_pack_join_room", { p_code: room.code, p_display_name: nameInput })
        .single();
      if (rpcError) throw rpcError;

      await loadRoomState(room.id, myAuthUserId);
      setLoadState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join this room.");
    } finally {
      setIsJoining(false);
    }
  }

  const callRpc = useCallback(async (fn: string, args: Record<string, unknown>) => {
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc(fn, args);
    if (rpcError) throw rpcError;
  }, []);

  const handleDeal = useCallback(async () => {
    if (!room) return;
    await callRpc("the_pack_deal_round", { p_room_id: room.id });
  }, [room, callRpc]);

  const handleRevealNext = useCallback(async () => {
    if (!room) return;
    await callRpc("the_pack_reveal_next_street", { p_room_id: room.id });
  }, [room, callRpc]);

  const handleClaim = useCallback(
    async (chipNumber: number) => {
      if (!round) return;
      await callRpc("the_pack_claim_chip", { p_round_id: round.id, p_chip_number: chipNumber });
    },
    [round, callRpc],
  );

  const handleRelease = useCallback(
    async (chipNumber: number) => {
      if (!round) return;
      await callRpc("the_pack_release_chip", { p_round_id: round.id, p_chip_number: chipNumber });
    },
    [round, callRpc],
  );

  const handleTransfer = useCallback(
    async (chipNumber: number, toRoomPlayerId: string) => {
      if (!round) return;
      await callRpc("the_pack_transfer_chip", {
        p_round_id: round.id,
        p_chip_number: chipNumber,
        p_to_room_player_id: toRoomPlayerId,
      });
    },
    [round, callRpc],
  );

  if (loadState === "loading") {
    return <p className="mt-10 text-center text-sm text-cream/60">Loading…</p>;
  }

  if (loadState === "not-found") {
    return <p className="mt-10 text-center text-sm text-pinRed">{error ?? "No room found with that code."}</p>;
  }

  if (loadState === "blocked") {
    return (
      <p className="mt-10 text-center text-sm text-cream/70">
        This room already started a round — you can only join before dealing starts.
      </p>
    );
  }

  if (loadState === "needs-name") {
    return (
      <div className="mx-auto mt-10 max-w-sm">
        <p className="text-sm text-cream/70">Joining room {room?.code}</p>
        <form onSubmit={handleJoin} className="mt-4 space-y-3">
          <input
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            required
            maxLength={16}
            placeholder="Your name"
            className="min-h-11 w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 text-sm text-cream placeholder:text-cream/40"
          />
          <button
            type="submit"
            disabled={isJoining}
            className="min-h-11 w-full rounded-full bg-pinGold/90 px-6 py-3 font-mono text-xs uppercase tracking-widest text-wall transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isJoining ? "Joining…" : "Join"}
          </button>
          {error && (
            <p role="alert" className="text-xs text-pinRed">
              {error}
            </p>
          )}
        </form>
      </div>
    );
  }

  const isHost = myAuthUserId !== null && room?.hostAuthUserId === myAuthUserId;
  const roomStatus: RoomStatus = room?.status ?? "lobby";

  return (
    <div className="mx-auto mt-6 max-w-2xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-cream/60">Room {room?.code}</p>
        {room && (
          <RoundControls
            isHost={isHost}
            roomStatus={roomStatus}
            street={round?.street ?? null}
            onDeal={handleDeal}
            onRevealNext={handleRevealNext}
          />
        )}
      </div>

      {/* The shelf.* palette (ink/paper/forest/brass/...) used throughout
          this section is only legible on a light surface -- without this
          panel it sits directly on the page's dark wall-bg. */}
      <div className="space-y-6 rounded-2xl border-4 border-shelf-walnut bg-shelf-paper p-5 shadow-[0_18px_32px_-14px_rgba(0,0,0,0.65)] sm:p-7">
        <PlayerRoster
          players={players}
          onlineAuthUserIds={onlineAuthUserIds}
          rankings={rankings}
          hostAuthUserId={room?.hostAuthUserId ?? ""}
        />

        {round && (
          <>
            <HoleCards cards={holeCards} />
            <CommunityCards cards={round.communityCards} />
            {myRoomPlayerId && (
              <ChipBoard
                chips={chips}
                players={players}
                myRoomPlayerId={myRoomPlayerId}
                street={round.street}
                onClaim={handleClaim}
                onRelease={handleRelease}
                onTransfer={handleTransfer}
              />
            )}
            <ChipHistory history={chipHistory} players={players} />
          </>
        )}
      </div>
    </div>
  );
}
