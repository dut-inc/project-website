"use client";

import { useSyncExternalStore } from "react";

// Each viewer's best streak per set and mode, kept in their own browser.
// Storage can be unavailable (private windows, blocked site data), so every
// access is guarded and the quiz works without it.

export function bestKey(setId: string, modeId: string): string {
  return `fid-best:${setId}:${modeId}`;
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
export function useBestStreak(key: string): number | null {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
}

// Saves `streak` if it beats the stored best. Returns whether it did.
export function recordStreak(key: string, streak: number): boolean {
  if (streak <= read(key)) return false;
  try {
    window.localStorage.setItem(key, String(streak));
  } catch {
    return false;
  }
  listeners.forEach((listener) => listener());
  return true;
}
