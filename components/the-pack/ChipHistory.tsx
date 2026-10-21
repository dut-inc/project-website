import { STREETS, STREET_CHIP_COLOR, type ThePackChipHistoryEntry, type ThePackRoomPlayer } from "@/lib/thePack";

export type ChipHistoryProps = {
  history: ThePackChipHistoryEntry[];
  players: ThePackRoomPlayer[];
};

// Shows what every player decided for each street that's already closed out
// (preflop/flop/turn, archived the moment the host reveals the next street --
// see the_pack_chip_history). Nothing to show until the first street closes.
export default function ChipHistory({ history, players }: ChipHistoryProps) {
  if (history.length === 0) return null;

  const nameFor = (roomPlayerId: string | null) =>
    roomPlayerId ? (players.find((p) => p.id === roomPlayerId)?.displayName ?? "someone") : null;

  const streetsWithHistory = STREETS.filter((street) => history.some((entry) => entry.street === street));

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-shelf-ink/60">Chip history</p>
      <div className="mt-2 space-y-3">
        {streetsWithHistory.map((street) => {
          const color = STREET_CHIP_COLOR[street];
          const entries = history
            .filter((entry) => entry.street === street)
            .sort((a, b) => a.chipNumber - b.chipNumber);

          return (
            <div key={street}>
              <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-shelf-ink/50">
                <span className={`h-2 w-2 rounded-full border ${color.bg} ${color.border}`} aria-hidden />
                {street}
              </span>
              <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                {entries.map((entry) => (
                  <li key={entry.id} className="text-xs text-shelf-ink/80">
                    <span className="font-display italic">{entry.chipNumber}</span>
                    {" → "}
                    {nameFor(entry.holderRoomPlayerId) ?? <span className="text-shelf-ink/40">open</span>}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
