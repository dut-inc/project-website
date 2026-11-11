"use client";

import { useState } from "react";

// Copies this page's full URL (a rule's deep link) to the clipboard.
export default function CopyLinkButton({ className = "" }: { className?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href.split("#")[0]);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button type="button" onClick={copy} className={className} aria-live="polite">
      {state === "copied" ? "Link copied" : state === "failed" ? "Couldn't copy" : "Copy link"}
    </button>
  );
}
