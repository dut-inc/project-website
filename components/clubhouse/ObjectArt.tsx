"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Shows a custom illustration when one is configured, falling back to the
// built-in placeholder SVG if the file is missing or fails to load.
export default function ObjectArt({ image, fallback }: { image?: string; fallback: ReactNode }) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // A server-rendered <img> can fail before React attaches onError.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (!image || failed) return <>{fallback}</>;

  return (
    // Plain <img>: room art is decorative, sized by the room, and may be SVG.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={image}
      alt=""
      draggable={false}
      className="block h-auto w-full select-none"
      onError={() => setFailed(true)}
    />
  );
}
