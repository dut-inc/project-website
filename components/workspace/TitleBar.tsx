"use client";

import Link from "next/link";
import { useWorkspace } from "./WorkspaceProvider";
import { LogoMark, MenuIcon, SearchIcon, SidebarIcon } from "./icons";

const ICON_BUTTON =
  "flex h-8 w-8 items-center justify-center rounded-md text-studio-muted outline-none transition-colors hover:bg-white/[0.07] hover:text-studio-bright focus-visible:shadow-[inset_0_0_0_1px_theme(colors.studio.accent)] max-md:h-10 max-md:w-10";

export default function TitleBar() {
  const { drawerOpen, setDrawerOpen, sidebarOpen, toggleSidebar, setQuickOpen, noteOpen } = useWorkspace();

  return (
    <header
      className="ps-titlebar fixed inset-x-0 top-0 z-40 flex items-center gap-2 border-b border-studio-border bg-studio-titlebar px-2 md:px-3"
      style={{ height: "var(--ps-titlebar-h)" }}
    >
      <button
        type="button"
        className={`${ICON_BUTTON} md:hidden`}
        onClick={() => setDrawerOpen(!drawerOpen)}
        aria-label={drawerOpen ? "Close file explorer" : "Open file explorer"}
        aria-expanded={drawerOpen}
        aria-controls="ps-sidebar"
      >
        <MenuIcon />
      </button>

      <Link
        href="/"
        onClick={() => noteOpen("/")}
        className="flex shrink-0 items-center gap-2 rounded-md px-1 py-1 outline-none focus-visible:shadow-[inset_0_0_0_1px_theme(colors.studio.accent)]"
      >
        <LogoMark className="h-[22px] w-[22px]" />
        <span className="font-display text-[17px] italic leading-none tracking-tight text-studio-bright">
          Perpetual <span className="text-studio-link">Studio</span>
        </span>
      </Link>

      <div className="flex flex-1 justify-center px-2 max-md:hidden">
        <button
          type="button"
          onClick={() => setQuickOpen(true)}
          className="flex h-7 w-full max-w-md items-center gap-2 rounded-md border border-studio-border bg-studio-chrome px-2.5 text-[12px] text-studio-muted outline-none transition-colors hover:border-studio-muted/50 hover:text-studio-text focus-visible:border-studio-accent"
          aria-keyshortcuts="Control+P Meta+P"
        >
          <SearchIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate text-left">Search files in perpetual-studio</span>
          <kbd className="font-mono text-[10px] tracking-wide text-studio-muted/80">Ctrl P</kbd>
        </button>
      </div>

      <div className="ml-auto flex items-center gap-0.5 md:ml-0">
        <button type="button" className={`${ICON_BUTTON} md:hidden`} onClick={() => setQuickOpen(true)} aria-label="Search files">
          <SearchIcon />
        </button>
        <button
          type="button"
          className={`${ICON_BUTTON} max-md:hidden`}
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Hide file explorer" : "Show file explorer"}
          aria-pressed={sidebarOpen}
          aria-keyshortcuts="Control+B Meta+B"
          title={`${sidebarOpen ? "Hide" : "Show"} explorer (Ctrl+B)`}
        >
          <SidebarIcon open={sidebarOpen} />
        </button>
      </div>
    </header>
  );
}
