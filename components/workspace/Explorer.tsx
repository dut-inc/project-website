"use client";

import Link from "next/link";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import {
  ALL_FOLDER_IDS,
  WORKSPACE_NAME,
  WORKSPACE_TREE,
  resolvePath,
  type FileIcon,
  type WorkspaceFolder,
  type WorkspaceNode,
} from "@/lib/workspace";
import { useWorkspace } from "./WorkspaceProvider";
import { ChevronIcon, CollapseAllIcon, FileTypeIcon, FolderIcon } from "./icons";

// The left sidebar: the site's primary navigation, drawn as a file tree.
// Every row is a real link to its route. A folder's name opens its section
// page; its chevron (or Left/Right) expands and collapses it. One click opens
// a page in the preview tab; a double-click keeps it as a permanent tab.

const INDENT = 12;
const ROW =
  "group relative flex h-[26px] w-full items-center gap-1.5 pr-2 text-left text-[13px] leading-normal outline-none transition-colors duration-75 " +
  "focus-visible:bg-studio-focus focus-visible:shadow-[inset_0_0_0_1px_theme(colors.studio.accent)] max-md:h-9 max-md:text-[14px]";

// Up/Down move between visible rows, Left/Right collapse/expand folders, Home/End jump.
function handleTreeKeys(event: KeyboardEvent<HTMLElement>) {
  const keys = ["ArrowDown", "ArrowUp", "Home", "End", "ArrowLeft", "ArrowRight"];
  if (!keys.includes(event.key)) return;
  const items = [...event.currentTarget.querySelectorAll<HTMLElement>("[data-tree-item]")];
  const current = document.activeElement as HTMLElement | null;
  const index = current ? items.indexOf(current) : -1;
  if (index === -1) return;

  const focusAt = (i: number) => items[Math.max(0, Math.min(items.length - 1, i))]?.focus();

  if (event.key === "ArrowDown") focusAt(index + 1);
  else if (event.key === "ArrowUp") focusAt(index - 1);
  else if (event.key === "Home") focusAt(0);
  else if (event.key === "End") focusAt(items.length - 1);
  else {
    const isFolder = current?.dataset.treeFolder !== undefined;
    const expanded = current?.getAttribute("aria-expanded") === "true";
    const toggle = () => current?.parentElement?.querySelector<HTMLElement>("[data-tree-toggle]")?.click();
    if (event.key === "ArrowRight") {
      if (isFolder && !expanded) toggle();
      else if (isFolder) focusAt(index + 1);
      else return;
    } else {
      if (isFolder && expanded) toggle();
      else {
        // Jump to the parent folder.
        const depth = Number(current?.dataset.depth ?? 0);
        const parent = items.slice(0, index).reverse().find((item) => Number(item.dataset.depth) < depth);
        if (parent) parent.focus();
        else return;
      }
    }
  }
  event.preventDefault();
}

function SectionHeader({
  label,
  open,
  onToggle,
  actions,
  controls,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  actions?: ReactNode;
  controls: string;
}) {
  return (
    <div className="group/section flex h-[22px] items-center pr-1 max-md:h-9">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={controls}
        className="flex h-full min-w-0 flex-1 items-center gap-0.5 pl-1 text-left font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-studio-text outline-none focus-visible:shadow-[inset_0_0_0_1px_theme(colors.studio.accent)]"
      >
        <ChevronIcon className={`h-3.5 w-3.5 shrink-0 transition-transform duration-100 ${open ? "rotate-90" : ""}`} />
        <span className="truncate">{label}</span>
      </button>
      {actions}
    </div>
  );
}

function FileRow({
  href,
  name,
  icon,
  depth,
  title,
}: {
  href: string;
  name: string;
  icon: FileIcon;
  depth: number;
  title?: string;
}) {
  const { activeHref, tabs, noteOpen, pinTab } = useWorkspace();
  const isActive = href === activeHref && tabs.includes(href);
  const isOpen = tabs.includes(href);
  // The active page lives inside this file (e.g. a rule page in root.law).
  const containsActive = !isActive && tabs.includes(activeHref) && resolvePath(activeHref).owner === href;

  return (
    <div className={`group/row relative ${isActive ? "bg-studio-selected" : "hover:bg-studio-hover"}`}>
      {isActive && <span aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-studio-accent" />}
      <Link
        href={href}
        data-tree-item
        data-depth={depth}
        title={title}
        aria-current={isActive ? "page" : undefined}
        onClick={(event) => {
          // The second click of a double-click: the page is already open.
          if (event.detail > 1) return event.preventDefault();
          noteOpen(href);
        }}
        onDoubleClick={() => pinTab(href)}
        className={`${ROW} ${isActive || containsActive ? "text-studio-bright" : "text-studio-text"}`}
        style={{ paddingLeft: 8 + depth * INDENT + 16 }}
      >
        <FileTypeIcon icon={icon} className="h-4 w-4 shrink-0" />
        <span className="truncate">{name}</span>
        {containsActive ? (
          <span aria-hidden className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-studio-accent" />
        ) : (
          isOpen &&
          !isActive && (
            <span aria-label="open in a tab" className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-studio-muted/70" />
          )
        )}
      </Link>
    </div>
  );
}

function FolderRow({ folder, depth }: { folder: WorkspaceFolder; depth: number }) {
  const { collapsed, toggleFolder, setFolderOpen, tabs, activeHref, noteOpen, pinTab } = useWorkspace();
  const groupId = `explorer-${folder.id.replace(/[^a-z0-9-]/gi, "-")}`;
  const isActive = folder.href === activeHref && tabs.includes(folder.href);
  const isOpenTab = tabs.includes(folder.href);
  // Collapsed folders still show that the active file lives inside them.
  const containsActive =
    !isActive && resolvePath(activeHref).folderIds.includes(folder.id) && tabs.includes(activeHref);

  // Open tabs for dynamic files (e.g. The Pack rooms) appear under their folder.
  const dynamicFiles = folder.dynamic
    ? tabs.filter((href) => href.startsWith(folder.dynamic!.prefix)).map((href) => resolvePath(href))
    : [];
  const hasChildren = folder.children.length > 0 || dynamicFiles.length > 0;
  const open = hasChildren && !collapsed.has(folder.id);

  return (
    <li>
      <div className={`group/row relative ${isActive ? "bg-studio-selected" : "hover:bg-studio-hover"}`}>
        {isActive && <span aria-hidden className="absolute inset-y-0 left-0 z-10 w-[2px] bg-studio-accent" />}
        <Link
          href={folder.href}
          data-tree-item
          data-tree-folder={hasChildren ? "" : undefined}
          data-depth={depth}
          title={resolvePath(folder.href).title}
          aria-current={isActive ? "page" : undefined}
          aria-expanded={hasChildren ? open : undefined}
          aria-controls={hasChildren && open ? groupId : undefined}
          onClick={(event) => {
            // The second click of a double-click only keeps the tab (below).
            if (event.detail > 1) return event.preventDefault();
            // Clicking the folder you're already on folds it, like a plain folder.
            if (isActive && hasChildren) {
              event.preventDefault();
              toggleFolder(folder.id);
              return;
            }
            noteOpen(folder.href);
            setFolderOpen(folder.id, true);
          }}
          onDoubleClick={() => pinTab(folder.href)}
          className={`${ROW} ${isActive || (containsActive && !open) ? "text-studio-bright" : "text-studio-text"}`}
          style={{ paddingLeft: 8 + depth * INDENT + 20 }}
        >
          <FolderIcon tone={folder.tone} open={open} className="h-4 w-4 shrink-0" />
          <span className="truncate">{folder.name}</span>
          {containsActive && !open ? (
            <span aria-hidden className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-studio-accent" />
          ) : (
            isOpenTab &&
            !isActive && (
              <span aria-label="open in a tab" className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-studio-muted/70" />
            )
          )}
        </Link>
        {hasChildren && (
          <button
            type="button"
            data-tree-toggle
            tabIndex={-1}
            onClick={() => toggleFolder(folder.id)}
            aria-label={`${open ? "Collapse" : "Expand"} ${folder.name}`}
            aria-expanded={open}
            className="absolute inset-y-0 flex w-5 items-center justify-center rounded-sm text-studio-muted outline-none hover:bg-white/10 hover:text-studio-bright max-md:w-7"
            style={{ left: 8 + depth * INDENT - 3 }}
          >
            <ChevronIcon className={`h-3.5 w-3.5 shrink-0 transition-transform duration-100 ${open ? "rotate-90" : ""}`} />
          </button>
        )}
      </div>
      {open && (
        <ul id={groupId} className="relative">
          {/* Indent guide */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-px bg-studio-border/80"
            style={{ left: 8 + depth * INDENT + 7 }}
          />
          {folder.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
          {dynamicFiles.map((file) => (
            <li key={file.href}>
              <FileRow href={file.href} name={file.name} icon={file.icon} title={file.title} depth={depth + 1} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function TreeNode({ node, depth }: { node: WorkspaceNode; depth: number }) {
  if (node.kind === "folder") return <FolderRow folder={node} depth={depth} />;
  return (
    <li>
      <FileRow href={node.href} name={node.name} icon={node.icon} title={node.title} depth={depth} />
    </li>
  );
}

export default function Explorer() {
  const { collapseAll } = useWorkspace();
  const [treeShown, setTreeShown] = useState(true);

  return (
    <nav aria-label="File explorer" className="flex h-full flex-col" onKeyDown={handleTreeKeys}>
      <div className="flex h-9 shrink-0 items-center px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-studio-muted">
        Explorer
      </div>

      <div className="flex min-h-0 flex-1 flex-col border-t border-studio-border/60">
        <SectionHeader
          label={WORKSPACE_NAME}
          open={treeShown}
          onToggle={() => setTreeShown((v) => !v)}
          controls="explorer-tree"
          actions={
            <button
              type="button"
              onClick={() => collapseAll(ALL_FOLDER_IDS)}
              aria-label="Collapse all folders"
              title="Collapse all folders"
              className="flex h-5 w-5 items-center justify-center rounded text-studio-muted opacity-0 outline-none hover:bg-white/10 hover:text-studio-bright focus-visible:opacity-100 focus-visible:shadow-[inset_0_0_0_1px_theme(colors.studio.accent)] group-hover/section:opacity-100 max-md:h-8 max-md:w-8 max-md:opacity-100"
            >
              <CollapseAllIcon />
            </button>
          }
        />
        {treeShown && (
          <ul id="explorer-tree" className="min-h-0 flex-1 overflow-y-auto pb-4">
            {WORKSPACE_TREE.map((node) => (
              <TreeNode key={node.id} node={node} depth={0} />
            ))}
          </ul>
        )}
      </div>
    </nav>
  );
}
