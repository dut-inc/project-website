"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { BoardGameEntry, GameDetailsUpdate } from "@/lib/boardGames";

type GameDetailsPopupProps = {
  game: BoardGameEntry;
  onClose: () => void;
  onSave: (updates: GameDetailsUpdate) => void;
  onDelete: () => void;
};

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
  onSave,
  onDelete,
}: GameDetailsPopupProps) {
  const [isEditing, setIsEditing] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [name, setName] = useState(game.name);
  const [description, setDescription] = useState(game.description);
  const [details, setDetails] = useState({
    houseRules: game.houseRules,
    fullRules: game.fullRules,
    quickNotes: game.quickNotes,
  });

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, input, textarea, [href], [tabindex]:not([tabindex="-1"])',
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

  function save() {
    onSave({
      name: name.trim() || game.name,
      description: description.trim() || game.description,
      ...details,
    });
    setIsEditing(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-shelf-walnut/80 p-4 backdrop-blur-[2px]"
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
        className="paper-torn max-h-[min(42rem,calc(100vh-2rem))] w-full max-w-2xl overflow-y-auto bg-shelf-paper p-6 text-shelf-ink shadow-[0_24px_70px_-18px_rgba(38,24,15,0.75)] sm:p-8"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-shelf-ink/80">
              game file / {game.tier}
            </p>
            <h2 id={`game-details-title-${game.id}`} className="mt-2 font-display text-3xl italic">
              {isEditing ? "Edit game" : game.name}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close game details"
            className="min-h-10 min-w-10 rounded-full border border-shelf-paperDark/60 font-mono text-lg text-shelf-ink/80 transition-colors hover:border-shelf-brass hover:text-shelf-ink"
          >
            ×
          </button>
        </div>

        {isEditing ? (
          <div className="mt-6 space-y-5">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-shelf-ink/80" htmlFor={`popup-name-${game.id}`}>
                Game name
              </label>
              <input
                id={`popup-name-${game.id}`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-lg border border-shelf-paperDark/60 bg-white/35 px-3 py-2.5 text-sm text-shelf-ink"
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
                rows={3}
                className="mt-2 w-full resize-y rounded-lg border border-shelf-paperDark/60 bg-white/35 px-3 py-2.5 text-sm leading-relaxed text-shelf-ink"
              />
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
                  className="mt-2 w-full resize-y rounded-lg border border-shelf-paperDark/60 bg-white/35 px-3 py-2.5 text-sm leading-relaxed text-shelf-ink placeholder:text-shelf-ink/70"
                />
              </div>
            ))}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={save} className="min-h-11 rounded-full bg-shelf-walnut px-5 font-mono text-[11px] uppercase tracking-widest text-shelf-paper transition-colors hover:bg-shelf-wood">
                Save changes
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="min-h-11 rounded-full border border-shelf-paperDark/60 px-5 font-mono text-[11px] uppercase tracking-widest text-shelf-ink/80 transition-colors hover:border-shelf-brass hover:text-shelf-ink">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-xl bg-shelf-paperDark/20 p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-shelf-ink/80">your take</p>
              <p className="mt-2 text-base leading-relaxed text-shelf-ink/85">{game.description}</p>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-shelf-paperDark/45 bg-shelf-paperDark/15 p-3">
                <dt className="font-mono text-[10px] uppercase tracking-wider text-shelf-ink/80">Current tier</dt>
                <dd className="mt-1 font-display text-xl italic text-shelf-ink">{game.tier}</dd>
              </div>
              <div className="rounded-lg border border-shelf-paperDark/45 bg-shelf-paperDark/15 p-3">
                <dt className="font-mono text-[10px] uppercase tracking-wider text-shelf-ink/80">Status</dt>
                <dd className="mt-1 font-display text-xl italic text-shelf-ink">{game.tier === "Unranked" ? "Deciding" : "Ranked"}</dd>
              </div>
            </dl>
            <div className="mt-6 space-y-3">
              {detailFields.map((field) => (
                <section key={field.key} className="rounded-xl border border-shelf-paperDark/45 bg-shelf-paperDark/15 p-4">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-shelf-ink/80">{field.label}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-shelf-ink/80">
                    {game[field.key] || "Nothing added yet."}
                  </p>
                </section>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={() => setIsEditing(true)} className="min-h-11 rounded-full bg-shelf-walnut px-5 font-mono text-[11px] uppercase tracking-widest text-shelf-paper transition-colors hover:bg-shelf-wood">
                Edit game
              </button>
              <button type="button" onClick={onDelete} className="min-h-11 rounded-full px-3 font-mono text-[11px] uppercase tracking-widest text-shelf-burgundy transition-colors hover:bg-shelf-burgundy/10">
                Delete game
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
