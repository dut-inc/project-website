// The small Markdown subset the rules chat shows: paragraphs, "- " and "1. "
// lists, **bold**, *italics*, `code`, and links only to this site's own rule
// pages. Rule numbers the server resolved become links. Pure: runs in the
// browser and in tests. Nothing here produces raw HTML.

export type ChatInline =
  | { kind: "text"; text: string }
  | { kind: "strong" | "em"; children: ChatInline[] }
  | { kind: "code"; text: string }
  | { kind: "link"; text: string; href: string };

export type ChatBlock = { kind: "p"; lines: ChatInline[][] } | { kind: "ul" | "ol"; items: ChatInline[][] };

// 6.2.3, 4.3.5.II, 9.2.9.IIIa, G.20, 4.3. Not inside other numbers or words.
export const RULE_NUMBER = /(?<![\w.])((?:\d{1,2}|[A-Z])(?:\.\d+)+(?:\.[IVX]+[a-z]?)?)(?![\w])/g;

const INLINE = /\*\*(.+?)\*\*|(?<![\w*])\*(?!\s)([^*\n]+?)\*(?![\w*])|\[([^\]\n]+)\]\(([^)\s]+)\)|`([^`\n]+)`/g;

const SITE_LINK = /^\/board-games\/root(\/|$)/;

// numbers: printed rule number -> page href, for the numbers to link.
export function parseInline(text: string, numbers: Record<string, string> = {}): ChatInline[] {
  const out: ChatInline[] = [];
  let at = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > at) out.push(...withRuleLinks(text.slice(at, match.index), numbers));
    const [whole, strong, em, linkText, linkHref, code] = match;
    if (strong !== undefined) out.push({ kind: "strong", children: parseInline(strong, numbers) });
    else if (em !== undefined) out.push({ kind: "em", children: parseInline(em, numbers) });
    else if (linkText !== undefined) {
      // Only links into this site; anything else keeps its text and loses the URL.
      out.push(SITE_LINK.test(linkHref) ? { kind: "link", text: linkText, href: linkHref } : { kind: "text", text: linkText });
    } else if (code !== undefined) out.push({ kind: "code", text: code });
    else out.push({ kind: "text", text: whole });
    at = match.index + whole.length;
  }
  if (at < text.length) out.push(...withRuleLinks(text.slice(at), numbers));
  return out;
}

function withRuleLinks(text: string, numbers: Record<string, string>): ChatInline[] {
  const out: ChatInline[] = [];
  let at = 0;
  for (const match of text.matchAll(RULE_NUMBER)) {
    const href = numbers[match[1]];
    if (!href) continue;
    if (match.index > at) out.push({ kind: "text", text: text.slice(at, match.index) });
    out.push({ kind: "link", text: match[1], href });
    at = match.index + match[1].length;
  }
  if (at < text.length) out.push({ kind: "text", text: text.slice(at) });
  return out;
}

const BULLET = /^\s*[-*•]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;

export function parseChat(text: string, numbers: Record<string, string> = {}): ChatBlock[] {
  const blocks: ChatBlock[] = [];
  let paragraph: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;

  const flush = () => {
    if (paragraph.length) blocks.push({ kind: "p", lines: paragraph.map((line) => parseInline(line, numbers)) });
    if (list) blocks.push({ kind: list.kind, items: list.items.map((item) => parseInline(item, numbers)) });
    paragraph = [];
    list = null;
  };

  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    const kind = BULLET.test(line) ? "ul" : NUMBERED.test(line) ? "ol" : null;
    if (!line.trim()) flush();
    else if (kind) {
      if (paragraph.length || (list && list.kind !== kind)) flush();
      list ??= { kind, items: [] };
      list.items.push(line.replace(kind === "ul" ? BULLET : NUMBERED, ""));
    } else if (/^#{1,6}\s+/.test(line)) {
      flush();
      paragraph.push(`**${line.replace(/^#{1,6}\s+/, "")}**`);
      flush();
    } else if (list && /^\s{2,}\S/.test(raw)) {
      // A wrapped list item.
      list.items[list.items.length - 1] += ` ${line.trim()}`;
    } else {
      if (list) flush();
      paragraph.push(line.trim());
    }
  }
  flush();
  return blocks;
}
