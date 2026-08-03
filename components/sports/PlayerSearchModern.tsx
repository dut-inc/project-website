"use client";

import { useMemo, useState } from "react";
import type { PlayerArchetype } from "@/lib/archetypes";
import PlayerCardModern from "./PlayerCardModern";

const MAX_SUGGESTIONS = 6;

export default function PlayerSearchModern({ players }: { players: PlayerArchetype[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PlayerArchetype | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const seen = new Set<number>();
    const out: PlayerArchetype[] = [];

    for (const player of players) {
      if (!player.player_name.toLowerCase().includes(q)) continue;
      if (seen.has(player.player_id)) continue;
      seen.add(player.player_id);
      out.push(player);
      if (out.length === MAX_SUGGESTIONS) break;
    }

    return out;
  }, [players, query]);

  const showSuggestions = isOpen && !selected && suggestions.length > 0;
  const activeSuggestion =
    activeIndex >= 0 && activeIndex < suggestions.length ? suggestions[activeIndex] : undefined;

  function selectPlayer(player: PlayerArchetype) {
    setSelected(player);
    setQuery(player.player_name);
    setActiveIndex(-1);
    setIsOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (showSuggestions) {
        event.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
      }
      return;
    }

    if (!showSuggestions) {
      if (event.key === "ArrowDown" && suggestions.length > 0) {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === "Enter" && activeSuggestion) {
      event.preventDefault();
      selectPlayer(activeSuggestion);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-md">
        <label htmlFor="player-search" className="sr-only">
          Search players
        </label>
        <input
          id="player-search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected(null);
            setActiveIndex(-1);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0 && !selected) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search a player…"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-controls="player-suggestions"
          aria-expanded={showSuggestions}
          aria-activedescendant={activeSuggestion ? `player-option-${activeSuggestion.player_id}` : undefined}
          className="w-full rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:border-sports-accent focus:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-pinGold focus-visible:outline-offset-4"
        />
        {showSuggestions && (
          <div
            id="player-suggestions"
            role="listbox"
            aria-label="Player suggestions"
            className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#16171c] shadow-xl"
          >
            {suggestions.map((player, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={player.player_id}
                  id={`player-option-${player.player_id}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectPlayer(player)}
                  className={`flex min-h-11 w-full items-center justify-between px-5 py-3 text-left text-sm transition-colors ${
                    isActive ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  <span>{player.player_name}</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                    {player.archetype}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-10 w-full">
        {selected ? (
          <div className="flex justify-center">
            <PlayerCardModern key={selected.player_id} player={selected} />
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
