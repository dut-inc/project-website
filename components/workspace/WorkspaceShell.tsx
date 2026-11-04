"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { WorkspaceProvider, useWorkspace } from "./WorkspaceProvider";
import TitleBar from "./TitleBar";
import Explorer from "./Explorer";
import EditorTabs from "./EditorTabs";
import EmptyEditor from "./EmptyEditor";
import QuickOpen from "./QuickOpen";

// The Perpetual Studio application frame: title bar, explorer sidebar, editor
// (tabs + the current route's page). Pages render unchanged
// inside the editor; the window stays the scroll container so their own
// scroll locks, portals and fixed-position dialogs keep working.

function Frame({ children }: { children: ReactNode }) {
  const { isEmpty, sidebarOpen, drawerOpen, setDrawerOpen } = useWorkspace();
  const sidebarRef = useRef<HTMLElement>(null);

  // Mobile drawer: focus moves into it on open, Escape closes it.
  useEffect(() => {
    if (!drawerOpen) return;
    const sidebar = sidebarRef.current;
    const target =
      sidebar?.querySelector<HTMLElement>("#explorer-tree [aria-current='page']") ??
      sidebar?.querySelector<HTMLElement>("[data-tree-item]");
    target?.focus({ preventScroll: false });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setDrawerOpen(false);
      document.querySelector<HTMLElement>("[aria-controls='ps-sidebar']")?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, setDrawerOpen]);

  return (
    <div className="ps-shell" data-sidebar={sidebarOpen ? "open" : "closed"} data-drawer={drawerOpen ? "open" : "closed"}>
      <a
        href="#editor"
        className="fixed left-2 top-2 z-[60] -translate-y-20 rounded-md bg-studio-accent px-3 py-2 text-sm font-medium text-white focus:translate-y-0"
      >
        Skip to editor
      </a>
      <TitleBar />

      <aside id="ps-sidebar" ref={sidebarRef} className="ps-sidebar border-r border-studio-border bg-studio-sidebar">
        <Explorer />
      </aside>
      {drawerOpen && (
        <button
          type="button"
          aria-label="Close file explorer"
          tabIndex={-1}
          className="fixed inset-0 z-[34] bg-black/50 md:hidden"
          style={{ top: "var(--ps-titlebar-h)" }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <div className="ps-editor">
        <EditorTabs />
        {isEmpty ? (
          <EmptyEditor />
        ) : (
          <main id="editor" tabIndex={-1} className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 outline-none sm:px-8">
            {children}
          </main>
        )}
      </div>

      <QuickOpen />
    </div>
  );
}

export default function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <Frame>{children}</Frame>
    </WorkspaceProvider>
  );
}
