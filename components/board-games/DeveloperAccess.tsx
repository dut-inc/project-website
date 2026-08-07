"use client";

import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { createPortal } from "react-dom";

type AccessStatus = "checking" | "locked" | "unlocked" | "unconfigured";

type DeveloperAccessProps = {
  caseNumber: string;
  isUnlocked: boolean;
  isOpen: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onUnlocked: () => void;
  onLocked: () => void;
};

type AccessResponse = {
  configured?: boolean;
  unlocked?: boolean;
  error?: string;
};

export default function DeveloperAccess({
  caseNumber,
  isUnlocked,
  isOpen,
  triggerRef,
  onOpenChange,
  onUnlocked,
  onLocked,
}: DeveloperAccessProps) {
  const [status, setStatus] = useState<AccessStatus>("checking");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    let isCurrent = true;

    async function checkAccess() {
      try {
        const response = await fetch("/api/board-games/access", { cache: "no-store" });
        const result = (await response.json()) as AccessResponse;
        if (!isCurrent) return;

        if (!result.configured) {
          setStatus("unconfigured");
          onLocked();
          return;
        }

        if (result.unlocked) {
          setStatus("unlocked");
          onUnlocked();
        } else {
          setStatus("locked");
          onLocked();
        }
      } catch {
        if (isCurrent) {
          setStatus("locked");
          onLocked();
          setError("The developer access check could not be reached.");
        }
      }
    }

    void checkAccess();
    return () => {
      isCurrent = false;
    };
  }, [onLocked, onUnlocked]);

  useEffect(() => {
    if (!isOpen) {
      if (wasOpenRef.current) triggerRef.current?.focus();
      wasOpenRef.current = false;
      return;
    }

    wasOpenRef.current = true;
    const focusInput = window.requestAnimationFrame(() => inputRef.current?.focus());
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }
    function trapFocus(event: KeyboardEvent) {
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, input, [href], [tabindex]:not([tabindex="-1"])',
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

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("keydown", trapFocus);
    return () => {
      window.cancelAnimationFrame(focusInput);
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("keydown", trapFocus);
    };
  }, [isOpen, status, onOpenChange, triggerRef]);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passcode.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/board-games/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const result = (await response.json()) as AccessResponse;

      if (!response.ok || !result.unlocked) {
        setError(result.error ?? "That passcode does not match.");
        return;
      }

      setPasscode("");
      setStatus("unlocked");
      onUnlocked();
      onOpenChange(false);
    } catch {
      setError("The developer access check could not be reached.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function lock() {
    setError(null);
    try {
      await fetch("/api/board-games/access", { method: "DELETE" });
    } catch {
      setError("The developer access lock could not be reached; controls were locked locally.");
    } finally {
      setStatus("locked");
      onLocked();
    }
  }

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex min-h-screen w-screen items-center justify-center bg-shelf-walnut/80 p-4 backdrop-blur-[2px] animate-backdrop-in"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="developer-access-title"
        className="paper-torn w-full max-w-md bg-shelf-paper p-6 text-shelf-ink shadow-[0_24px_70px_-18px_rgba(38,24,15,0.75)] animate-modal-pop sm:p-8"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-shelf-ink/70">
              Case №{caseNumber} / restricted access
            </p>
            <h2 id="developer-access-title" className="mt-2 font-display text-3xl italic">
              Developer controls
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close developer access"
            className="min-h-10 min-w-10 rounded-full border border-shelf-paperDark/60 font-mono text-lg text-shelf-ink/80 transition-colors hover:border-shelf-brass hover:text-shelf-ink"
          >
            ×
          </button>
        </div>

        {status === "checking" && (
          <p className="mt-6 text-sm text-shelf-ink/75">Checking developer access…</p>
        )}

        {status === "unconfigured" && (
          <p className="mt-6 rounded-lg border border-shelf-paperDark/60 bg-shelf-paperDark/20 px-4 py-3 text-sm leading-relaxed text-shelf-ink/80">
            Set <code className="font-mono text-shelf-walnut">BOARD_GAMES_PASSCODE</code> on the server before unlocking this list.
          </p>
        )}

        {status === "locked" && (
          <>
            <p className="mt-5 text-sm leading-relaxed text-shelf-ink/80">
              Enter the developer passcode to enable adding, editing, deleting, and tier movement.
            </p>
            <form onSubmit={unlock} className="mt-5 space-y-3">
              <label className="font-mono text-[10px] uppercase tracking-wider text-shelf-ink/80" htmlFor="board-games-passcode">
                Passcode
              </label>
              <input
                ref={inputRef}
                id="board-games-passcode"
                type="password"
                value={passcode}
                onChange={(event) => setPasscode(event.target.value)}
                placeholder="Enter passcode"
                autoComplete="current-password"
                className="min-h-11 w-full rounded-lg border border-shelf-paperDark/60 bg-white/35 px-3 text-sm text-shelf-ink placeholder:text-shelf-ink/60"
              />
              <button
                type="submit"
                disabled={isSubmitting || !passcode.trim()}
                className="min-h-11 w-full rounded-full bg-shelf-walnut px-5 font-mono text-[10px] uppercase tracking-widest text-shelf-paper transition-transform hover:-translate-y-0.5 hover:bg-shelf-wood disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Checking…" : "Unlock controls"}
              </button>
            </form>
          </>
        )}

        {isUnlocked && status === "unlocked" && (
          <div className="mt-6 space-y-4">
            <p className="rounded-lg border border-shelf-forest/50 bg-shelf-forest/10 px-4 py-3 text-sm leading-relaxed text-shelf-ink/80">
              Add, edit, delete, and tier movement are enabled for this session.
            </p>
            <button
              type="button"
              onClick={() => void lock()}
              className="min-h-11 w-full rounded-full border border-shelf-paperDark/70 px-4 font-mono text-[10px] uppercase tracking-widest text-shelf-ink/80 transition-colors hover:border-shelf-brass hover:text-shelf-ink"
            >
              Lock controls
            </button>
          </div>
        )}

        {error && <p role="alert" className="mt-3 text-xs text-shelf-burgundy">{error}</p>}
      </section>
    </div>,
    document.body,
  );
}
