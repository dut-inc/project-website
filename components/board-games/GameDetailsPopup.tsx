"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { GAME_TIERS, GAME_TYPES, GAME_TYPE_SUITS, TIER_DETAILS, type BoardGameEntry, type CardSuit, type GameDetailsUpdate, type GameTier, type GameType } from "@/lib/boardGames";
import WinTracker from "./WinTracker";

type GameDetailsPopupProps = {
  game: BoardGameEntry;
  onClose: () => void;
  canEdit: boolean;
  onSave: (updates: GameDetailsUpdate) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
};

const suitGlyph: Record<CardSuit, string> = {
  diamond: "♦",
  club: "♣",
  heart: "♥",
  spade: "♠",
};

const redSuits = new Set<CardSuit>(["diamond", "heart"]);

const detailFields = [
  {
    key: "houseRules",
    label: "House rules",
    hint: "Your group's local additions, exceptions, or table agreements.",
    placeholder: "What do we do differently at our table?",
  },
  {
    key: "fullRules",
    label: "Full rules",
    hint: "The longer setup, turn sequence, scoring, or reference notes.",
    placeholder: "Write the full rules reference here...",
  },
  {
    key: "quickNotes",
    label: "Quick refresher notes",
    hint: "The short version to read before the next game night.",
    placeholder: "What should everyone remember before we start?",
  },
] as const;

export default function GameDetailsPopup({
  game,
  onClose,
  canEdit,
  onSave,
  onDelete,
}: GameDetailsPopupProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [name, setName] = useState(game.name);
  const [description, setDescription] = useState(game.description);
  const [tier, setTier] = useState<GameTier>(game.tier);
  const [gameType, setGameType] = useState<GameType>(game.gameType);
  const [details, setDetails] = useState({
    houseRules: game.houseRules,
    fullRules: game.fullRules,
    quickNotes: game.quickNotes,
  });
  const cardSuit = GAME_TYPE_SUITS[game.gameType];
  const cardGlyph = suitGlyph[cardSuit];
  const cardSuitColor = redSuits.has(cardSuit) ? "#9f302f" : "#29201c";

  useEffect(() => {
    // Portal content must wait until the browser document is available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) closeButtonRef.current?.focus();
  }, [isMounted]);

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, input, textarea, select, [href], [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function updateDetail(key: (typeof detailFields)[number]["key"], value: string) {
    setDetails((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setIsSaving(true);
    try {
      await onSave({
        name: name.trim() || game.name,
        description: description.trim() || game.description,
        tier,
        gameType,
        ...details,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function remove() {
    setIsSaving(true);
    try {
      await onDelete();
    } finally {
      setIsSaving(false);
    }
  }

  const popupContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-shelf-walnut/65 p-4 backdrop-blur-md"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`game-details-title-${game.id}`}
        onKeyDown={handleDialogKeyDown}
        className="relative max-h-[min(44rem,calc(100vh-2rem))] w-full max-w-2xl overflow-y-auto rounded-[1.15rem] border-2 border-[#8d765a]/75 bg-[#f4ead6] p-6 text-[#29201c] shadow-[0_24px_70px_-18px_rgba(38,24,15,0.75),inset_0_0_0_1px_rgba(255,255,255,0.78)] sm:p-8"
      >
        <span className="pointer-events-none absolute left-4 top-4 font-serif text-2xl leading-none" style={{ color: cardSuitColor }} aria-hidden>{cardGlyph}</span>
        <div className="relative z-10 flex items-center justify-between gap-5">
          <div>
            <h2 id={`game-details-title-${game.id}`} className="pt-4 font-display text-3xl italic">
              {isEditing ? "Edit game" : game.name}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close game details"
            className="min-h-10 min-w-10 rounded-full border border-[#8d765a]/65 font-mono text-lg text-[#5f5142] transition-colors hover:border-[#c9a227] hover:bg-[#c9a227]/10 hover:text-[#29201c]"
          >
            ×
          </button>
        </div>

        {isEditing && canEdit ? (
          <div className="relative z-10 mt-7 space-y-5">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-shelf-ink/80" htmlFor={`popup-name-${game.id}`}>
                Game name
              </label>
              <input
                id={`popup-name-${game.id}`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[#8d765a]/60 bg-white/45 px-3 py-2.5 text-sm text-[#29201c] outline-none transition-shadow focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-shelf-ink/80" htmlFor={`popup-description-${game.id}`}>
                One-line take
              </label>
              <textarea
                id={`popup-description-${game.id}`}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={6}
                className="mt-2 min-h-40 w-full resize-y rounded-lg border border-[#8d765a]/60 bg-white/45 px-3 py-2.5 text-sm leading-relaxed text-[#29201c] outline-none transition-shadow focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-offset-0 focus-visible:outline-[#c9a227]"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-shelf-ink/80" htmlFor={`popup-game-type-${game.id}`}>
                Game type
              </label>
              <select
                id={`popup-game-type-${game.id}`}
                value={gameType}
                onChange={(event) => setGameType(event.target.value as GameType)}
                className="mt-2 w-full rounded-lg border border-[#8d765a]/60 bg-white/45 px-3 py-2.5 text-sm text-[#29201c] outline-none transition-shadow focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25"
              >
                {GAME_TYPES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-shelf-ink/80" htmlFor={`popup-tier-${game.id}`}>
                Tier
              </label>
              <select
                id={`popup-tier-${game.id}`}
                value={tier}
                onChange={(event) => setTier(event.target.value as GameTier)}
                className="mt-2 w-full rounded-lg border border-[#8d765a]/60 bg-white/45 px-3 py-2.5 text-sm text-[#29201c] outline-none transition-shadow focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25"
              >
                {GAME_TIERS.map((option) => (
                  <option key={option} value={option}>
                    {TIER_DETAILS[option].label}
                  </option>
                ))}
              </select>
            </div>
            {detailFields.map((field) => (
              <div key={field.key}>
                <label className="font-mono text-[10px] uppercase tracking-wider text-shelf-ink/80" htmlFor={`popup-${field.key}-${game.id}`}>
                  {field.label}
                </label>
                <p className="mt-1 text-xs italic text-shelf-ink/80">{field.hint}</p>
                <textarea
                  id={`popup-${field.key}-${game.id}`}
                  value={details[field.key]}
                  onChange={(event) => updateDetail(field.key, event.target.value)}
                  rows={field.key === "fullRules" ? 6 : 4}
                  placeholder={field.placeholder}
                  className="mt-2 w-full resize-y rounded-lg border border-[#8d765a]/60 bg-white/45 px-3 py-2.5 text-sm leading-relaxed text-[#29201c] placeholder:text-[#5f5142]/70 outline-none transition-shadow focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25"
                />
              </div>
            ))}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => void save()} disabled={isSaving} className="min-h-11 rounded-full bg-shelf-walnut px-6 py-3 font-mono text-xs uppercase tracking-widest text-shelf-paper transition-colors hover:bg-shelf-wood disabled:cursor-wait disabled:opacity-60">
                {isSaving ? "Saving…" : "Save changes"}
              </button>
              <button type="button" onClick={() => setIsEditing(false)} disabled={isSaving} className="min-h-11 rounded-full border border-shelf-paperDark/60 px-6 py-3 font-mono text-xs uppercase tracking-widest text-shelf-ink/80 transition-colors hover:border-shelf-brass hover:text-shelf-ink disabled:opacity-60">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative z-10 mt-5 rounded-xl border border-[#8d765a]/55 bg-white/30 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)]"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5f5142]">our take</p>
              <p className="mt-2 text-base leading-relaxed text-[#29201c]">{game.description || "No description yet."}</p>
            </div>
            <dl className="relative z-10 mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[#8d765a]/55 bg-[#d9c7a8]/25 p-3">
                <dt className="font-mono text-[10px] uppercase tracking-wider text-[#5f5142]">Game type</dt>
                <dd className="mt-1 font-display text-xl italic text-[#29201c]">{game.gameType}</dd>
              </div>
              <div className="rounded-lg border border-[#8d765a]/55 bg-[#d9c7a8]/25 p-3">
                <dt className="font-mono text-[10px] uppercase tracking-wider text-[#5f5142]">Tier</dt>
                <dd className="mt-1 font-display text-xl italic text-[#29201c]">{TIER_DETAILS[game.tier].label}</dd>
              </div>
            </dl>
            <div className="relative z-10 mt-6 space-y-3">
              {detailFields.map((field) => (
                <section key={field.key} className="rounded-xl border border-[#8d765a]/50 bg-white/25 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#5f5142]">{field.label}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#5f5142]">
                    {game[field.key] || "Nothing added yet."}
                  </p>
                </section>
              ))}
            </div>
            {canEdit ? (
              <div className="relative z-10 mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#8d765a]/45 pt-5">
                <button type="button" onClick={() => setIsEditing(true)} className="min-h-11 rounded-full bg-shelf-walnut px-6 py-3 font-mono text-xs uppercase tracking-widest text-shelf-paper transition-colors hover:bg-shelf-wood">
                  Edit game
                </button>
                <button type="button" onClick={() => void remove()} disabled={isSaving} className="min-h-11 rounded-full px-6 py-3 font-mono text-xs uppercase tracking-widest text-shelf-burgundy transition-colors hover:bg-shelf-burgundy/10 disabled:opacity-60">
                  {isSaving ? "Working…" : "Delete game"}
                </button>
              </div>
            ) : null}
          </>
        )}

        <WinTracker gameId={game.id} gameName={game.name} isEditable={canEdit} />
        <div className="pointer-events-none -mr-2 -mb-2 mt-2 flex justify-end font-serif text-2xl leading-none" style={{ color: cardSuitColor }} aria-hidden>
          <span className="rotate-180">{cardGlyph}</span>
        </div>
      </section>
    </div>
  );

  if (!isMounted || typeof document === "undefined") return null;
  return createPortal(popupContent, document.body);
}
