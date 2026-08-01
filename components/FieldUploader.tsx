"use client";

import { useCallback, useRef, useState } from "react";

// FieldUploader — drag/drop or click-to-browse. Owns nothing else; on a
// successful file pick it hands the File to the parent. Bad files are
// reported via `onError` so the user gets feedback rather than silence.

type Props = {
  onPick: (file: File) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
};

export default function FieldUploader({ onPick, onError, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [hover, setHover] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.type.startsWith("image/")) {
        onError?.(
          `rejected: ${file.name || "file"} is not an image (${file.type || "unknown"})`
        );
        return;
      }
      onPick(file);
    },
    [onPick, onError]
  );

  return (
    <div
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        setHover(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => {
        if (!disabled) inputRef.current?.click();
      }}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-label="Upload a sighting photo"
      className={[
        "group relative flex h-44 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed transition-all duration-150",
        hover
          ? "border-pinTeal bg-pinTeal/10 shadow-[inset_0_0_30px_rgba(47,122,107,0.25)]"
          : "border-pinTeal/40 bg-pinTeal/5 hover:border-pinTeal/70 hover:bg-pinTeal/10",
        disabled ? "cursor-not-allowed opacity-50" : "",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />
      <UploadGlyph />
      <p className="font-mono text-xs uppercase tracking-widest text-pinTeal">
        {hover ? "release to attach" : "drop a photo or click to browse"}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-cream/40">
        jpg · png · webp · max ~5MB
      </p>
    </div>
  );
}

function UploadGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7 text-pinTeal transition-transform group-hover:-translate-y-0.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 16V4" />
      <path d="m6 10 6-6 6 6" />
      <path d="M4 20h16" />
    </svg>
  );
}
