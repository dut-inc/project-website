"use client";

import Link from "next/link";
import { useEffect, useRef, type MouseEvent } from "react";
import { WORKSPACE_NAME, resolvePath } from "@/lib/workspace";
import { useWorkspace } from "./WorkspaceProvider";
import { ChevronIcon, CloseIcon, ItemIcon } from "./icons";

// One tab per opened route. Tabs are links (switching = navigating); the close
// control only removes the tab from the strip. The preview tab's name is in
// italics; double-clicking it keeps it open.

export default function EditorTabs() {
  const { tabs, preview, activeHref, isEmpty, closeTab, pinTab } = useWorkspace();
  const stripRef = useRef<HTMLDivElement>(null);

  const files = tabs.map((href) => resolvePath(href));
  const nameCounts = files.reduce<Record<string, number>>((acc, f) => ({ ...acc, [f.name]: (acc[f.name] ?? 0) + 1 }), {});
  const active = isEmpty ? null : resolvePath(activeHref);

  // Keep the active tab visible when the strip overflows.
  useEffect(() => {
    const strip = stripRef.current;
    const tab = strip?.querySelector<HTMLElement>("[aria-current='page']")?.parentElement;
    if (!strip || !tab) return;
    const { offsetLeft, offsetWidth } = tab;
    if (offsetLeft < strip.scrollLeft) strip.scrollLeft = offsetLeft;
    else if (offsetLeft + offsetWidth > strip.scrollLeft + strip.clientWidth) {
      strip.scrollLeft = offsetLeft + offsetWidth - strip.clientWidth;
    }
  }, [activeHref, tabs.length]);

  // Vertical wheel scrolls the strip sideways, as in desktop editors.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    function onWheel(event: WheelEvent) {
      if (!strip || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (strip.scrollWidth <= strip.clientWidth) return;
      strip.scrollLeft += event.deltaY;
      event.preventDefault();
    }
    strip.addEventListener("wheel", onWheel, { passive: false });
    return () => strip.removeEventListener("wheel", onWheel);
  }, []);

  function handleAuxClick(event: MouseEvent, href: string) {
    // Middle-click closes a tab.
    if (event.button !== 1) return;
    event.preventDefault();
    closeTab(href);
  }

  return (
    <div className="ps-tabs sticky z-30 border-b border-studio-border bg-studio-chrome" style={{ top: "var(--ps-titlebar-h)" }}>
      <div
        ref={stripRef}
        role="list"
        aria-label="Open editors"
        className="ps-scrollbar-thin flex h-[38px] overflow-x-auto overflow-y-hidden overscroll-x-contain"
      >
        {files.map((file) => {
          const isActive = file.href === activeHref && !isEmpty;
          const isPreview = file.href === preview;
          const folder = nameCounts[file.name] > 1 ? file.trail[file.trail.length - 1] : undefined;
          return (
            <div
              key={file.href}
              role="listitem"
              onAuxClick={(event) => handleAuxClick(event, file.href)}
              onMouseDown={(event) => event.button === 1 && event.preventDefault()}
              className={`group/tab relative flex h-full shrink-0 items-center border-r border-studio-border ${
                isActive ? "bg-studio-editor text-studio-bright" : "bg-studio-chrome text-studio-muted hover:bg-studio-hover hover:text-studio-text"
              }`}
            >
              {isActive && (
                <>
                  <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-studio-accent" />
                  {/* Let the active tab merge into the editor below it. */}
                  <span aria-hidden className="absolute inset-x-0 -bottom-px h-px bg-studio-editor" />
                </>
              )}
              <Link
                href={file.href}
                title={isPreview ? `${file.title} (preview — double-click to keep open)` : file.title}
                aria-current={isActive ? "page" : undefined}
                onDoubleClick={() => pinTab(file.href)}
                className="flex h-full max-w-[16rem] items-center gap-2 pl-3 pr-1 text-[13px] outline-none focus-visible:shadow-[inset_0_0_0_1px_theme(colors.studio.accent)]"
              >
                <ItemIcon icon={file.icon} tone={file.tone} className="h-4 w-4 shrink-0" />
                <span className={`truncate ${isPreview ? "pr-0.5 italic" : ""}`}>{file.name}</span>
                {isPreview && <span className="sr-only">(preview)</span>}
                {folder && <span className="truncate text-[11px] text-studio-muted">{folder}</span>}
              </Link>
              <button
                type="button"
                onClick={() => closeTab(file.href)}
                aria-label={`Close ${file.name}${folder ? ` (${folder})` : ""}`}
                title="Close (middle-click)"
                className={`mr-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-studio-muted outline-none hover:bg-white/10 hover:text-studio-bright focus-visible:opacity-100 focus-visible:shadow-[inset_0_0_0_1px_theme(colors.studio.accent)] max-md:h-8 max-md:w-8 ${
                  isActive ? "opacity-100" : "opacity-0 group-hover/tab:opacity-100 max-md:opacity-100"
                }`}
              >
                <CloseIcon />
              </button>
            </div>
          );
        })}
        <div aria-hidden className="min-w-4 flex-1" />
      </div>

      {active && (
        <nav
          aria-label="Breadcrumb"
          className="hidden h-7 items-center gap-1 overflow-hidden whitespace-nowrap border-t border-studio-border/60 bg-studio-editor px-4 text-[12px] text-studio-muted md:flex"
        >
          <ol className="flex min-w-0 items-center gap-1">
            {[WORKSPACE_NAME, ...active.trail].map((crumb) => (
              <li key={crumb} className="flex min-w-0 shrink items-center gap-1">
                <span className="truncate">{crumb}</span>
                <ChevronIcon className="h-3 w-3 shrink-0 opacity-60" />
              </li>
            ))}
            <li className="flex min-w-0 items-center gap-1.5 text-studio-text" aria-current="page">
              <ItemIcon icon={active.icon} tone={active.tone} className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{active.name}</span>
            </li>
          </ol>
        </nav>
      )}
    </div>
  );
}
