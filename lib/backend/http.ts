// lib/backend/http.ts
//
// Server-only HTTP helper for the sports dashboard backend. Every provider
// goes through here so timeouts, error messages, and the user-agent stay
// consistent. All providers used today are keyless public feeds, so no
// secrets ever touch this module.

export interface HttpOptions {
  /** Abort the request after this many ms. Default 20s. */
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export class HttpError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(status: number, url: string) {
    super(`HTTP ${status} for ${url}`);
    this.name = "HttpError";
    this.status = status;
    this.url = url;
  }
}

/** GET a URL and parse the response as JSON. Throws on non-2xx/timeout. */
export async function fetchJson<T = unknown>(
  url: string,
  options: HttpOptions = {},
): Promise<T> {
  const { timeoutMs = 20_000, headers = {} } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "SeattleSportsDashboard/0.1 (dashboard backend; public sports feeds)",
        Accept: "application/json",
        ...headers,
      },
      signal: controller.signal,
      // Providers are cached by lib/backend/cache.ts — never let the
      // platform HTTP cache interfere with those decisions.
      cache: "no-store",
    });
    if (!res.ok) throw new HttpError(res.status, url);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
