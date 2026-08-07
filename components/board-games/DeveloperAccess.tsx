"use client";

import { useEffect, useState } from "react";

type AccessStatus = "checking" | "locked" | "unlocked" | "unconfigured";

type DeveloperAccessProps = {
  isUnlocked: boolean;
  onUnlocked: () => void;
  onLocked: () => void;
};

type AccessResponse = {
  configured?: boolean;
  unlocked?: boolean;
  error?: string;
};

export default function DeveloperAccess({
  isUnlocked,
  onUnlocked,
  onLocked,
}: DeveloperAccessProps) {
  const [status, setStatus] = useState<AccessStatus>("checking");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function checkAccess() {
      try {
        const response = await fetch("/api/board-games/access", { cache: "no-store" });
        const result = (await response.json()) as AccessResponse;
        if (!isCurrent) return;

        if (!result.configured) {
          setStatus("unconfigured");
          return;
        }

        if (result.unlocked) {
          setStatus("unlocked");
          onUnlocked();
        } else {
          setStatus("locked");
        }
      } catch {
        if (isCurrent) {
          setStatus("locked");
          setError("The developer access check could not be reached.");
        }
      }
    }

    void checkAccess();
    return () => {
      isCurrent = false;
    };
  }, [onUnlocked]);

  async function unlock(event: React.FormEvent<HTMLFormElement>) {
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

  if (status === "checking") {
    return (
      <section className="rounded-2xl border border-shelf-paper/15 bg-shelf-walnut/70 px-5 py-4 text-sm text-shelf-paper/70">
        Checking developer access…
      </section>
    );
  }

  if (status === "unconfigured") {
    return (
      <section className="rounded-2xl border border-shelf-brass/35 bg-shelf-walnut/70 px-5 py-4 text-sm text-shelf-paper/75">
        <p className="font-mono text-[10px] uppercase tracking-widest text-shelf-brass">developer controls</p>
        <p className="mt-2">Set <code className="font-mono text-shelf-brass">BOARD_GAMES_PASSCODE</code> on the server to enable editing.</p>
      </section>
    );
  }

  if (isUnlocked) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-shelf-moss/60 bg-shelf-moss/20 px-5 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-shelf-brass">developer controls unlocked</p>
          <p className="mt-1 text-sm text-shelf-paper/75">Add, edit, delete, and tier movement are enabled.</p>
        </div>
        <button
          type="button"
          onClick={() => void lock()}
          className="min-h-10 rounded-full border border-shelf-paper/25 px-4 font-mono text-[10px] uppercase tracking-widest text-shelf-paper transition-colors hover:border-shelf-brass hover:text-shelf-brass"
        >
          Lock controls
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-shelf-brass/35 bg-shelf-walnut/70 p-5 shadow-[0_10px_20px_rgba(38,24,15,0.2)]">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-shelf-brass">developer controls locked</p>
        <p className="mt-2 text-sm leading-relaxed text-shelf-paper/75">Enter the dev passcode to enable adding, editing, deleting, and drag-and-drop tier changes.</p>
      </div>
      <form onSubmit={unlock} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="board-games-passcode">Developer passcode</label>
        <input
          id="board-games-passcode"
          type="password"
          value={passcode}
          onChange={(event) => setPasscode(event.target.value)}
          placeholder="Developer passcode"
          autoComplete="current-password"
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-shelf-paper/20 bg-shelf-wood/70 px-3 text-sm text-shelf-paper placeholder:text-shelf-paper/55"
        />
        <button
          type="submit"
          disabled={isSubmitting || !passcode.trim()}
          className="min-h-11 rounded-full bg-shelf-brass px-5 font-mono text-[10px] uppercase tracking-widest text-shelf-ink transition-transform hover:-translate-y-0.5 hover:bg-shelf-brass/85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Checking…" : "Unlock"}
        </button>
      </form>
      {error && <p role="alert" className="mt-3 text-xs text-shelf-paper">{error}</p>}
    </section>
  );
}
