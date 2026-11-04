"use client";

import Link from "next/link";
import { useWorkspace } from "./WorkspaceProvider";
import { LogoMark } from "./icons";

// Shown when every tab has been closed.
export default function EmptyEditor() {
  const { setQuickOpen, toggleSidebar, noteOpen } = useWorkspace();

  const actions = [
    { label: "Go to file", keys: ["Ctrl", "P"], onClick: () => setQuickOpen(true) },
    { label: "Toggle explorer", keys: ["Ctrl", "B"], onClick: toggleSidebar },
  ];

  return (
    <section
      id="editor"
      aria-label="No open editors"
      className="flex min-h-[calc(100vh-var(--ps-titlebar-h)-40px)] flex-col items-center justify-center px-6 py-16 text-center"
    >
      <LogoMark className="h-20 w-20 opacity-40 grayscale-[35%]" />
      <h1 className="mt-6 font-display text-3xl italic tracking-tight text-studio-text">Perpetual Studio</h1>
      <p className="mt-2 text-sm text-studio-muted">No open editors. Pick a file from the explorer, or:</p>

      <ul className="mt-8 w-full max-w-xs space-y-1 text-[13px]">
        {actions.map((action) => (
          <li key={action.label}>
            <button
              type="button"
              onClick={action.onClick}
              className="flex w-full items-center justify-between gap-6 rounded-md px-3 py-2 text-studio-text outline-none hover:bg-studio-hover focus-visible:shadow-[inset_0_0_0_1px_theme(colors.studio.accent)]"
            >
              <span>{action.label}</span>
              <span className="flex gap-1">
                {action.keys.map((key) => (
                  <kbd key={key} className="rounded border border-studio-border bg-studio-chrome px-1.5 py-0.5 font-mono text-[11px] text-studio-muted">
                    {key}
                  </kbd>
                ))}
              </span>
            </button>
          </li>
        ))}
        <li>
          <Link
            href="/"
            onClick={() => noteOpen("/")}
            className="flex w-full items-center justify-between gap-6 rounded-md px-3 py-2 text-studio-text outline-none hover:bg-studio-hover focus-visible:shadow-[inset_0_0_0_1px_theme(colors.studio.accent)]"
          >
            <span>Open welcome.md</span>
            <span aria-hidden className="text-studio-muted">→</span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
