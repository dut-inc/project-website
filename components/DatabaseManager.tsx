"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { GAME_TIERS, TIER_DETAILS, type BoardGameEntry, type GameTier } from "@/lib/boardGames";

type DatabaseGame = BoardGameEntry & {
  createdAt: string | null;
};

type GameForm = Omit<BoardGameEntry, "id">;

const EMPTY_FORM: GameForm = {
  name: "",
  description: "",
  houseRules: "",
  fullRules: "",
  quickNotes: "",
  tier: "Unranked",
};

function toDatabaseGame(row: Record<string, unknown>): DatabaseGame | null {
  const hasValidId =
    (typeof row.id === "number" && Number.isSafeInteger(row.id)) ||
    (typeof row.id === "string" && /^\d+$/.test(row.id));
  const tier = typeof row.tier === "string" && GAME_TIERS.includes(row.tier as GameTier)
    ? (row.tier as GameTier)
    : "Unranked";

  if (!hasValidId) return null;

  return {
    id: String(row.id),
    name: typeof row.name === "string" ? row.name : "",
    description: typeof row.description === "string" ? row.description : "",
    houseRules: typeof row.house_rules === "string" ? row.house_rules : "",
    fullRules: typeof row.full_rules === "string" ? row.full_rules : "",
    quickNotes: typeof row.quick_notes === "string" ? row.quick_notes : "",
    tier,
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
  };
}

function getErrorMessage(error: { message?: string; details?: string } | null) {
  if (!error) return "Something went wrong.";
  return error.details ? `${error.message} ${error.details}` : error.message ?? "Something went wrong.";
}

export default function DatabaseManager() {
  const [games, setGames] = useState<DatabaseGame[]>([]);
  const [form, setForm] = useState<GameForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadGames = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: queryError } = await supabase
        .from("boardgames")
        .select("id, name, description, house_rules, full_rules, quick_notes, tier, created_at")
        .order("created_at", { ascending: true });

      if (queryError) throw queryError;

      const parsedGames = (data ?? [])
        .map((row) => toDatabaseGame(row as Record<string, unknown>))
        .filter((game): game is DatabaseGame => game !== null);

      setGames(parsedGames);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError as { message?: string; details?: string }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // The initial fetch synchronizes component state with the remote table.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadGames();
  }, [loadGames]);

  function updateField<K extends keyof GameForm>(field: K, value: GameForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(game: DatabaseGame) {
    setEditingId(game.id);
    setForm({
      name: game.name,
      description: game.description,
      houseRules: game.houseRules,
      fullRules: game.fullRules,
      quickNotes: game.quickNotes,
      tier: game.tier,
    });
    setNotice(null);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function saveGame(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError("Give the game a name before saving.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);

    const payload = {
      name,
      description: form.description.trim(),
      house_rules: form.houseRules.trim(),
      full_rules: form.fullRules.trim(),
      quick_notes: form.quickNotes.trim(),
      tier: form.tier,
    };

    try {
      const wasEditing = editingId !== null;
      const supabase = createClient();
      const query = wasEditing
        ? supabase.from("boardgames").update(payload).eq("id", editingId)
        : supabase.from("boardgames").insert(payload);
      const { error: queryError } = await query;

      if (queryError) throw queryError;

      resetForm();
      setNotice(wasEditing ? "Game updated." : "Game added to the shelf.");
      await loadGames();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError as { message?: string; details?: string }));
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteGame(game: DatabaseGame) {
    if (!window.confirm(`Delete ${game.name} from the database?`)) return;

    setError(null);
    setNotice(null);
    try {
      const supabase = createClient();
      const { error: queryError } = await supabase.from("boardgames").delete().eq("id", game.id);
      if (queryError) throw queryError;
      if (editingId === game.id) resetForm();
      setNotice(`${game.name} was deleted.`);
      await loadGames();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError as { message?: string; details?: string }));
    }
  }

  return (
    <section className="mx-auto mt-10 max-w-6xl" aria-labelledby="database-manager-heading">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-shelf-brass">supabase table console</p>
          <h2 id="database-manager-heading" className="mt-1 font-display text-3xl italic text-shelf-paper sm:text-4xl">
            Manage the shelf database
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-shelf-paper/75">
            Prototype CRUD for the <code className="font-mono text-shelf-brass">boardgames</code> table. This uses the public client and follows your Supabase policies.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadGames()}
          disabled={isLoading}
          className="min-h-11 rounded-full border border-shelf-brass/60 px-4 font-mono text-[10px] uppercase tracking-widest text-shelf-brass transition-colors hover:bg-shelf-brass/10 disabled:cursor-wait disabled:opacity-50"
        >
          {isLoading ? "Refreshing…" : "Refresh rows"}
        </button>
      </div>

      {(error || notice) && (
        <div
          role={error ? "alert" : "status"}
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-shelf-burgundy/70 bg-shelf-burgundy/20 text-shelf-paper"
              : "border-shelf-forest/70 bg-shelf-forest/20 text-shelf-paper"
          }`}
        >
          {error ?? notice}
          {(error?.toLowerCase().includes("relation") ||
            error?.toLowerCase().includes("row-level security") ||
            error?.toLowerCase().includes("permission denied")) && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-shelf-paper/70">
              Run the latest supabase/schema.sql in the Supabase SQL editor, then refresh. It grants the anon/authenticated roles and applies the matching RLS policies.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-shelf-paper/65">
            <span>Rows on the shelf</span>
            <span>{games.length} games</span>
          </div>
          {isLoading ? (
            <div className="rounded-xl border border-shelf-paper/20 bg-shelf-walnut/70 px-4 py-8 text-center text-sm text-shelf-paper/70">
              Reading from Supabase…
            </div>
          ) : games.length === 0 ? (
            <div className="rounded-xl border border-dashed border-shelf-paper/30 bg-shelf-walnut/50 px-4 py-8 text-center text-sm text-shelf-paper/70">
              No rows yet. Add the first game using the form.
            </div>
          ) : (
            games.map((game) => (
              <article key={game.id} className="rounded-xl border border-shelf-paperDark/50 bg-shelf-paper p-4 text-shelf-ink shadow-[0_6px_14px_rgba(38,24,15,0.2)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-body text-lg font-semibold">{game.name}</h3>
                      <span className="rounded-full bg-shelf-walnut px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-shelf-paper">
                        {TIER_DETAILS[game.tier].label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-shelf-ink/75">{game.description || "No description yet."}</p>
                    <p className="mt-2 font-mono text-[10px] text-shelf-ink/55">ID: {game.id}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => startEdit(game)} className="min-h-9 rounded-full border border-shelf-paperDark px-3 font-mono text-[10px] uppercase tracking-wider text-shelf-ink transition-colors hover:border-shelf-brass hover:text-shelf-wood">
                      Edit
                    </button>
                    <button type="button" onClick={() => void deleteGame(game)} className="min-h-9 rounded-full border border-shelf-burgundy/50 px-3 font-mono text-[10px] uppercase tracking-wider text-shelf-burgundy transition-colors hover:bg-shelf-burgundy/10">
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                  {[
                    ["House rules", game.houseRules],
                    ["Full rules", game.fullRules],
                    ["Quick notes", game.quickNotes],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-shelf-paperDark/25 p-3">
                      <p className="font-mono text-[9px] uppercase tracking-wider text-shelf-ink/65">{label}</p>
                      <p className="mt-1 whitespace-pre-wrap leading-relaxed text-shelf-ink/80">{value || "—"}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>

        <form onSubmit={saveGame} className="paper-torn bg-shelf-paper p-5 text-shelf-ink shadow-[0_10px_20px_rgba(38,24,15,0.25)]">
          <p className="font-mono text-[10px] uppercase tracking-widest text-shelf-ink/75">{editingId ? "edit row" : "new row"}</p>
          <h3 className="mt-1 font-display text-2xl italic">{editingId ? "Rewrite the card" : "Add to the table"}</h3>
          <div className="mt-4 space-y-3">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-shelf-ink/75" htmlFor="db-game-name">Game name</label>
            <input id="db-game-name" value={form.name} onChange={(event) => updateField("name", event.target.value)} className="w-full rounded-lg border border-shelf-paperDark/60 bg-white/35 px-3 py-2.5 text-sm" placeholder="e.g. Cascadia" />
            <label className="block font-mono text-[10px] uppercase tracking-wider text-shelf-ink/75" htmlFor="db-game-description">Description</label>
            <textarea id="db-game-description" value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={2} className="w-full resize-y rounded-lg border border-shelf-paperDark/60 bg-white/35 px-3 py-2.5 text-sm" />
            <label className="block font-mono text-[10px] uppercase tracking-wider text-shelf-ink/75" htmlFor="db-game-tier">Tier</label>
            <select id="db-game-tier" value={form.tier} onChange={(event) => updateField("tier", event.target.value as GameTier)} className="w-full rounded-lg border border-shelf-paperDark/60 bg-white/35 px-3 py-2.5 text-sm">
              {GAME_TIERS.map((tier) => <option key={tier} value={tier}>{TIER_DETAILS[tier].label}</option>)}
            </select>
            {([
              ["houseRules", "House rules", "What does this group do differently?"],
              ["fullRules", "Full rules", "Setup, turn order, scoring, and edge cases."],
              ["quickNotes", "Quick refresher notes", "The 30-second reminder before play."],
            ] as const).map(([field, label, placeholder]) => (
              <label key={field} className="block font-mono text-[10px] uppercase tracking-wider text-shelf-ink/75" htmlFor={`db-game-${field}`}>
                {label}
                <textarea id={`db-game-${field}`} value={form[field]} onChange={(event) => updateField(field, event.target.value)} rows={3} placeholder={placeholder} className="mt-1.5 w-full resize-y rounded-lg border border-shelf-paperDark/60 bg-white/35 px-3 py-2.5 font-body text-sm normal-case tracking-normal placeholder:text-shelf-ink/60" />
              </label>
            ))}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={isSaving} className="min-h-11 flex-1 rounded-full bg-shelf-walnut px-4 font-mono text-[10px] uppercase tracking-widest text-shelf-paper transition-colors hover:bg-shelf-wood disabled:cursor-wait disabled:opacity-50">
                {isSaving ? "Saving…" : editingId ? "Save changes" : "Insert row"}
              </button>
              {editingId && <button type="button" onClick={resetForm} className="min-h-11 rounded-full border border-shelf-paperDark px-4 font-mono text-[10px] uppercase tracking-wider text-shelf-ink">Cancel</button>}
            </div>
          </div>
        </form>
      </div>

      <p className="mt-6 font-mono text-[10px] uppercase tracking-wider text-shelf-paper/55">
        Prototype only · public Supabase client · protect this route with Supabase Auth and RLS before deploying.
      </p>
    </section>
  );
}
