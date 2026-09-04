"use client";

import { useId, useMemo, useRef, useState } from "react";

export type SelectablePlayer = {
  player_id: number;
  player_name: string;
  team: string;
  hand: string;
  /** Secondary stat line, e.g. "FF 56% · SL 30%" or "K% 28". */
  sub?: string;
};

const MAX_SUGGESTIONS = 6;

export default function PlayerSelect({
  placeholder,
  players,
  selected,
  onSelect,
}: {
  placeholder: string;
  players: SelectablePlayer[];
  selected: SelectablePlayer | null;
  onSelect: (player: SelectablePlayer | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const seen = new Set<number>();
    const out: SelectablePlayer[] = [];
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

  function selectPlayer(player: SelectablePlayer) {
    onSelect(player);
    setQuery(player.player_name);
    setActiveIndex(-1);
    setIsOpen(false);
  }

  function clear() {
    onSelect(null);
    setQuery("");
    setActiveIndex(-1);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (showSuggestions) {
        event.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
      } else if (selected) {
        clear();
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
      setActiveIndex((cur) => (cur + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((cur) => (cur <= 0 ? suggestions.length - 1 : cur - 1));
    } else if (event.key === "Enter" && activeSuggestion) {
      event.preventDefault();
      selectPlayer(activeSuggestion);
    }
  }

  const showClear = selected !== null || query.trim() !== "";

  return (
    <div className="w-full">
      <div className="relative">
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            onSelect(null);
            setActiveIndex(-1);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0 && !selected) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={listId}
          className={`w-full rounded-xl border border-white/15 bg-white/5 py-3 pl-4 font-mono text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-sports-accent focus:bg-white/10 ${
            showClear ? "pr-11" : "pr-4"
          }`}
        />
        {showClear && (
          <button
            type="button"
            aria-label="Clear selection"
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-white/40 transition-colors hover:text-white"
          >
            ✕
          </button>
        )}
        {showSuggestions && (
          <div
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#16171c] shadow-2xl"
          >
            {suggestions.map((player, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={player.player_id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectPlayer(player)}
                  className={`flex min-h-12 w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                    isActive ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  <span className="truncate text-sm">{player.player_name}</span>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-white/40">
                    {player.hand === "S" ? "S" : player.hand} · {player.team}
                    {player.sub ? ` · ${player.sub}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
