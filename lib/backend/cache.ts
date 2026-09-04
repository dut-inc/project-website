// lib/backend/cache.ts
//
// Server-side response cache for the dashboard backend.
//
// The whole point of this layer is efficiency: the frontend must never cause
// nine sports feeds to be fetched on every page load. Providers are polled
// only as often as their data actually changes:
//
//   - No live games  -> refresh every ~30 minutes
//   - Live game      -> refresh every ~15 seconds
//
// The cache lives in process memory. That is the right scope for the current
// single-instance deployment (dev + self-hosted `next start`); if the app is
// ever deployed to serverless workers with no shared process, swap this
// module for a Supabase-backed `provider_cache` table implementing the same
// `getOrCompute` interface — the rest of the backend does not change.
//
// Swappable design so the eventual Supabase caching layer (per the backend
// prompt) replaces this file, not the callers.

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

export class InMemoryCache {
  private store = new Map<string, CacheEntry>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set(key: string, value: unknown, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /**
   * Return the cached value, or compute + store it. `ttlMsFor` is evaluated
   * after `compute` so a payload that contains a live game can request a
   * short TTL.
   */
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    ttlMsFor: (value: T) => number,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;
    const value = await compute();
    this.set(key, value, ttlMsFor(value));
    return value;
  }
}

/** Process-wide dashboard cache. */
export const dashboardCache = new InMemoryCache();

/** 15s while anything is live; 30 minutes otherwise. */
export function dashboardTtlMs(hasLiveGame: boolean): number {
  return hasLiveGame ? 15_000 : 30 * 60 * 1000;
}
