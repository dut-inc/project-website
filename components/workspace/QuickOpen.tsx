"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { workspaceFiles } from "@/lib/workspace";
import { useWorkspace } from "./WorkspaceProvider";
import { ItemIcon, SearchIcon } from "./icons";

// "Go to file": type to filter every page in the workspace, Enter opens it.

const FILES = workspaceFiles();

function score(query: string, haystack: string) {
  if (!query) return 1;
  const text = haystack.toLowerCase();
  const direct = text.indexOf(query);
  if (direct !== -1) return 100 - direct;
  // Fall back to an in-order subsequence match ("nbapool" → nba-standings-pool).
  let i = 0;
  for (const char of text) if (char === query[i]) i += 1;
  return i === query.length ? 10 : 0;
}

export default function QuickOpen() {
  const { quickOpen } = useWorkspace();
  // Mounted fresh on each open, so the query and selection start empty.
  return quickOpen ? <QuickOpenDialog /> : null;
}

function QuickOpenDialog() {
  const router = useRouter();
  const { setQuickOpen, noteOpen } = useWorkspace();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FILES.map((file) => ({
      file,
      score: Math.max(score(q, file.name), score(q, file.title), score(q, file.trail.join(" ")) - 5, score(q, file.href) - 5),
    }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.file);
  }, [query]);

  // Focus the input on open; hand focus back to where it was on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  function open(href: string) {
    setQuickOpen(false);
    noteOpen(href);
    router.push(href);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      setQuickOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected((i) => Math.min(results.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter" && results[selected]) {
      event.preventDefault();
      open(results[selected].href);
    } else if (event.key === "Tab") {
      // Keep focus inside the dialog.
      event.preventDefault();
    }
  }

  const activeId = results[selected] ? `quick-open-${selected}` : undefined;

  return (
    <div className="fixed inset-0 z-[45] flex justify-center bg-black/40 px-3 pt-[12vh] md:pt-16" onMouseDown={() => setQuickOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Go to file"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
        className="h-fit w-full max-w-xl overflow-hidden rounded-lg border border-studio-border bg-studio-chrome shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)]"
      >
        <div className="flex items-center gap-2 border-b border-studio-border px-3">
          <SearchIcon className="h-4 w-4 shrink-0 text-studio-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(0);
            }}
            placeholder="Go to file…"
            role="combobox"
            aria-expanded="true"
            aria-controls="quick-open-list"
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            className="h-11 min-w-0 flex-1 bg-transparent text-[14px] text-studio-bright placeholder:text-studio-muted focus:outline-none"
            style={{ outline: "none" }}
          />
          <kbd className="hidden rounded border border-studio-border px-1.5 py-0.5 font-mono text-[10px] text-studio-muted sm:inline">Esc</kbd>
        </div>
        <ul id="quick-open-list" role="listbox" aria-label="Files" className="max-h-[min(24rem,60vh)] overflow-y-auto py-1">
          {results.length === 0 && <li className="px-4 py-3 text-[13px] text-studio-muted">No matching files</li>}
          {results.map((file, index) => (
            <li
              key={file.href}
              id={`quick-open-${index}`}
              role="option"
              aria-selected={index === selected}
              onMouseMove={() => setSelected(index)}
              onClick={() => open(file.href)}
              className={`flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-[13px] max-md:py-2.5 ${
                index === selected ? "bg-studio-selected text-studio-bright" : "text-studio-text"
              }`}
            >
              <ItemIcon icon={file.icon} tone={file.tone} className="h-4 w-4 shrink-0" />
              <span className="shrink-0">{file.name}</span>
              <span className="truncate text-[12px] text-studio-muted">
                {file.title}
                {file.trail.length > 0 && <> · {file.trail.join(" / ")}</>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
