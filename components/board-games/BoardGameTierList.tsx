"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GAME_TIERS,
  STARTER_GAMES,
  TIER_DETAILS,
  type BoardGameEntry,
  type GameTier,
} from "@/lib/boardGames";

const STORAGE_KEY = "the-board:board-game-tiers";
const NOTES_KEY = "the-board:board-game-notes";

function makeId() {
  return `game-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isGameTier(value: unknown): value is GameTier {
  return typeof value === "string" && GAME_TIERS.includes(value as GameTier);
}

function readSavedGames(value: string | null): BoardGameEntry[] | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;

    const validGames = parsed.filter(
      (game): game is BoardGameEntry =>
        typeof game === "object" &&
        game !== null &&
        typeof game.id === "string" &&
        typeof game.name === "string" &&
        typeof game.description === "string" &&
        isGameTier(game.tier),
    );

    return validGames.length === parsed.length ? validGames : null;
  } catch {
    return null;
  }
}

export default function BoardGameTierList() {
  const [games, setGames] = useState<BoardGameEntry[]>(STARTER_GAMES);
  const [notes, setNotes] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newGameName, setNewGameName] = useState("");
  const [newGameDescription, setNewGameDescription] = useState("");

  // Hydrate browser-only preferences after the server render.
  useEffect(() => {
    try {
      const savedGames = readSavedGames(window.localStorage.getItem(STORAGE_KEY));
      const savedNotes = window.localStorage.getItem(NOTES_KEY);
      if (savedGames) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setGames(savedGames);
      }
      if (savedNotes) {
        setNotes(savedNotes);
      }
    } catch {
      // Keep the starter list if storage is unavailable or contains bad data.
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    } catch {
      // Storage can be unavailable in private browsing or when full.
    }
  }, [games, isReady]);

  useEffect(() => {
    if (!isReady) return;
    try {
      window.localStorage.setItem(NOTES_KEY, notes);
    } catch {
      // Storage can be unavailable in private browsing or when full.
    }
  }, [notes, isReady]);

  const rankedCount = useMemo(
    () => games.filter((game) => game.tier !== "Unranked").length,
    [games],
  );

  function updateGame(id: string, updates: Partial<BoardGameEntry>) {
    setGames((current) =>
      current.map((game) => (game.id === id ? { ...game, ...updates } : game)),
    );
  }

  function addGame(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newGameName.trim();
    if (!name) return;

    setGames((current) => [
      ...current,
      {
        id: makeId(),
        name,
        description: newGameDescription.trim() || "Add a memorable detail later.",
        tier: "Unranked",
      },
    ]);
    setNewGameName("");
    setNewGameDescription("");
  }

  function removeGame(id: string) {
    setGames((current) => current.filter((game) => game.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function resetBoard() {
    if (!window.confirm("Reset the tier list to the starter games?")) return;
    setGames(STARTER_GAMES);
    setNotes("");
    setEditingId(null);
  }

  return (
    <div className="mx-auto mt-10 max-w-6xl space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)] sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-pinGold">
              quick start / 01
            </p>
            <h2 className="mt-2 font-display text-3xl italic text-cream">Make your case.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream/70">
              A shared ranking for the games on the shelf. Everything saves in this browser, so
              rearrange freely and leave the next player a note.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowGuide((open) => !open)}
            aria-expanded={showGuide}
            className="min-h-11 shrink-0 rounded-full border border-pinGold/50 px-4 font-mono text-[11px] uppercase tracking-widest text-pinGold transition-colors hover:bg-pinGold/10"
          >
            {showGuide ? "Hide guide" : "Show guide"}
          </button>
        </div>

        {showGuide && (
          <ol className="mt-6 grid gap-3 border-t border-white/10 pt-5 text-sm text-cream/75 sm:grid-cols-3">
            <li className="flex gap-3">
              <span className="font-mono text-pinGold">01</span>
              <span><strong className="font-medium text-cream">Add a game</strong> below, or start with the examples.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-pinGold">02</span>
              <span><strong className="font-medium text-cream">Edit the card</strong> to capture your very specific opinion.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-pinGold">03</span>
              <span><strong className="font-medium text-cream">Pick a tier</strong> from the dropdown. Your changes save automatically.</span>
            </li>
          </ol>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <section aria-labelledby="tier-list-heading" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cream/45">
                {rankedCount} ranked / {games.length} total
              </p>
              <h2 id="tier-list-heading" className="mt-1 font-display text-3xl italic text-cream">
                The shelf, sorted
              </h2>
            </div>
            <button
              type="button"
              onClick={resetBoard}
              className="min-h-11 rounded-full px-3 font-mono text-[10px] uppercase tracking-widest text-cream/45 transition-colors hover:text-pinGold"
            >
              Reset list
            </button>
          </div>

          <div className="space-y-3">
            {GAME_TIERS.map((tier) => {
              const detail = TIER_DETAILS[tier];
              const tierGames = games.filter((game) => game.tier === tier);
              return (
                <div key={tier} className="overflow-hidden rounded-xl border border-black/20 bg-black/20 shadow-inner">
                  <div className="flex min-h-16 items-center gap-3 p-3 sm:p-4" style={{ borderLeft: `5px solid ${detail.color}` }}>
                    <div className="w-20 shrink-0 sm:w-24">
                      <span className="block font-display text-2xl italic text-cream">{tier}</span>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-cream/45">{detail.hint}</span>
                    </div>
                    <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {tierGames.map((game) => (
                        <GameCard
                          key={game.id}
                          game={game}
                          isEditing={editingId === game.id}
                          onEdit={() => setEditingId(game.id)}
                          onCancel={() => setEditingId(null)}
                          onSave={(updates) => {
                            updateGame(game.id, updates);
                            setEditingId(null);
                          }}
                          onRemove={() => removeGame(game.id)}
                          onTierChange={(nextTier) => updateGame(game.id, { tier: nextTier })}
                        />
                      ))}
                      {tierGames.length === 0 && (
                        <p className="col-span-full py-3 text-xs italic text-cream/35">
                          Nothing here yet — move a card in.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="paper-torn bg-cream p-5 text-ink shadow-[0_14px_28px_-8px_rgba(0,0,0,0.45)]">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink2">new entry</p>
            <h2 className="mt-1 font-display text-2xl italic">Put one on the table</h2>
            <form onSubmit={addGame} className="mt-4 space-y-3">
              <label className="block font-mono text-[10px] uppercase tracking-wider text-ink2" htmlFor="new-game-name">
                Game name
              </label>
              <input
                id="new-game-name"
                value={newGameName}
                onChange={(event) => setNewGameName(event.target.value)}
                placeholder="e.g. Cascadia"
                className="w-full rounded-lg border border-ink/20 bg-white/40 px-3 py-2.5 text-sm text-ink placeholder:text-ink2/60"
              />
              <label className="block font-mono text-[10px] uppercase tracking-wider text-ink2" htmlFor="new-game-description">
                One-line take <span className="normal-case tracking-normal opacity-60">(optional)</span>
              </label>
              <textarea
                id="new-game-description"
                value={newGameDescription}
                onChange={(event) => setNewGameDescription(event.target.value)}
                rows={3}
                placeholder="Why does it belong here?"
                className="w-full resize-y rounded-lg border border-ink/20 bg-white/40 px-3 py-2.5 text-sm text-ink placeholder:text-ink2/60"
              />
              <button type="submit" className="min-h-11 w-full rounded-full bg-pinTeal px-4 font-mono text-[11px] uppercase tracking-widest text-cream transition-transform hover:-translate-y-0.5 hover:bg-[#3A9284]">
                Add unranked game
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-pinGold/25 bg-pinGold/[0.08] p-5">
            <label htmlFor="board-game-notes" className="font-mono text-[10px] uppercase tracking-widest text-pinGold">
              group notes
            </label>
            <textarea
              id="board-game-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={7}
              placeholder="Next game night... house rules... controversial opinions..."
              className="mt-3 w-full resize-y rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm leading-relaxed text-cream placeholder:text-cream/35"
            />
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-cream/40">saved locally</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function GameCard({
  game,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onRemove,
  onTierChange,
}: {
  game: BoardGameEntry;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (updates: Partial<BoardGameEntry>) => void;
  onRemove: () => void;
  onTierChange: (tier: GameTier) => void;
}) {
  const [name, setName] = useState(game.name);
  const [description, setDescription] = useState(game.description);

  // Keep the edit form aligned when the parent resets or updates this entry.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(game.name);
    setDescription(game.description);
  }, [game.name, game.description]);

  if (isEditing) {
    return (
      <div className="rounded-lg border border-pinGold/50 bg-cream p-3 text-ink shadow-lg">
        <label className="sr-only" htmlFor={`edit-name-${game.id}`}>Game name</label>
        <input
          id={`edit-name-${game.id}`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded border border-ink/20 bg-white/50 px-2 py-1.5 font-medium"
        />
        <label className="sr-only" htmlFor={`edit-description-${game.id}`}>Game description</label>
        <textarea
          id={`edit-description-${game.id}`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          className="mt-2 w-full resize-y rounded border border-ink/20 bg-white/50 px-2 py-1.5 text-xs"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={() => onSave({ name: name.trim() || game.name, description: description.trim() || game.description })} className="min-h-9 rounded-full bg-pinTeal px-3 font-mono text-[10px] uppercase tracking-wider text-cream">Save</button>
          <button type="button" onClick={onCancel} className="min-h-9 rounded-full border border-ink/20 px-3 font-mono text-[10px] uppercase tracking-wider text-ink2">Cancel</button>
          <button type="button" onClick={onRemove} className="min-h-9 rounded-full px-2 font-mono text-[10px] uppercase tracking-wider text-pinRed">Delete</button>
        </div>
      </div>
    );
  }

  return (
    <article className="group relative rounded-lg border border-white/10 bg-white/[0.07] p-3 transition-colors hover:border-white/25">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 truncate font-body text-sm font-semibold text-cream" title={game.name}>{game.name}</h3>
        <button type="button" onClick={onEdit} aria-label={`Edit ${game.name}`} className="min-h-9 shrink-0 rounded px-2 font-mono text-[10px] uppercase tracking-wider text-cream/45 opacity-100 transition-colors hover:text-pinGold sm:opacity-0 sm:group-hover:opacity-100">Edit</button>
      </div>
      <p className="mt-1 min-h-10 text-xs leading-relaxed text-cream/60">{game.description}</p>
      <div className="mt-3 flex items-center gap-2">
        <label htmlFor={`tier-${game.id}`} className="sr-only">Tier for {game.name}</label>
        <select
          id={`tier-${game.id}`}
          value={game.tier}
          onChange={(event) => onTierChange(event.target.value as GameTier)}
          className="min-h-9 min-w-0 flex-1 rounded border border-white/15 bg-black/20 px-2 text-[11px] text-cream"
        >
          {GAME_TIERS.map((tier) => <option key={tier} value={tier} className="bg-wall text-cream">{TIER_DETAILS[tier].label}</option>)}
        </select>
        <span className="font-mono text-[9px] uppercase tracking-wider text-cream/35">edit</span>
      </div>
    </article>
  );
}
