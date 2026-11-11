import { DLE_GAMES } from "@/lib/dleGames";
import { MEMBERS } from "@/lib/members";
import { getProject, type ProjectId } from "@/lib/projects";
import { ROOT_HREF, encyclopediaPageName } from "@/lib/root/paths";

// The Perpetual Studio explorer: which "files" and "folders" exist and which
// real route each file opens. Every folder is itself a page: its name opens the
// section's index route. Folder titles come from lib/projects.ts; the file
// names are a navigation metaphor, not source filenames. Icons are only
// referenced by kind here (drawn in components/workspace/icons.tsx), so the
// look can change without touching routing.

export type FileIcon =
  | "welcome"
  | "quiz"
  | "live"
  | "notebook"
  | "table"
  | "model"
  | "map"
  | "rank"
  | "cards"
  | "puzzle"
  | "person"
  | "law"
  | "file";

export type FolderTone = "teal" | "orange" | "green" | "sand" | "red" | "violet" | "gold" | "blue";

export type WorkspaceFile = {
  kind: "file";
  id: string;
  name: string;
  href: string;
  icon: FileIcon;
  // Human title, used by quick open and the welcome page.
  title: string;
  // Names the routes under this file's href (e.g. root.law's rule pages).
  // They open in tabs but are not listed in the explorer.
  pages?: (rest: string) => { name: string; title: string };
};

// Files that only exist while open, e.g. a specific The Pack room.
type DynamicFiles = {
  prefix: string;
  name: (slug: string) => string;
  title: (slug: string) => string;
  icon: FileIcon;
};

export type WorkspaceFolder = {
  kind: "folder";
  id: string;
  name: string;
  // The section's own page, opened by clicking the folder.
  href: string;
  tone: FolderTone;
  projectId: ProjectId;
  children: WorkspaceNode[];
  dynamic?: DynamicFiles;
};

export type WorkspaceNode = WorkspaceFile | WorkspaceFolder;

export const WORKSPACE_NAME = "perpetual-studio";

function file(
  name: string,
  href: string,
  icon: FileIcon,
  title: string,
  pages?: WorkspaceFile["pages"],
): WorkspaceFile {
  return { kind: "file", id: `file:${href}`, name, href, icon, title, pages };
}

function folder(
  projectId: ProjectId,
  tone: FolderTone,
  children: WorkspaceNode[],
  dynamic?: DynamicFiles,
): WorkspaceFolder {
  const project = getProject(projectId);
  return {
    kind: "folder",
    id: `folder:${projectId}`,
    name: project.title,
    href: project.href,
    tone,
    projectId,
    children,
    dynamic,
  };
}

// Top-level order follows lib/projects.ts. Every href here is an existing route.
export const WORKSPACE_TREE: WorkspaceNode[] = [
  folder("fish-stuff", "teal", [
    file("which-fish-are-you.quiz", "/fish-stuff/personality", "quiz", "Which Pacific Northwest Fish Are You?"),
  ]),
  folder("sports", "orange", [
    file("seattle-dashboard.live", "/sports/dashboard", "live", "Seattle Sports Dashboard"),
    file("offensive-archetypes.ipynb", "/sports/offensive-profiles", "notebook", "Offensive Archetypes"),
    file("nba-standings-pool.csv", "/sports/nba-standings", "table", "NBA Standings Pool"),
    file("behind-the-plate.model", "/sports/pitch-predictor", "model", "Behind the Plate"),
  ]),
  folder("conservation", "green", [
    file("sighting-map.geojson", "/conservation/sightings", "map", "Shared Sighting Map"),
  ]),
  folder("board", "sand", []),
  // The Pack (nested under Board Games in lib/projects.ts) is a regular file
  // here; open rooms appear next to it while their tab is open.
  folder(
    "board-games",
    "red",
    [
      file("the-pack.deal", getProject("the-pack").href, "cards", "The Pack"),
      file("tier-list.rank", "/board-games/tierlist", "rank", "Board Games Tier List"),
      file("root.law", ROOT_HREF, "law", "Root Assistant", encyclopediaPageName),
    ],
    {
      prefix: `${getProject("the-pack").href}/room/`,
      name: (code) => `room-${code}.deal`,
      title: (code) => `The Pack — room ${code}`,
      icon: "cards",
    },
  ),
  folder("dle", "violet", [
    ...DLE_GAMES.map((game) => file(`${game.file}.dle`, `/dle/${game.slug}`, "puzzle", game.title)),
  ]),
  folder(
    "about-us",
    "blue",
    MEMBERS.map((member) => file(`${member.slug}.md`, `/about-us/${member.slug}`, "person", member.name)),
  ),
  file("welcome.md", "/", "welcome", "Welcome to Perpetual Studio"),
];

export type ResolvedFile = {
  href: string;
  name: string;
  title: string;
  icon: FileIcon;
  // Set when the page is a folder's own page; its icon is that folder.
  tone?: FolderTone;
  // Folder ids to reveal for this page (for a folder page, including itself),
  // and the names of the folders that contain it.
  folderIds: string[];
  trail: string[];
  // Present for files that only exist while open (rendered under folderIds' last folder).
  dynamic?: boolean;
  // For a page inside a file (see WorkspaceFile.pages): that file's href.
  owner?: string;
  // False for routes the explorer doesn't know (e.g. a 404).
  known: boolean;
};

export function normalizePath(pathname: string | null | undefined): string {
  if (!pathname) return "/";
  const path = pathname.split(/[?#]/)[0];
  return path.length > 1 ? path.replace(/\/+$/, "") || "/" : path || "/";
}

type Located = { file: WorkspaceFile; folders: WorkspaceFolder[] };

function collectFiles(nodes: WorkspaceNode[], folders: WorkspaceFolder[], out: Located[]) {
  for (const node of nodes) {
    if (node.kind === "file") out.push({ file: node, folders });
    else collectFiles(node.children, [...folders, node], out);
  }
  return out;
}

function collectFolders(nodes: WorkspaceNode[], folders: WorkspaceFolder[], out: WorkspaceFolder[][]) {
  for (const node of nodes) {
    if (node.kind === "folder") {
      const path = [...folders, node];
      out.push(path);
      collectFolders(node.children, path, out);
    }
  }
  return out;
}

const LOCATED_FILES = collectFiles(WORKSPACE_TREE, [], []);
const FOLDER_PATHS = collectFolders(WORKSPACE_TREE, [], []);

export const ALL_FOLDER_IDS = FOLDER_PATHS.map((path) => path[path.length - 1].id);

function resolveFile({ file: f, folders }: Located): ResolvedFile {
  return {
    href: f.href,
    name: f.name,
    title: f.title,
    icon: f.icon,
    folderIds: folders.map((x) => x.id),
    trail: folders.map((x) => x.name),
    known: true,
  };
}

function resolveFolder(path: WorkspaceFolder[]): ResolvedFile {
  const self = path[path.length - 1];
  return {
    href: self.href,
    name: self.name,
    title: self.name,
    icon: "file",
    tone: self.tone,
    folderIds: path.map((x) => x.id),
    trail: path.slice(0, -1).map((x) => x.name),
    known: true,
  };
}

// Every static page (folders first, in tree order) with its folder trail —
// quick open and the welcome page use this.
export function workspaceFiles(): ResolvedFile[] {
  const out: ResolvedFile[] = [];
  const walk = (nodes: WorkspaceNode[], folders: WorkspaceFolder[]) => {
    for (const node of nodes) {
      if (node.kind === "file") out.push(resolveFile({ file: node, folders }));
      else {
        const path = [...folders, node];
        out.push(resolveFolder(path));
        walk(node.children, path);
      }
    }
  };
  walk(WORKSPACE_TREE, []);
  return out;
}

export function resolvePath(pathname: string): ResolvedFile {
  const href = normalizePath(pathname);

  const match = LOCATED_FILES.find(({ file: f }) => f.href === href);
  if (match) return resolveFile(match);

  const folderPath = FOLDER_PATHS.find((path) => path[path.length - 1].href === href);
  if (folderPath) return resolveFolder(folderPath);

  const parentFile = LOCATED_FILES.find(({ file: f }) => f.pages && href.startsWith(`${f.href}/`));
  if (parentFile?.file.pages) {
    const { name, title } = parentFile.file.pages(href.slice(parentFile.file.href.length + 1));
    return {
      href,
      name,
      title,
      icon: parentFile.file.icon,
      folderIds: parentFile.folders.map((x) => x.id),
      trail: [...parentFile.folders.map((x) => x.name), parentFile.file.name],
      owner: parentFile.file.href,
      known: true,
    };
  }

  for (const path of FOLDER_PATHS) {
    const owner = path[path.length - 1];
    const dynamic = owner.dynamic;
    if (!dynamic || !href.startsWith(dynamic.prefix)) continue;
    const slug = decodeURIComponent(href.slice(dynamic.prefix.length).split("/")[0] ?? "");
    if (!slug) continue;
    return {
      href,
      name: dynamic.name(slug),
      title: dynamic.title(slug),
      icon: dynamic.icon,
      folderIds: path.map((x) => x.id),
      trail: path.map((x) => x.name),
      dynamic: true,
      known: true,
    };
  }

  const last = href.split("/").filter(Boolean).pop();
  return {
    href,
    name: last ? decodeURIComponent(last) : "untitled",
    title: last ? decodeURIComponent(last) : "Untitled",
    icon: "file",
    folderIds: [],
    trail: [],
    known: false,
  };
}

// The folder a page lives in (a section page's parent is the folder above
// it), used for the "back" link in page headers. Top-level pages go back to
// welcome.md.
export function parentOf(pathname: string): { href: string; label: string } {
  const page = resolvePath(pathname);
  const ancestors = page.tone ? page.folderIds.slice(0, -1) : page.folderIds;
  const parentId = ancestors[ancestors.length - 1];
  const parent = FOLDER_PATHS.map((path) => path[path.length - 1]).find((f) => f.id === parentId);
  return parent ? { href: parent.href, label: parent.name } : { href: "/", label: "welcome.md" };
}
