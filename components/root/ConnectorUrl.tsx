"use client";

import { useEffect, useState } from "react";
import { MCP_PATH } from "@/lib/root/paths";

// The MCP server's full URL for this deployment, with a copy button. The
// origin is only known in the browser, so the first render shows the path.
export default function ConnectorUrl() {
  const [url, setUrl] = useState(MCP_PATH);
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    setUrl(`${window.location.origin}${MCP_PATH}`); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 2000);
  }

  return (
    <div className="flex max-w-2xl flex-wrap items-center gap-2">
      <code className="min-w-0 flex-1 select-all overflow-x-auto whitespace-nowrap rounded-md border border-studio-border bg-studio-chrome px-3 py-2.5 font-mono text-[14px] text-studio-bright">
        {url}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-live="polite"
        className="h-10 shrink-0 rounded-md bg-studio-accent px-4 text-sm font-medium text-white transition-colors hover:bg-[#1a8ad4]"
      >
        {state === "copied" ? "Copied" : state === "failed" ? "Select and copy" : "Copy URL"}
      </button>
    </div>
  );
}
