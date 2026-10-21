"use client";

import { useEffect, useRef, useState } from "react";
import { STREET_CHIP_COLOR, type Street, type ThePackChip, type ThePackRoomPlayer } from "@/lib/thePack";

export type ChipBoardProps = {
  chips: ThePackChip[];
  players: ThePackRoomPlayer[];
  myRoomPlayerId: string;
  street: Street;
  onClaim: (chipNumber: number) => Promise<void>;
  onRelease: (chipNumber: number) => Promise<void>;
  onTransfer: (chipNumber: number, toRoomPlayerId: string) => Promise<void>;
};

// The centerpiece interaction. Click semantics: unclaimed -> claim; held by
// me -> release; held by someone else -> transfer to me. Optimistic
// disabled-state only -- the actual board state always comes from the
// chip_claimed/chip_released/chip_transferred broadcasts (see ThePackRoom),
// so a lost race just snaps back on its own without any special handling
// here beyond showing the RPC's rejection message briefly.
export default function ChipBoard({
  chips,
  players,
  myRoomPlayerId,
  street,
  onClaim,
  onRelease,
  onTransfer,
}: ChipBoardProps) {
  const [pendingChip, setPendingChip] = useState<number | null>(null);
  const [errorChip, setErrorChip] = useState<{ chip: number; message: string } | null>(null);
  const [poppingChipIds, setPoppingChipIds] = useState<Set<string>>(new Set());
  const prevVersions = useRef<Map<string, number>>(new Map());

  // Whenever a chip's version changes (claimed/released/transferred, from
  // any player), briefly pulse it so the change is noticeable even when it
  // wasn't your own click.
  useEffect(() => {
    const changed: string[] = [];
    for (const chip of chips) {
      const prev = prevVersions.current.get(chip.id);
      if (prev !== undefined && prev !== chip.version) changed.push(chip.id);
      prevVersions.current.set(chip.id, chip.version);
    }
    if (changed.length === 0) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPoppingChipIds((current) => new Set([...current, ...changed]));
    const timeout = window.setTimeout(() => {
      setPoppingChipIds((current) => {
        const next = new Set(current);
        for (const id of changed) next.delete(id);
        return next;
      });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [chips]);

  function nameFor(roomPlayerId: string | null): string | null {
    if (!roomPlayerId) return null;
    return players.find((p) => p.id === roomPlayerId)?.displayName ?? "someone";
  }

  async function handleClick(chip: ThePackChip) {
    if (pendingChip !== null) return;
    setPendingChip(chip.chipNumber);
    setErrorChip(null);
    try {
      if (chip.holderRoomPlayerId === null) {
        await onClaim(chip.chipNumber);
      } else if (chip.holderRoomPlayerId === myRoomPlayerId) {
        await onRelease(chip.chipNumber);
      } else {
        await onTransfer(chip.chipNumber, myRoomPlayerId);
      }
    } catch (error) {
      setErrorChip({
        chip: chip.chipNumber,
        message: error instanceof Error ? error.message : "Someone beat you to it.",
      });
    } finally {
      setPendingChip(null);
    }
  }

  const sortedChips = [...chips].sort((a, b) => a.chipNumber - b.chipNumber);
  const streetColor = STREET_CHIP_COLOR[street];

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-shelf-ink/60">
        Chips <span className="text-shelf-ink/40">· {streetColor.label.toLowerCase()} round</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        {sortedChips.map((chip) => {
          const holderName = nameFor(chip.holderRoomPlayerId);
          const isMine = chip.holderRoomPlayerId === myRoomPlayerId;
          const isPending = pendingChip === chip.chipNumber;

          return (
            <div key={chip.id} className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => void handleClick(chip)}
                disabled={isPending}
                aria-label={
                  holderName
                    ? `Chip ${chip.chipNumber}, held by ${holderName}. ${isMine ? "Click to release." : "Click to take it."}`
                    : `Chip ${chip.chipNumber}, unclaimed. Click to claim.`
                }
                className={`flex h-14 w-14 items-center justify-center rounded-full border-2 font-display text-lg italic transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 ${streetColor.bg} ${streetColor.border} ${streetColor.text} ${
                  isMine
                    ? "ring-4 ring-shelf-forest"
                    : holderName
                      ? "ring-4 ring-shelf-brass"
                      : "ring-2 ring-shelf-paperDark/30"
                } ${poppingChipIds.has(chip.id) ? "animate-chip-claim-pop" : ""}`}
              >
                {chip.chipNumber}
              </button>
              <span className="max-w-[4.5rem] truncate text-center text-[10px] text-shelf-ink/60">
                {holderName ?? "open"}
              </span>
              {errorChip?.chip === chip.chipNumber && (
                <span role="alert" className="max-w-[4.5rem] text-center text-[9px] text-shelf-burgundy">
                  {errorChip.message}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
