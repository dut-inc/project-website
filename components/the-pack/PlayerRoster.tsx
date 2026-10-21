import type { HandRanking, ThePackRoomPlayer } from "@/lib/thePack";

export type PlayerRosterProps = {
  players: ThePackRoomPlayer[];
  onlineAuthUserIds: Set<string>;
  rankings: HandRanking[];
  hostAuthUserId: string;
};

// Merges the durable seat roster with live Presence and the latest
// street_revealed ranking -- never cards.
export default function PlayerRoster({ players, onlineAuthUserIds, rankings, hostAuthUserId }: PlayerRosterProps) {
  const rankByPlayerId = new Map(rankings.map((r) => [r.roomPlayerId, r]));
  const sorted = [...players].sort((a, b) => (a.seatNumber ?? 0) - (b.seatNumber ?? 0));

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-shelf-ink/60">Table</p>
      <ul className="mt-2 space-y-1.5">
        {sorted.map((player) => {
          const ranking = rankByPlayerId.get(player.id);
          const isOnline = onlineAuthUserIds.has(player.authUserId);
          return (
            <li key={player.id} className="flex items-center justify-between gap-2 text-sm text-shelf-ink">
              <span className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${isOnline ? "bg-shelf-forest" : "bg-shelf-paperDark"}`}
                  aria-hidden
                />
                {player.displayName}
                {player.authUserId === hostAuthUserId && (
                  <span className="font-mono text-[9px] uppercase tracking-widest text-shelf-brass">Host</span>
                )}
              </span>
              {ranking && (
                <span className="font-mono text-[10px] uppercase tracking-widest text-shelf-ink/60">
                  #{ranking.rankPosition} · {ranking.label}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
