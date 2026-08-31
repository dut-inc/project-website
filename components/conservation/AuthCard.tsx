"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useSession } from "@/lib/useSession";

type Mode = "signin" | "signup";

function getErrorMessage(error: { message?: string; details?: string } | null) {
  if (!error) return "Something went wrong.";
  return error.details
    ? `${error.message} ${error.details}`
    : error.message ?? "Something went wrong.";
}

export default function AuthCard() {
  const { user, loading } = useSession();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const inputClass =
    "w-full rounded-lg border border-ink/20 bg-cream/70 px-3 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-pinNavy";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const emailValue = email.trim().toLowerCase();
    if (!emailValue) {
      setError("Enter your email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();

      if (mode === "signup") {
        if (!inviteCode.trim()) {
          setError("Enter the invite code a friend shared.");
          return;
        }

        const response = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailValue,
            password,
            inviteCode: inviteCode.trim(),
          }),
        });

        const data = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) {
          setError(data.error ?? "Could not create the account.");
          return;
        }

        setNotice("Account created — signing you in…");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: emailValue,
        password,
      });
      if (signInError) {
        setError(
          mode === "signup"
            ? "Account created, but sign-in failed — try signing in."
            : getErrorMessage(signInError),
        );
        return;
      }

      // Successful sign-in: clear the form fields for next time.
      setEmail("");
      setPassword("");
      setInviteCode("");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError as { message?: string; details?: string }));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    try {
      await createClient().auth.signOut();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="paper-torn bg-kraft p-4 shadow-[0_14px_28px_-8px_rgba(0,0,0,0.55)]">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink2">
          checking session…
        </p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="paper-torn bg-kraft p-4 shadow-[0_14px_28px_-8px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink2">
              signed in as
            </p>
            <p className="truncate font-mono text-xs text-ink">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={busy}
            className="shrink-0 rounded-full border border-ink/25 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ink/70 transition-colors hover:border-ink/50 hover:text-ink disabled:opacity-60"
          >
            {busy ? "signing out…" : "sign out"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="paper-torn bg-kraft p-4 shadow-[0_14px_28px_-8px_rgba(0,0,0,0.55)]">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink2">
        field watch · members only
      </p>

      <div className="mt-2 flex gap-1 rounded-full border border-ink/15 bg-cream/40 p-0.5">
        {(["signin", "signup"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
              setNotice(null);
            }}
            className={`flex-1 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors ${
              mode === m
                ? "bg-pinNavy text-cream"
                : "text-ink/60 hover:text-ink"
            }`}
            aria-pressed={mode === m}
          >
            {m === "signin" ? "sign in" : "sign up"}
          </button>
        ))}
      </div>

      {(error || notice) && (
        <div
          role={error ? "alert" : "status"}
          className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
            error
              ? "border-[#C1442D]/70 bg-[#C1442D]/15 text-ink"
              : "border-[#2F7A6B]/70 bg-[#2F7A6B]/15 text-ink"
          }`}
        >
          {error ?? notice}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink2">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className={`mt-1.5 ${inputClass}`}
          />
        </label>

        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink2">
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8+ characters"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className={`mt-1.5 ${inputClass}`}
          />
        </label>

        {mode === "signup" && (
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink2">
              Invite code
            </span>
            <input
              type="text"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              placeholder="ask a friend for the code"
              className={`mt-1.5 ${inputClass}`}
            />
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-wider text-ink/50">
              invite-only — public signups are closed
            </span>
          </label>
        )}

        <button
          type="submit"
          disabled={busy}
          className="min-h-11 w-full rounded-full bg-pinNavy px-5 font-mono text-[10px] uppercase tracking-widest text-cream transition-colors hover:bg-pinNavy/85 disabled:cursor-wait disabled:opacity-60"
        >
          {busy
            ? mode === "signup"
              ? "creating account…"
              : "signing in…"
            : mode === "signup"
              ? "create account"
              : "sign in"}
        </button>
      </form>
    </div>
  );
}
