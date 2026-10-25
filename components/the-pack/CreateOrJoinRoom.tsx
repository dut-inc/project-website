"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";

export async function ensureSignedIn() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) return supabase;

  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return supabase;
}

function isRoomCode(value: unknown): value is { code: string } {
  return typeof value === "object" && value !== null && typeof (value as { code?: unknown }).code === "string";
}

export default function CreateOrJoinRoom() {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = await ensureSignedIn();

      if (mode === "create") {
        const { data, error: rpcError } = await supabase
          .rpc("the_pack_create_room", { p_display_name: displayName })
          .single();
        if (rpcError) throw rpcError;
        if (!isRoomCode(data)) throw new Error("The room could not be created.");
        router.push(`/the-pack/room/${data.code}`);
      } else {
        const normalizedCode = code.trim().toUpperCase();
        const { error: rpcError } = await supabase
          .rpc("the_pack_join_room", { p_code: normalizedCode, p_display_name: displayName })
          .single();
        if (rpcError) throw rpcError;
        router.push(`/the-pack/room/${normalizedCode}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-md">
      <div className="flex gap-2 font-mono text-[11px] uppercase tracking-widest">
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`rounded-full px-4 py-2 transition-colors ${
            mode === "create" ? "bg-pinGold/20 text-pinGold" : "text-cream/50 hover:text-cream"
          }`}
        >
          Create a room
        </button>
        <button
          type="button"
          onClick={() => setMode("join")}
          className={`rounded-full px-4 py-2 transition-colors ${
            mode === "join" ? "bg-pinGold/20 text-pinGold" : "text-cream/50 hover:text-cream"
          }`}
        >
          Join a room
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <div>
          <label htmlFor="display-name" className="font-mono text-[10px] uppercase tracking-wider text-cream/60">
            Your name
          </label>
          <input
            id="display-name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            maxLength={16}
            className="mt-1 min-h-11 w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 text-sm text-cream placeholder:text-cream/40"
            placeholder="Dennis"
          />
        </div>

        {mode === "join" && (
          <div>
            <label htmlFor="room-code" className="font-mono text-[10px] uppercase tracking-wider text-cream/60">
              Room code
            </label>
            <input
              id="room-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
              maxLength={5}
              className="mt-1 min-h-11 w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 text-center font-mono text-lg uppercase tracking-[0.3em] text-cream placeholder:text-cream/40"
              placeholder="A7K2P"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 w-full rounded-full bg-pinGold/90 px-6 py-3 font-mono text-xs uppercase tracking-widest text-wall transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "One moment…" : mode === "create" ? "Create room" : "Join room"}
        </button>

        {error && (
          <p role="alert" className="text-xs text-pinRed">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
