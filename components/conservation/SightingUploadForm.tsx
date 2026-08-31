"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { compressForUploadBlob, sightingPhotoUrl, uploadSightingPhoto } from "@/lib/localPhotos";
import { CATEGORY_META, makeSightingId, type SightingCategory } from "@/lib/sightings";
import type { PickedPoint } from "./SightingMap";

const CATEGORY_IDS = Object.keys(CATEGORY_META) as SightingCategory[];

function getErrorMessage(error: { message?: string; details?: string } | null) {
  if (!error) return "Something went wrong.";
  return error.details
    ? `${error.message} ${error.details}`
    : error.message ?? "Something went wrong.";
}

function todayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function needsSchemaHint(message: string) {
  return (
    message.toLowerCase().includes("relation") ||
    message.toLowerCase().includes("row-level security") ||
    message.toLowerCase().includes("permission denied")
  );
}

type Props = {
  user: User | null;
  pickMode: boolean;
  onStartPick: () => void;
  onStopPick: () => void;
  pickedPoint: PickedPoint | null;
  onPickedConsumed: () => void;
  onCreated: (id: string) => void;
};

export default function SightingUploadForm({
  user,
  pickMode,
  onStartPick,
  onStopPick,
  pickedPoint,
  onPickedConsumed,
  onCreated,
}: Props) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [species, setSpecies] = useState("");
  const [category, setCategory] = useState<SightingCategory>("other");
  const [location, setLocation] = useState("");
  const [latText, setLatText] = useState("");
  const [lngText, setLngText] = useState("");
  const [date, setDate] = useState(todayLocal);
  const [observer, setObserver] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  // While a spot is picked on the map, the pin stays visible and its
  // coordinates are the source of truth for the lat/lng fields. The parent
  // clears pickedPoint on the next pick, form close, or successful submit.
  const lat = pickedPoint ? pickedPoint.lat.toFixed(5) : latText;
  const lng = pickedPoint ? pickedPoint.lng.toFixed(5) : lngText;

  // Free the object URL when the component unmounts.
  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPhoto(file);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = file ? URL.createObjectURL(file) : null;
    previewUrlRef.current = url;
    setPreviewUrl(url);
  }

  function clearPickedPointIfAny() {
    if (pickedPoint) onPickedConsumed();
  }

  function resetForm() {
    setPhoto(null);
    setPreviewUrl(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSpecies("");
    setCategory("other");
    setLocation("");
    setLatText("");
    setLngText("");
    setDate(todayLocal());
    setObserver("");
    setNote("");
    setError(null);
    setNotice(null);
    clearPickedPointIfAny();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const speciesValue = species.trim();
    const locationValue = location.trim();

    if (!photo) {
      setError("Pick a photo to upload.");
      return;
    }
    if (!speciesValue) {
      setError("Name the species you saw.");
      return;
    }
    if (!locationValue) {
      setError("Add a place name for the sighting.");
      return;
    }

    // A map-picked point is authoritative; typed values fall back to manual input.
    let latitude: number;
    let longitude: number;
    if (pickedPoint) {
      latitude = pickedPoint.lat;
      longitude = pickedPoint.lng;
    } else {
      latitude = Number(latText);
      longitude = Number(lngText);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        setError("Latitude must be between -90 and 90. Pick on the map or type it.");
        return;
      }
      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        setError("Longitude must be between -180 and 180. Pick on the map or type it.");
        return;
      }
    }
    if (!date) {
      setError("Add the date you saw it.");
      return;
    }

    setIsSaving(true);
    try {
      if (!user) throw new Error("Sign in to log a sighting.");

      const id = makeSightingId();
      const supabase = createClient();
      const blob = await compressForUploadBlob(photo);
      // Folder-per-user layout matches the storage RLS policies in schema.sql:
      // users can only write inside sightings/<owner_id>/.
      const path = `sightings/${user.id}/${id}.jpg`;
      await uploadSightingPhoto(supabase, path, blob);
      const photoUrl = sightingPhotoUrl(supabase, path);

      const { error: queryError } = await supabase.from("sightings").insert({
        id,
        species: speciesValue,
        category,
        location: locationValue,
        lat: latitude,
        lng: longitude,
        date,
        observer: observer.trim() || "anonymous",
        note: note.trim(),
        photo: photoUrl,
        owner_id: user.id,
      });
      if (queryError) throw queryError;

      resetForm();
      setNotice("Sighting logged — pinned on the map below.");
      onCreated(id);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError as { message?: string; details?: string }));
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-ink/20 bg-cream/70 px-3 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-pinNavy";

  if (!user) {
    return (
      <div className="paper-torn bg-kraft p-5 shadow-[0_14px_28px_-8px_rgba(0,0,0,0.55)]">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink2">
          field report · members only
        </p>
        <h3 className="mt-0.5 font-display text-2xl italic text-ink">
          Sign in to log a sighting
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          The map stays open to everyone, but logging sightings is for signed-in
          members. Use the members-only card to sign in or create an account with
          an invite code.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="paper-torn bg-kraft p-5 shadow-[0_14px_28px_-8px_rgba(0,0,0,0.55)]"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink2">
            field report · new sighting
          </p>
          <h3 className="mt-0.5 font-display text-2xl italic text-ink">
            Log a sighting
          </h3>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="rounded-full border border-ink/25 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ink/70 transition-colors hover:border-ink/50 hover:text-ink"
        >
          Clear
        </button>
      </div>

      {(error || notice) && (
        <div
          role={error ? "alert" : "status"}
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-[#C1442D]/70 bg-[#C1442D]/15 text-ink"
              : "border-[#2F7A6B]/70 bg-[#2F7A6B]/15 text-ink"
          }`}
        >
          {error ?? notice}
          {error && needsSchemaHint(error) && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-ink/60">
              Run the latest supabase/schema.sql in the Supabase SQL editor, then refresh. It
              grants the anon/authenticated roles and applies the matching RLS policies.
            </p>
          )}
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-[14rem_minmax(0,1fr)]">
        {/* Photo picker */}
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-wider text-ink2" htmlFor="sighting-photo">
            Photo
          </label>
          <label
            htmlFor="sighting-photo"
            className={`mt-1.5 flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center transition-colors ${
              previewUrl
                ? "border-transparent"
                : "border-ink/30 bg-cream/40 hover:border-ink/60"
            }`}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Preview of the chosen photo"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="px-4 font-mono text-[10px] uppercase tracking-wider text-ink/60">
                choose a photo…
              </span>
            )}
          </label>
          <input
            ref={fileInputRef}
            id="sighting-photo"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handlePhotoChange}
          />
        </div>

        {/* Fields */}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink2">Species</span>
            <input
              value={species}
              onChange={(event) => setSpecies(event.target.value)}
              placeholder="e.g. Black-tailed Deer"
              className={`mt-1.5 ${inputClass}`}
            />
          </label>

          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink2">Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as SightingCategory)}
              className={`mt-1.5 ${inputClass}`}
            >
              {CATEGORY_IDS.map((id) => (
                <option key={id} value={id}>
                  {CATEGORY_META[id].label}
                </option>
              ))}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink2">Place name</span>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="e.g. Nisqually Wildlife Refuge"
              className={`mt-1.5 ${inputClass}`}
            />
          </label>

          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink2">Latitude</span>
            <input
              value={lat}
              onChange={(event) => {
                setLatText(event.target.value);
                clearPickedPointIfAny();
              }}
              placeholder="47.6607"
              inputMode="decimal"
              className={`mt-1.5 ${inputClass}`}
            />
          </label>

          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink2">Longitude</span>
            <input
              value={lng}
              onChange={(event) => {
                setLngText(event.target.value);
                clearPickedPointIfAny();
              }}
              placeholder="-122.4234"
              inputMode="decimal"
              className={`mt-1.5 ${inputClass}`}
            />
          </label>

          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={pickMode ? onStopPick : onStartPick}
              className={`rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                pickMode
                  ? "border-[#C1442D] bg-[#C1442D]/15 text-[#C1442D]"
                  : "border-pinNavy/60 text-pinNavy hover:bg-pinNavy/10"
              }`}
            >
              {pickMode ? "picking… click the map" : "pick on the map"}
            </button>
            {pickMode && (
              <p className="mt-1.5 font-mono text-[10px] text-ink/60">
                the map cursor is crosshair — click to drop the pin
              </p>
            )}
          </div>

          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink2">Date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
          </label>

          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink2">Observer</span>
            <input
              value={observer}
              onChange={(event) => setObserver(event.target.value)}
              placeholder="anonymous"
              className={`mt-1.5 ${inputClass}`}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink2">Note</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              placeholder="What were they doing?"
              className={`mt-1.5 resize-y ${inputClass}`}
            />
          </label>

          <div className="flex items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={isSaving}
              className="min-h-11 rounded-full bg-pinNavy px-5 font-mono text-[10px] uppercase tracking-widest text-cream transition-colors hover:bg-pinNavy/85 disabled:cursor-wait disabled:opacity-60"
            >
              {isSaving ? "Logging…" : "Log sighting"}
            </button>
            <p className="font-mono text-[10px] text-ink/50">
              photos will be compressed
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
