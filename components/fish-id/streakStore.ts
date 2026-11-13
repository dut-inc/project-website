"use client";

import { useSyncExternalStore } from "react";

// Each viewer's best score (out of RUN_LENGTH) per set and mode, kept in their own browser.
// Storage can be unavailable (private windows, blocked site data), so every
// access is guarded and the quiz works without it.

export function bestKey(setId: string, modeId: string): string {
  return `fid-score:${setId}:${modeId}`;
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function read(key: string): number {
  try {
    const value = Number(window.localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

// null during server rendering and hydration, then the stored best (0 if none).
export function useBest(key: string): number | null {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
}

// Saves `score` if it beats the stored best. Returns whether it did.
export function recordBest(key: string, score: number): boolean {
  if (score <= read(key)) return false;
  try {
    window.localStorage.setItem(key, String(score));
  } catch {
    return false;
  }
  listeners.forEach((listener) => listener());
  return true;
}
