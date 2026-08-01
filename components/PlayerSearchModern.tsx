"use client";

import { useMemo, useState } from "react";
import type { PlayerArchetype } from "@/lib/archetypes";
import PlayerCardModern from "./PlayerCardModern";

export default function PlayerSearchModern({ players }: { players: PlayerArchetype[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PlayerArchetype | null>(null);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return players.filter((p) => p.player_name.toLowerCase().includes(q)).slice(0, 6);
  }, [players, query]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-md">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
          placeholder="Search a player…"
          className="w-full rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#FF7A45]"
        />
        {suggestions.length > 0 && !selected && (
          <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#16171c] shadow-xl">
            {suggestions.map((p) => (
              <button
                key={p.player_id}
                onClick={() => {
                  setSelected(p);
                  setQuery(p.player_name);
                }}
                className="flex w-full items-center justify-between px-5 py-3 text-left text-sm text-white/80 transition-colors hover:bg-white/10"
              >
                <span>{p.player_name}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                  {p.archetype}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 w-full">
        {selected ? (
          <div className="flex justify-center">
            <PlayerCardModern player={selected} />
          </div>
        ) : (
          <p className="text-center font-mono text-xs uppercase tracking-widest text-white/30">
            Type a name above to pull up a profile
          </p>
        )}
      </div>
    </div>
  );
}
