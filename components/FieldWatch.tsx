"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FieldUploader from "@/components/FieldUploader";
import FieldSpeciesPanel from "@/components/FieldSpeciesPanel";
import FieldMap from "@/components/FieldMap";
import {
  FIELD_SEED_SIGHTINGS,
  formatStamp,
  type FieldIdResult,
  type FieldSighting,
  loadStoredSightings,
  makeThumbnailDataUrl,
  readImageFileAsCanvas,
  runIdStub,
  saveStoredSightings,
  speciesById,
} from "@/lib/fieldWatch";

// FieldWatch — the working case-file for case 003.
//
// State machine: idle → analyzing → result → confirmed. While
// "confirmed" the user's pending coord stays until they reset or pick a
// new photo. A submittingRef guards against the double-fire race when
// React hasn't yet torn down the confirm form between clicks.

type Step = "idle" | "analyzing" | "result" | "confirmed";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export default function FieldWatch() {
  const [step, setStep] = useState<Step>("idle");
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<FieldIdResult | null>(null);
  const [pendingCoord, setPendingCoord] = useState<
    { x: number; y: number } | null
  >(null);
  const [caption, setCaption] = useState("");
  const [sightings, setSightings] = useState<FieldSighting[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const submittingRef = useRef(false);
  const initialsRef = useRef(0);
  const lastPersistedRef = useRef<string>("");

  // Load stored sightings on first mount (seeds if first ever visit).
  useEffect(() => {
    const stored = loadStoredSightings();
    if (stored.length === 0) {
      const seeded: FieldSighting[] = FIELD_SEED_SIGHTINGS.map((s) => ({
        ...s,
        thumb: "",
      }));
      setSightings(seeded);
      lastPersistedRef.current = JSON.stringify(seeded);
      saveStoredSightings(seeded);
      setLog((l) => [...l, "loaded 5 seeded sightings"]);
    } else {
      setSightings(stored);
      lastPersistedRef.current = JSON.stringify(stored);
      setLog((l) => [...l, `loaded ${stored.length} stored sightings`]);
    }
  }, []);

  // Run the ID stub on each new file pick.
  useEffect(() => {
    if (!pickedFile) {
      setResult(null);
      return;
    }
    let cancelled = false;
    setStep("analyzing");
    (async () => {
      try {
        const canvas = await readImageFileAsCanvas(pickedFile);
        const id = runIdStub(canvas);
        if (cancelled) return;
        setResult(id);
        setStep("result");
        const sp = speciesById(id.best.id);
        setLog((l) => [
          ...l,
          `classified: ${sp?.common ?? id.best.id} (${Math.round(id.confidence * 100)}%)`,
        ]);
      } catch (_e) {
        if (!cancelled) {
          setStep("idle");
          setLog((l) => [...l, "error decoding image"]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pickedFile]);

  // Persist when sightings change (skipping the no-op equal payload).
  useEffect(() => {
    const json = JSON.stringify(sightings);
    if (json === lastPersistedRef.current) return;
    if (sightings.length === 0) return;
    lastPersistedRef.current = json;
    saveStoredSightings(sightings);
  }, [sightings]);

  const handlePick = useCallback(
    (file: File) => {
      if (file.size > MAX_UPLOAD_BYTES) {
        setLog((l) => [
          ...l,
          `rejected: ${file.name} is ${(file.size / 1024 / 1024).toFixed(1)} MB · 5 MB max`,
        ]);
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
      setPickedFile(file);
      setPendingCoord(null);
      setCaption("");
      initialsRef.current = 0;
    },
    [previewUrl]
  );

  const handleReset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPickedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setPendingCoord(null);
    setCaption("");
    submittingRef.current = false;
    setStep("idle");
    setLog((l) => [...l, "reset — awaiting next upload"]);
  }, [previewUrl]);

  const handleDropCoord = useCallback(
    (x: number, y: number) => {
      if (step !== "result") {
        setLog((l) => [...l, "drop ignored — no upload to attach to"]);
        return;
      }
      setPendingCoord({ x, y });
      setLog((l) => [...l, `pin staged at ${fmt(x)}, ${fmt(y)}`]);
    },
    [step]
  );

  const handleConfirm = useCallback(async () => {
    if (submittingRef.current) return;
    if (!pickedFile || !result || !pendingCoord) return;
    submittingRef.current = true;
    setStep("analyzing");
    try {
      const thumb = await makeThumbnailDataUrl(pickedFile, 320);
      const sighting: FieldSighting = {
        id: `user-${Date.now()}-${(initialsRef.current++).toString(36)}`,
        speciesId: result.best.id,
        confidence: result.confidence,
        x: pendingCoord.x,
        y: pendingCoord.y,
        thumb,
        createdAt: Date.now(),
        caption: caption.trim() || undefined,
      };
      setSightings((s) => [...s, sighting]);
      setStep("confirmed");
      const sp = speciesById(result.best.id);
      setLog((l) => [...l, `confirmed: ${sp?.common ?? result.best.id} pin logged`]);
    } catch (_e) {
      setStep("result");
      setLog((l) => [...l, "error: could not save sighting"]);
    } finally {
      submittingRef.current = false;
    }
  }, [pickedFile, result, pendingCoord, caption]);

  const handleRemove = useCallback((id: string) => {
    // Capture the displayed label in a closure variable rather than calling
    // setLog from inside the setSightings updater — under StrictMode the
    // updater runs twice and the log would get duplicated.
    let removedLabel = "pin";
    setSightings((s) => {
      const removed = s.find((x) => x.id === id);
      const next = s.filter((x) => x.id !== id);
      // The persistence effect will write once it sees a new JSON, but for
      // an instant delete we also write here so seeds survives a reload.
      saveStoredSightings(next);
      lastPersistedRef.current = JSON.stringify(next);
      if (removed) {
        const sp = speciesById(removed.speciesId);
        removedLabel = sp?.common ?? "pin";
      }
      return next;
    });
    setLog((l) => [...l, `removed: ${removedLabel}`]);
  }, []);

  // Clean up the object URL on unmount so long-lived pages don't leak.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const recent = useMemo(
    () => [...sightings].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
    [sightings]
  );

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <FieldUploader
            onPick={handlePick}
            onError={(msg) => setLog((l) => [...l, msg])}
            disabled={pickedFile !== null || step === "confirmed"}
          />
          <FieldSpeciesPanel
            state={
              step === "confirmed"
                ? "result"
                : step === "analyzing"
                ? "analyzing"
                : step === "result"
                ? "result"
                : "idle"
            }
            result={result}
            previewUrl={previewUrl}
            confirmed={
              step === "confirmed" && result && pendingCoord
                ? {
                    id: "preview",
                    speciesId: result.best.id,
                    confidence: result.confidence,
                    x: pendingCoord.x,
                    y: pendingCoord.y,
                    thumb: previewUrl ?? "",
                    createdAt: Date.now(),
                  }
                : null
            }
            onReset={handleReset}
          />

          {step === "result" && pendingCoord && (
            <div className="rounded-md border border-pinTeal/30 bg-black/40 p-3 font-mono text-[12px]">
              <label
                htmlFor="field-caption"
                className="block text-[10px] uppercase tracking-widest text-pinTeal/70"
              >
                caption (optional)
              </label>
              <input
                id="field-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="from a hike at Carkeek…"
                maxLength={80}
                className="mt-1 w-full rounded-sm border border-pinTeal/30 bg-black/60 px-2 py-1.5 text-cream placeholder:text-cream/30 focus:border-pinTeal focus:outline-none"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 rounded-sm border border-pinGold bg-pinGold/20 px-3 py-1.5 text-[11px] uppercase tracking-widest text-pinGold hover:bg-pinGold/30"
                >
                  confirm → drop pin
                </button>
                <button
                  type="button"
                  onClick={() => setPendingCoord(null)}
                  className="rounded-sm border border-pinTeal/40 px-3 py-1.5 text-[11px] uppercase tracking-widest text-pinTeal hover:bg-pinTeal/10"
                >
                  move pin
                </button>
              </div>
            </div>
          )}
        </div>

        <FieldMap
          pendingCoord={pendingCoord}
          sightings={sightings}
          onDropCoord={handleDropCoord}
          onRemove={handleRemove}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <LogPane log={log} />
        <RecentPane recent={recent} />
      </div>
    </section>
  );
}

// --- Sub-panes (hoisted so React doesn't recreate them every render) -------

function LogPane({ log }: { log: string[] }) {
  return (
    <div className="rounded-md border border-pinTeal/30 bg-black/40 font-mono text-[12px] text-pinTeal/85 shadow-[0_0_0_1px_rgba(47,122,107,0.05),inset_0_0_40px_rgba(47,122,107,0.06)]">
      <header className="flex items-center justify-between border-b border-pinTeal/20 px-4 py-2 text-[10px] uppercase tracking-widest text-pinTeal/80">
        <span>agent log · this session</span>
        <span className="text-pinTeal/60">{log.length} events</span>
      </header>
      <div className="max-h-44 overflow-y-auto px-4 py-3 text-[11px] leading-relaxed">
        {log.length === 0 && <p className="text-cream/40">&gt; no events yet</p>}
        {log.map((line, i) => (
          <p key={i} className="text-cream/75">
            <span className="mr-2 text-pinTeal/40">
              {String(i + 1).padStart(2, "0")}
            </span>
            &gt; {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function RecentPane({ recent }: { recent: FieldSighting[] }) {
  return (
    <div className="rounded-md border border-pinTeal/30 bg-black/40 font-mono text-[12px] text-pinTeal/85 shadow-[0_0_0_1px_rgba(47,122,107,0.05),inset_0_0_40px_rgba(47,122,107,0.06)]">
      <header className="flex items-center justify-between border-b border-pinTeal/20 px-4 py-2 text-[10px] uppercase tracking-widest text-pinTeal/80">
        <span>latest sightings · top 5</span>
        <span className="text-pinTeal/60">{recent.length} shown</span>
      </header>
      <div className="divide-y divide-pinTeal/15">
        {recent.length === 0 && (
          <p className="px-4 py-3 text-[11px] text-cream/40">
            &gt; no sightings yet — upload a photo to make the first one.
          </p>
        )}
        {recent.map((s) => {
          const sp = speciesById(s.speciesId);
          return (
            <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 text-[11px]">
              {s.thumb ? (
                <img
                  src={s.thumb}
                  alt=""
                  className="h-9 w-9 rounded-sm border border-pinTeal/30 object-cover"
                />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-sm border border-dashed border-pinTeal/30 text-[9px] uppercase tracking-widest text-pinTeal/50">
                  seed
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-cream">{sp?.common ?? "—"}</p>
                <p className="truncate text-[10px] text-cream/45">
                  {sp?.scientific}
                </p>
              </div>
              <div className="shrink-0 text-right text-[10px] uppercase tracking-widest text-cream/45">
                <p>{Math.round(s.confidence * 100)}%</p>
                <p className="text-pinTeal/50">{formatStamp(s.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function fmt(n: number) {
  return n.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}
