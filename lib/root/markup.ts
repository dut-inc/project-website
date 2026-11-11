// Parses the small markup used in extracted rule text (scripts/root/README.md):
//
//   *…*            italic reminder or clarification text, as printed
//   {item:boots}   an item icon
//   {icon}         an inline icon the extractor could not read
//   blank line     paragraph break
//   "a | b" lines  table rows
//
// Cross-references are found with the same patterns the extractor uses, and
// only become links when the record's own `cross_references` resolved them.
// Pure functions: no React and no rule data, so they can be unit tested.

export type Inline =
  | { kind: "text"; text: string; italic: boolean }
  | { kind: "item"; item: string; italic: boolean }
  | { kind: "icon"; italic: boolean }
  | { kind: "ref"; text: string; targetId: string; italic: boolean };

export type Block =
  | { kind: "paragraph"; content: Inline[] }
  | { kind: "table"; caption: Inline[] | null; rows: Inline[][][] };

export type CrossReference = { cited: string; target_id: string | null };

const APPENDIX_LETTERS = "ACGHKLMV";
// Mirrors XREF_RE, APPENDIX_REF_RE and BARE_CHAPTER_REF_RE in extract_law.py.
const XREF = new RegExp(
  String.raw`(?<![\w.])((?:\d{1,2}|[${APPENDIX_LETTERS}])(?:\.\d+)+)` +
    String.raw`(?:\.([IVX]+)([a-z])?)?` +
    String.raw`(?:([–-])([IVX]+)([a-z])?)?` +
    String.raw`(?!\w)`,
  "g",
);
const APPENDIX_REF = new RegExp(String.raw`\bAppendi(?:x|ces) ([${APPENDIX_LETTERS}])\b`, "g");
const BARE_CHAPTER_REF = /\((\d{1,2})\)/g;

type Span = { start: number; end: number; cited: string };

// Where each citation sits in `text`. A range such as 4.3.1.I–II yields two
// spans: "4.3.1.I" (cites 4.3.1.I) and "II" (cites 4.3.1.II).
export function citationSpans(text: string): Span[] {
  const spans: Span[] = [];
  for (const m of text.matchAll(XREF)) {
    const [whole, base, roman, letter, dash, romanEnd, letterEnd] = m;
    const start = m.index ?? 0;
    if (!roman) {
      spans.push({ start, end: start + base.length, cited: base });
      continue;
    }
    const first = `${base}.${roman}${letter ?? ""}`;
    spans.push({ start, end: start + first.length, cited: first });
    if (dash && romanEnd) {
      const endStart = start + first.length + dash.length;
      spans.push({ start: endStart, end: start + whole.length, cited: `${base}.${romanEnd}${letterEnd ?? ""}` });
    }
  }
  for (const m of text.matchAll(APPENDIX_REF)) {
    const start = m.index ?? 0;
    spans.push({ start, end: start + m[0].length, cited: m[1] });
  }
  for (const m of text.matchAll(BARE_CHAPTER_REF)) {
    const start = (m.index ?? 0) + 1;
    spans.push({ start, end: start + m[1].length, cited: m[1] });
  }
  spans.sort((a, b) => a.start - b.start);
  // Drop overlaps (keep the earliest).
  return spans.filter((span, i) => i === 0 || span.start >= spans[i - 1].end);
}

function linkText(text: string, italic: boolean, targets: Map<string, string>): Inline[] {
  const out: Inline[] = [];
  let at = 0;
  for (const span of citationSpans(text)) {
    const targetId = targets.get(span.cited);
    if (!targetId) continue;
    if (span.start > at) out.push({ kind: "text", text: text.slice(at, span.start), italic });
    out.push({ kind: "ref", text: text.slice(span.start, span.end), targetId, italic });
    at = span.end;
  }
  if (at < text.length) out.push({ kind: "text", text: text.slice(at), italic });
  return out;
}

const TOKEN = /\{item:([a-z]+)\}|\{icon\}/g;

// One line of marked-up text -> inline pieces.
export function parseInline(text: string, references: CrossReference[] = []): Inline[] {
  const targets = new Map(
    references.filter((r): r is { cited: string; target_id: string } => r.target_id !== null).map((r) => [r.cited, r.target_id]),
  );
  const out: Inline[] = [];
  text.split("*").forEach((run, index) => {
    const italic = index % 2 === 1;
    let at = 0;
    for (const m of run.matchAll(TOKEN)) {
      const start = m.index ?? 0;
      if (start > at) out.push(...linkText(run.slice(at, start), italic, targets));
      out.push(m[1] ? { kind: "item", item: m[1], italic } : { kind: "icon", italic });
      at = start + m[0].length;
    }
    if (at < run.length) out.push(...linkText(run.slice(at), italic, targets));
  });
  return out;
}

// A whole record's text -> paragraphs and tables.
export function parseBlocks(text: string, references: CrossReference[] = []): Block[] {
  const blocks: Block[] = [];
  for (const paragraph of text.split(/\n{2,}/)) {
    const lines = paragraph.split("\n").filter((line) => line.trim());
    let pending: string[] = [];
    const flush = () => {
      if (pending.length) blocks.push({ kind: "paragraph", content: parseInline(pending.join(" "), references) });
      pending = [];
    };
    let i = 0;
    while (i < lines.length) {
      if (!lines[i].includes(" | ")) {
        pending.push(lines[i]);
        i += 1;
        continue;
      }
      // A run of table rows. The plain line right before it is its caption
      // ("Viable Reach Sums", "Reach Values" in 5.2).
      const caption = pending.length ? pending.pop()! : null;
      flush();
      const rows: Inline[][][] = [];
      while (i < lines.length && lines[i].includes(" | ")) {
        rows.push(lines[i].split(" | ").map((cell) => parseInline(cell.trim(), references)));
        i += 1;
      }
      blocks.push({ kind: "table", caption: caption ? parseInline(caption, references) : null, rows });
    }
    flush();
  }
  return blocks;
}

// Text with the markup removed, for search and link previews.
// Table rows become "Lizard Cult: 2;" so a row's label and values stay together.
export function plainText(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      if (!line.includes(" | ")) return line;
      const [label, ...values] = line.split(" | ");
      return `${label}: ${values.join(", ")};`;
    })
    .join("\n")
    .replace(/\{item:([a-z]+)\}/g, "$1")
    .replace(/\{icon\}/g, "")
    .replace(/\*/g, "")
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
