"use client";

import { useState } from "react";
import type { RoomStatus, Street } from "@/lib/thePack";

export type RoundControlsProps = {
  isHost: boolean;
  roomStatus: RoomStatus;
  street: Street | null;
  onDeal: () => Promise<void>;
  onRevealNext: () => Promise<void>;
};

const NEXT_STREET_LABEL: Record<Street, string> = {
  preflop: "Reveal the flop",
  flop: "Reveal the turn",
  turn: "Reveal the river",
  river: "",
};

// Host-only Deal/Reveal buttons. Visibility here is UX only -- the real
// boundary is the server-side host check inside each RPC, the same
// "client gating is UX only" pattern as DeveloperAccess.tsx.
export default function RoundControls({ isHost, roomStatus, street, onDeal, onRevealNext }: RoundControlsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isHost) return null;

  async function run(action: () => Promise<void>) {
    setIsSubmitting(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {roomStatus === "lobby" && (
        <button
          type="button"
          onClick={() => void run(onDeal)}
          disabled={isSubmitting}
          className="min-h-11 rounded-full bg-shelf-walnut px-6 py-3 font-mono text-xs uppercase tracking-widest text-shelf-paper transition-transform hover:-translate-y-0.5 hover:bg-shelf-wood disabled:cursor-not-allowed disabled:opacity-50"
        >
          Deal
        </button>
      )}
      {roomStatus === "round_active" && street !== null && street !== "river" && (
        <button
          type="button"
          onClick={() => void run(onRevealNext)}
          disabled={isSubmitting}
          className="min-h-11 rounded-full bg-shelf-walnut px-6 py-3 font-mono text-xs uppercase tracking-widest text-shelf-paper transition-transform hover:-translate-y-0.5 hover:bg-shelf-wood disabled:cursor-not-allowed disabled:opacity-50"
        >
          {NEXT_STREET_LABEL[street]}
        </button>
      )}
      {roomStatus === "round_active" && street === "river" && (
        <button
          type="button"
          onClick={() => void run(onDeal)}
          disabled={isSubmitting}
          className="min-h-11 rounded-full bg-shelf-walnut px-6 py-3 font-mono text-xs uppercase tracking-widest text-shelf-paper transition-transform hover:-translate-y-0.5 hover:bg-shelf-wood disabled:cursor-not-allowed disabled:opacity-50"
        >
          Deal next round
        </button>
      )}
      {error && (
        <p role="alert" className="text-xs text-pinRed">
          {error}
        </p>
      )}
    </div>
  );
}
