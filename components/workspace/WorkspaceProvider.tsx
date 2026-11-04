"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { normalizePath, resolvePath } from "@/lib/workspace";

// Editor state for the Perpetual Studio shell. The URL is the source of truth
// for the active file: the active tab is always usePathname(), and tabs are
// just the list of routes the visitor has opened. Opening, switching and
// closing tabs all go through the Next.js router, so every page keeps a real
// URL, refreshes and deep links work, and closing a tab never touches a page.
//
// Like VS Code, a newly opened page starts as a temporary "preview" tab that
// the next newly opened page replaces in place; double-clicking the file or
// its tab keeps it open as a permanent tab.

type WorkspaceContextValue = {
  activeHref: string;
  tabs: string[];
  // The temporary tab, if any (replaced by the next page that's opened).
  preview: string | null;
  // True after the last tab was closed: the editor shows its empty state.
  isEmpty: boolean;
  // Call when a link to `href` is followed (explorer, quick open, welcome).
  noteOpen: (href: string) => void;
  // Make a tab permanent (double-click on its file or tab).
  pinTab: (href: string) => void;
  closeTab: (href: string) => void;
  collapsed: Set<string>;
  toggleFolder: (id: string) => void;
  setFolderOpen: (id: string, open: boolean) => void;
  collapseAll: (ids: string[]) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  quickOpen: boolean;
  setQuickOpen: (open: boolean) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const STORAGE_KEY = "perpetual-studio:workspace:v1";

type Stored = { tabs?: string[]; preview?: string | null; collapsed?: string[]; sidebarOpen?: boolean };

type Editors = { tabs: string[]; preview: string | null };

// Open `href`: switch to it if it already has a tab, otherwise it becomes the
// preview tab, taking the current preview's place if there is one.
function openEditor(editors: Editors, href: string): Editors {
  const { tabs, preview } = editors;
  if (tabs.includes(href)) return editors;
  if (preview && tabs.includes(preview)) {
    return { tabs: tabs.map((tab) => (tab === preview ? href : tab)), preview: href };
  }
  return { tabs: [...tabs, href], preview: href };
}

function readStored(): Stored {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Stored) : {};
  } catch {
    return {};
  }
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const activeHref = normalizePath(usePathname());

  const [editors, setEditors] = useState<Editors>({ tabs: [activeHref], preview: activeHref });
  const { tabs, preview } = editors;
  const [isEmpty, setIsEmpty] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  // Set while closing the last tab navigates home, so that arrival doesn't reopen a tab.
  const [arrivingEmpty, setArrivingEmpty] = useState(false);
  const [previousHref, setPreviousHref] = useState(activeHref);

  // Restore the previous session's tabs and layout. localStorage only exists
  // after hydration, so this has to run in an effect.
  useEffect(() => {
    const stored = readStored();
    /* eslint-disable react-hooks/set-state-in-effect */
    if (Array.isArray(stored.tabs)) {
      const restored = [...new Set(stored.tabs.filter((href): href is string => typeof href === "string").map(normalizePath))];
      const storedPreview = typeof stored.preview === "string" ? normalizePath(stored.preview) : null;
      // The page landed on opens like any other: as the preview unless it was already a tab.
      setEditors((current) =>
        current.tabs.reduce<Editors>((acc, href) => openEditor(acc, href), {
          tabs: restored,
          preview: storedPreview && restored.includes(storedPreview) ? storedPreview : null,
        }),
      );
    }
    if (Array.isArray(stored.collapsed)) {
      // Never hide the file the visitor just landed on.
      const revealed = new Set(resolvePath(window.location.pathname).folderIds);
      setCollapsed(new Set(stored.collapsed.filter((id) => !revealed.has(id))));
    }
    if (typeof stored.sidebarOpen === "boolean") setSidebarOpen(stored.sidebarOpen);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const value: Stored = { tabs, preview, collapsed: [...collapsed], sidebarOpen };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Storage can be unavailable (private mode, quota); the workspace still works.
    }
  }, [hydrated, tabs, preview, collapsed, sidebarOpen]);

  // Every route the visitor lands on — link, back/forward, deep link — is an
  // open tab, and its folders are revealed in the explorer. (State adjusted
  // during render when the route changes, as React recommends over an effect.)
  if (previousHref !== activeHref) {
    setPreviousHref(activeHref);
    setDrawerOpen(false);
    if (arrivingEmpty) {
      setArrivingEmpty(false);
    } else {
      setIsEmpty(false);
      setEditors((current) => openEditor(current, activeHref));
      const { folderIds } = resolvePath(activeHref);
      if (folderIds.some((id) => collapsed.has(id))) {
        const next = new Set(collapsed);
        folderIds.forEach((id) => next.delete(id));
        setCollapsed(next);
      }
    }
  }

  const noteOpen = useCallback((href: string) => {
    const target = normalizePath(href);
    setArrivingEmpty(false);
    setIsEmpty(false);
    setDrawerOpen(false);
    setEditors((current) => openEditor(current, target));
  }, []);

  const pinTab = useCallback((href: string) => {
    const target = normalizePath(href);
    setEditors((current) => ({
      tabs: current.tabs.includes(target) ? current.tabs : [...current.tabs, target],
      preview: current.preview === target ? null : current.preview,
    }));
  }, []);

  const closeTab = useCallback(
    (href: string) => {
      const index = tabs.indexOf(href);
      if (index === -1) return;
      const remaining = tabs.filter((tab) => tab !== href);
      setEditors({ tabs: remaining, preview: preview === href ? null : preview });

      // Closing a background tab leaves the current page alone.
      if (href !== activeHref || isEmpty) return;

      // Prefer the tab to the right, like most editors, then the one to the left.
      const next = remaining[index] ?? remaining[index - 1];
      if (next) {
        router.push(next);
      } else {
        setIsEmpty(true);
        if (activeHref !== "/") {
          setArrivingEmpty(true);
          router.push("/");
        }
      }
    },
    [tabs, preview, activeHref, isEmpty, router],
  );

  const toggleFolder = useCallback((id: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setFolderOpen = useCallback((id: string, open: boolean) => {
    setCollapsed((current) => {
      if (current.has(id) === !open) return current;
      const next = new Set(current);
      if (open) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const collapseAll = useCallback((ids: string[]) => setCollapsed(new Set(ids)), []);

  const toggleSidebar = useCallback(() => {
    // Below the desktop breakpoint the explorer is a drawer instead.
    if (window.matchMedia("(max-width: 767px)").matches) setDrawerOpen((open) => !open);
    else setSidebarOpen((open) => !open);
  }, []);

  // Editor shortcuts: Ctrl/Cmd+P quick open, Ctrl/Cmd+B toggle the explorer.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;
      const key = event.key.toLowerCase();
      if (key === "p") {
        event.preventDefault();
        setQuickOpen(true);
      } else if (key === "b" && !isTypingTarget(event.target)) {
        event.preventDefault();
        toggleSidebar();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleSidebar]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      activeHref,
      tabs: isEmpty ? [] : tabs,
      preview: isEmpty ? null : preview,
      isEmpty,
      noteOpen,
      pinTab,
      closeTab,
      collapsed,
      toggleFolder,
      setFolderOpen,
      collapseAll,
      sidebarOpen,
      toggleSidebar,
      drawerOpen,
      setDrawerOpen,
      quickOpen,
      setQuickOpen,
    }),
    [activeHref, tabs, preview, isEmpty, noteOpen, pinTab, closeTab, collapsed, toggleFolder, setFolderOpen, collapseAll, sidebarOpen, toggleSidebar, drawerOpen, quickOpen],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return context;
}
