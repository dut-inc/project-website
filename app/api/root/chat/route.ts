// The website's Root rules chat (components/root/RulesChat.tsx). Answers come
// from Google Gemini's free tier with read-only rule tools; see
// lib/root/geminiChat.ts. Streams newline-delimited JSON ChatEvents.
//
// Environment (server only, never NEXT_PUBLIC_):
//   GEMINI_API_KEY         required; a Google AI Studio key from a project
//                          WITHOUT billing, so it stays on the free tier
//   GEMINI_MODELS          optional; comma-separated models tried in order
//                          (default DEFAULT_MODELS in geminiChat.ts)
//
// The free quota is shared by every visitor, so each IP gets a small budget.
// The limit lives in this instance's memory: a soft guard, not a guarantee.
// Google's own quota is the hard cap, and on the free tier it costs nothing.

import { z } from "zod";
import { factions } from "@/lib/root/law";
import { CHAT_LIMITS, modelList, runChat, type ChatEvent } from "@/lib/root/geminiChat";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FACTION_IDS = factions().map((f) => f.id) as [string, ...string[]];

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().min(1).max(CHAT_LIMITS.maxMessageChars * 4),
      }),
    )
    .min(1)
    .max(60),
  faction: z.enum(FACTION_IDS).optional(),
});

const WINDOWS = [
  { ms: 60_000, max: 6 }, // a burst
  { ms: 24 * 60 * 60_000, max: 100 }, // a day
];
const hits = new Map<string, number[]>();

function allow(key: string, now = Date.now()): boolean {
  const longest = Math.max(...WINDOWS.map((w) => w.ms));
  const recent = (hits.get(key) ?? []).filter((t) => now - t < longest);
  const ok = WINDOWS.every((w) => recent.filter((t) => now - t < w.ms).length < w.max);
  if (ok) recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, times] of hits) if (!times.some((t) => now - t < longest)) hits.delete(k);
  }
  return ok;
}

function eventsResponse(events: AsyncIterable<ChatEvent> | ChatEvent[], status = 200) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for await (const event of events) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      controller.close();
    },
  });
  return new Response(stream, {
    status,
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return eventsResponse([{ type: "error", code: "input", message: "That request wasn't understood." }], 400);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allow(ip)) {
    return eventsResponse(
      [{ type: "error", code: "quota", message: "Too many questions in a short time. Wait a minute and try again." }],
      429,
    );
  }

  return eventsResponse(
    runChat(parsed.data.messages, {
      apiKey: process.env.GEMINI_API_KEY,
      models: modelList(process.env.GEMINI_MODELS),
      faction: parsed.data.faction,
    }),
  );
}

export function GET() {
  return new Response("POST a question to this endpoint.", { status: 405, headers: { allow: "POST" } });
}
