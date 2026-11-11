"""Extract the Law of Root PDF into reviewable, structured JSON.

Usage (from the project root):

    .venv/Scripts/python scripts/root/extract_law.py \
        --pdf public/data/root/Root_2025_Law.pdf \
        --version 2025-10-13 \
        --out data/root/law-2025-10-13

Only facts printed in the PDF are written here (numbers, titles, text, pages,
faction icons, explicit cross-references). Editorial data (topics, related
rules, verification status, notes) lives in separate files so that a
re-import never overwrites human review.

See scripts/root/README.md for the full workflow.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

import pymupdf

EXTRACTOR_VERSION = "0.1.1"

# --- Font conventions observed in the October 13, 2025 Law ----------------

BODY_FONT = "BaskervilleTenPro"
CHAPTER_FONT = "Luminari-Regular"
FACTION_ICON_FONT = "RootFactionFontRegular"
ITEM_ICON_FONT = "GearIcons"

NUMBER_SIZE = 6.0  # rule numbers ("1.1.1", "I", "a") are set in 6pt
SECTION_NUMBER_SIZE = 12.0  # "2.3 " before a section title
SECTION_TITLE_SIZE = 14.0
DIVIDER_SIZE = 23.8  # "APPENDICES", "CREDITS", "INDEX", "KEY RULES"

# GearIcons letters, identified by rendering each glyph (see README).
ITEM_GLYPHS = {
    "M": "boots",
    "B": "bag",
    "C": "crossbow",
    "H": "hammer",
    "S": "sword",
    "T": "tea",
    "X": "coins",
    "F": "torch",
}

# Pages (1-based) that hold rules. Page 1 is the cover/table of contents;
# processing stops at the CREDITS divider (index and key-rules summary follow).
FIRST_RULE_PAGE = 2

# --- Patterns ---------------------------------------------------------------

CHAPTER_KEY = r"(?:\d{1,2}|[A-Z])"
RULE_NUMBER_RE = re.compile(rf"^{CHAPTER_KEY}(?:\.\d+)+$")
ROMAN_RE = re.compile(r"^[IVX]+$")
LETTER_RE = re.compile(r"^[a-z]$")
SECTION_NUMBER_RE = re.compile(rf"^({CHAPTER_KEY}\.\d+)\s*$")
CHAPTER_HEADING_RE = re.compile(rf"^({CHAPTER_KEY})\.\s+(.+?)\s*$")

APPENDIX_LETTERS = "ACGHKLMV"
# A citation such as 4.3, 9.2.9.IIIa, G.20 or 4.3.1.I–II.
XREF_RE = re.compile(
    rf"(?<![\w.])((?:\d{{1,2}}|[{APPENDIX_LETTERS}])(?:\.\d+)+)"
    r"(?:\.([IVX]+)([a-z])?)?"
    r"(?:[–-]([IVX]+)([a-z])?)?"
    r"(?![\w])"
)
APPENDIX_REF_RE = re.compile(rf"\bAppendi(?:x|ces) ([{APPENDIX_LETTERS}])\b")
BARE_CHAPTER_REF_RE = re.compile(r"\((\d{1,2})\)")

LIGATURES = {"ﬀ": "ff", "ﬁ": "fi", "ﬂ": "fl", "ﬃ": "ffi", "ﬄ": "ffl"}
ROMANS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]


# --- Helpers ----------------------------------------------------------------


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def number_to_id(prefix: str, number: str) -> str:
    """'9.2.9.IIIa' -> 'rule-9-2-9-iii-a'; 'G.20' -> 'rule-g-20'."""
    parts = []
    for part in number.split("."):
        m = re.fullmatch(r"([IVX]+)([a-z])", part)
        parts.extend([m.group(1), m.group(2)] if m else [part])
    return f"{prefix}-" + "-".join(p.lower() for p in parts)


def roman_range(start: str, end: str) -> list[str]:
    if start in ROMANS and end in ROMANS:
        i, j = ROMANS.index(start), ROMANS.index(end)
        if i <= j:
            return ROMANS[i : j + 1]
    return [start, end]


def find_cross_references(text: str) -> list[str]:
    """Return printed rule/section numbers cited in text, in order, deduped.

    Ranges such as '4.3.1.I–II' expand to each member. 'Appendix H' becomes 'H',
    and a bare parenthesised chapter such as 'setup (5)' becomes '5'.
    """
    found: list[str] = []

    def add(n: str) -> None:
        if n not in found:
            found.append(n)

    for m in XREF_RE.finditer(text):
        base, roman, letter, roman_end, letter_end = m.groups()
        if roman is None:
            add(base)
        elif roman_end is None:
            add(f"{base}.{roman}{letter or ''}")
        elif letter and letter_end and roman == roman_end:
            for c in range(ord(letter), ord(letter_end) + 1):
                add(f"{base}.{roman}{chr(c)}")
        else:
            for r in roman_range(roman, roman_end):
                add(f"{base}.{r}")
    for m in APPENDIX_REF_RE.finditer(text):
        add(m.group(1))
    for m in BARE_CHAPTER_REF_RE.finditer(text):
        add(m.group(1))
    return found


def clean(text: str) -> str:
    for k, v in LIGATURES.items():
        text = text.replace(k, v)
    # A few spans end in a hard line break (e.g. "once-\n" in 7.1). Line joining
    # already decides spacing, so drop it rather than leak "\n" into the text.
    text = text.replace("\r", "").replace("\n", "")
    return text.replace(" ", " ")


# --- Text accumulation ------------------------------------------------------


@dataclass
class Segment:
    kind: str  # "plain" | "italic" | "item" | "break"
    text: str = ""


def join_needs_space(prev: str) -> bool:
    if not prev:
        return False
    last = prev[-1]
    return not (last.isspace() or last in "­-—–/")


def render_segments(segments: list[Segment]) -> str:
    """Render to the stored text format: *italic*, {item:name}, blank-line paragraphs."""
    # Whitespace between two italic runs belongs to the italic run.
    segments = [
        Segment("italic", s.text)
        if s.kind == "plain"
        and not s.text.strip()
        and 0 < i < len(segments) - 1
        and segments[i - 1].kind == "italic"
        and segments[i + 1].kind == "italic"
        else s
        for i, s in enumerate(segments)
    ]
    merged: list[Segment] = []
    for seg in segments:
        if merged and merged[-1].kind == seg.kind and seg.kind in ("plain", "italic"):
            merged[-1].text += seg.text
        else:
            merged.append(Segment(seg.kind, seg.text))
    out = []
    for seg in merged:
        if seg.kind == "plain":
            out.append(seg.text)
        elif seg.kind == "italic":
            inner = seg.text.strip()
            if not inner:
                out.append(seg.text)
                continue
            lead = seg.text[: len(seg.text) - len(seg.text.lstrip())]
            trail = seg.text[len(seg.text.rstrip()) :]
            out.append(f"{lead}*{inner}*{trail}")
        elif seg.kind == "item":
            out.append(f"{{item:{seg.text}}}")
        elif seg.kind == "icon":
            out.append("{icon}")
        elif seg.kind == "break":
            out.append("\n\n")
    text = "".join(out).replace("­", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    # Punctuation that follows an italic run belongs outside it: "*(...)* ."
    text = re.sub(r"\* ([.,;:])", r"*\1", text)
    return text.strip()


def plain_text(text: str) -> str:
    """Stored text without markup, for cross-reference scanning and search."""
    text = re.sub(r"\{item:([a-z]+)\}", r"\1", text)
    return text.replace("*", "")


@dataclass
class Record:
    kind: str  # chapter | section | rule
    number: str | None
    title: str = ""
    rule_type: str = "rule"
    parent_rule: "Record | None" = None
    section: "Record | None" = None
    chapter: "Record | None" = None
    segments: list[Segment] = field(default_factory=list)
    title_segments: list[Segment] = field(default_factory=list)
    title_open: bool = False
    faction_glyphs: list[str] = field(default_factory=list)
    locations: dict[tuple[int, int], list[float]] = field(default_factory=dict)  # (page, column) -> bbox
    warnings: list[str] = field(default_factory=list)
    has_table_rows: bool = False
    inline_icons: int = 0
    key: str = ""  # for unnumbered chapters ("reading-the-law")
    expansion: str | None = None  # from the PDF's "The next N sections refer to..." banners

    def touch(self, page: int, col: int, bbox) -> None:
        cur = self.locations.get((page, col))
        if cur is None:
            self.locations[(page, col)] = list(bbox)
        else:
            self.locations[(page, col)] = [
                min(cur[0], bbox[0]),
                min(cur[1], bbox[1]),
                max(cur[2], bbox[2]),
                max(cur[3], bbox[3]),
            ]

    def text_so_far(self) -> str:
        return "".join(s.text for s in self.segments if s.kind != "break")


# --- Line collection --------------------------------------------------------


@dataclass
class Line:
    page: int
    col: int
    bbox: tuple
    block: int
    spans: list[dict]

    @property
    def text(self) -> str:
        return "".join(s["text"] for s in self.spans)


def collect_lines(doc: pymupdf.Document) -> list[Line]:
    """Lines in reading order: page, then left column, then right column."""
    lines: list[Line] = []
    for pno in range(FIRST_RULE_PAGE - 1, doc.page_count):
        page = doc[pno]
        mid = page.rect.width / 2
        height = page.rect.height
        page_lines: list[Line] = []
        for bno, block in enumerate(page.get_text("dict")["blocks"]):
            for raw in block.get("lines", []):
                spans = [
                    {**s, "text": clean(s["text"])}
                    for s in raw["spans"]
                    if s["text"] != ""
                ]
                if not spans or not "".join(s["text"] for s in spans).strip():
                    continue
                bbox = tuple(raw["bbox"])
                txt = "".join(s["text"] for s in spans).strip()
                # Folio (page number) at the page foot.
                if bbox[1] > height - 60 and txt.isdigit():
                    continue
                col = 0 if bbox[0] < mid - 5 else 1
                page_lines.append(Line(pno + 1, col, bbox, bno, spans))
        page_lines.sort(key=lambda ln: (ln.col, round(ln.bbox[1]), ln.bbox[0]))
        lines.extend(page_lines)
        # Small filled vector shapes inside the text area are inline icons
        # (zero-width/height shapes are table rules, not icons).
        ICON_RECTS[pno + 1] = [
            tuple(d["rect"])
            for d in page.get_drawings()
            if 2 < d["rect"].width < 25 and 2 < d["rect"].height < 25 and d["rect"].y1 < height - 60
        ]
    return lines


INLINE_ICON = "INLINE_ICON"  # pseudo-font for an unextractable vector icon
ICON_RECTS: dict[int, list[tuple]] = {}  # page -> small vector shapes, filled by collect_lines


def merge_inline(row: list[Line]) -> Line | None:
    """Rejoin a line that the PDF split around an inline vector icon.

    Returns None if a gap between fragments holds no icon (a real table row).
    """
    row = sorted(row, key=lambda ln: ln.bbox[0])
    spans = list(row[0].spans)
    icons = ICON_RECTS.get(row[0].page, [])
    for a, b in zip(row, row[1:]):
        gap_x0, gap_x1 = a.bbox[2] - 1, b.bbox[0] + 1
        y0, y1 = min(a.bbox[1], b.bbox[1]), max(a.bbox[3], b.bbox[3])
        has_icon = any(
            r[0] >= gap_x0 and r[2] <= gap_x1 and r[1] < y1 and r[3] > y0 for r in icons
        )
        if has_icon:
            spans.append({"font": INLINE_ICON, "size": 10.0, "flags": 0, "text": "￼"})
        elif b.bbox[0] - a.bbox[2] > 4:
            return None  # an empty gap: separate table cells
        spans.extend(b.spans)
    bbox = (
        min(ln.bbox[0] for ln in row),
        min(ln.bbox[1] for ln in row),
        max(ln.bbox[2] for ln in row),
        max(ln.bbox[3] for ln in row),
    )
    return Line(row[0].page, row[0].col, bbox, row[0].block, spans)


def group_rows(lines: list[Line]) -> list[list[Line]]:
    """Group lines that share a baseline in the same column (table rows)."""
    rows: list[list[Line]] = []
    for ln in lines:
        if (
            rows
            and rows[-1][0].page == ln.page
            and rows[-1][0].col == ln.col
            and abs(rows[-1][0].bbox[1] - ln.bbox[1]) < 2.5
        ):
            rows[-1].append(ln)
        else:
            rows.append([ln])
    return rows


# --- Parser -----------------------------------------------------------------


def is_font(span: dict, name: str) -> bool:
    return span["font"] == name or span["font"].startswith(name + "-")


def is_bold(span: dict) -> bool:
    return "Bold" in span["font"] and "It" not in span["font"].split("Bold")[-1]


def is_italic(span: dict) -> bool:
    return "Italic" in span["font"] or span["font"].endswith("BoldIt")


class Parser:
    def __init__(self) -> None:
        self.records: list[Record] = []
        self.chapter: Record | None = None
        self.section: Record | None = None
        self.current: Record | None = None  # where text goes
        self.numbered: Record | None = None  # last X.Y.Z rule
        self.roman: Record | None = None  # last roman sub-rule
        self.prev_line: Line | None = None
        self.warnings: list[dict] = []
        self.unknown_glyphs: dict[str, int] = {}
        self.stopped_at: int | None = None
        self.fed: list[Line] = []  # every line read before the CREDITS divider
        self.not_content: list[Line] = []  # dividers and banners, kept out of the rule text
        self.banner_text = ""  # expansion banner being read
        self.expansion_queue: list[str] = []
        self.banners: list[dict] = []

    # -- record creation --

    def _add(self, rec: Record) -> Record:
        self.records.append(rec)
        return rec

    def start_chapter(self, number: str | None, title: str, key: str = "") -> None:
        rec = Record("chapter", number, title=title, rule_type="chapter-text", key=key)
        if self.banner_text:
            self.read_banner()
        if self.expansion_queue:
            rec.expansion = self.expansion_queue.pop(0)
        self.chapter = self._add(rec)
        self.section = None
        self.numbered = self.roman = None
        self.current = self.chapter

    def start_section(self, number: str, title_spans: list[dict]) -> None:
        rec = Record("section", number, rule_type="section-text", chapter=self.chapter)
        self.add_title_spans(rec, title_spans)
        self.section = self._add(rec)
        self.numbered = self.roman = None
        self.current = self.section

    def start_rule(self, number: str, rule_type: str, parent: Record | None) -> Record:
        rec = Record(
            "rule",
            number,
            rule_type=rule_type,
            parent_rule=parent,
            section=self.section,
            chapter=self.chapter,
            title_open=True,
        )
        self.current = self._add(rec)
        return rec

    def read_banner(self) -> None:
        """'The next two sections refer to factions in The Riverfolk Expansion.'"""
        text = re.sub(r"\s+", " ", self.banner_text.replace("­", "")).strip()
        self.banner_text = ""
        m = re.search(r"next (\w+) sections refer to factions in (.+?)\.?$", text)
        counts = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5}
        if not m or m.group(1) not in counts:
            self.warnings.append({"message": f"Unparsed expansion banner: {text!r}"})
            return
        self.expansion_queue = [m.group(2)] * counts[m.group(1)]
        self.banners.append({"text": text, "expansion": m.group(2), "chapters": counts[m.group(1)]})

    # -- span handling --

    def add_title_spans(self, rec: Record, spans: list[dict]) -> None:
        for s in spans:
            if is_font(s, FACTION_ICON_FONT):
                rec.faction_glyphs.extend(c for c in s["text"] if c.strip())
            else:
                rec.title += s["text"]
        rec.title = re.sub(r"\s+", " ", rec.title.replace("­", "")).strip()

    def add_spans(self, rec: Record, spans: list[dict], line: Line) -> None:
        for s in spans:
            t = s["text"]
            if is_font(s, FACTION_ICON_FONT):
                rec.faction_glyphs.extend(c for c in t if c.strip())
                continue
            if s["font"] == INLINE_ICON:
                target = rec.title_segments if rec.title_open else rec.segments
                target.append(Segment("icon"))
                rec.inline_icons += 1
                continue
            if is_font(s, ITEM_ICON_FONT):
                for c in t:
                    if not c.strip():
                        continue
                    name = ITEM_GLYPHS.get(c)
                    if name is None:
                        self.unknown_glyphs[c] = self.unknown_glyphs.get(c, 0) + 1
                        name = f"unknown-{c}"
                    target = rec.title_segments if rec.title_open else rec.segments
                    target.append(Segment("item", name))
                continue
            if rec.title_open:
                if is_bold(s):
                    rec.title_segments.append(Segment("plain", t))
                    continue
                rec.title_open = False
            rec.segments.append(Segment("italic" if is_italic(s) else "plain", t))

    def append_line(self, rec: Record, spans: list[dict], line: Line) -> None:
        prev = self.prev_line
        after_table_row = bool(rec.segments) and rec.segments[-1].text.endswith("\n")
        sentence_done = re.search(r"[.:)”\"!?]\s*$", rec.text_so_far())
        # The unnumbered preface sets each Q in bold; start a paragraph there.
        preface_question = rec.kind == "chapter" and rec.number is None and is_bold(spans[0])
        if after_table_row:
            pass
        elif rec.segments and sentence_done and (
            preface_question
            # A new block in the same column after a finished sentence.
            or (
                prev is not None
                and prev.page == line.page
                and prev.col == line.col
                and prev.block != line.block
            )
        ):
            rec.segments.append(Segment("break"))
        elif rec.title_open and rec.title_segments:
            last = "".join(s.text for s in rec.title_segments)
            if join_needs_space(last):
                rec.title_segments.append(Segment("plain", " "))
        elif rec.segments and join_needs_space(rec.text_so_far()):
            rec.segments.append(Segment("plain", " "))
        self.add_spans(rec, spans, line)
        rec.touch(line.page, line.col, line.bbox)

    # -- line dispatch --

    def feed_row(self, row: list[Line]) -> bool:
        """Process one visual row. Returns False when the rules have ended."""
        if len(row) > 1:
            merged = merge_inline(row)
            if merged is None:
                return self.feed_table_row(row)
            row = [merged]
        line = row[0]
        spans = line.spans
        first = spans[0]
        text = line.text.strip()

        if is_font(first, BODY_FONT) and abs(first["size"] - DIVIDER_SIZE) < 0.5:
            if text.upper() == "CREDITS":
                self.stopped_at = line.page
                return False
            self.prev_line = line
            self.not_content.append(line)
            return True  # "APPENDICES" and similar dividers carry no rules

        if is_font(first, CHAPTER_FONT):
            heading = "".join(s["text"] for s in spans if is_font(s, CHAPTER_FONT)).strip()
            m = CHAPTER_HEADING_RE.match(heading)
            if m:
                self.start_chapter(m.group(1), m.group(2))
            else:
                self.start_chapter(None, heading, key=slugify(heading))
            self.add_title_spans(self.chapter, [s for s in spans if is_font(s, FACTION_ICON_FONT)])
            self.chapter.touch(line.page, line.col, line.bbox)
            self.prev_line = line
            return True

        if (
            is_font(first, BODY_FONT)
            and abs(first["size"] - SECTION_NUMBER_SIZE) < 0.3
            and SECTION_NUMBER_RE.match(first["text"])
        ):
            self.start_section(SECTION_NUMBER_RE.match(first["text"]).group(1), spans[1:])
            self.section.touch(line.page, line.col, line.bbox)
            self.prev_line = line
            return True

        if (
            self.current is self.section
            and self.section is not None
            and not self.section.segments
            and all(abs(s["size"] - SECTION_TITLE_SIZE) < 0.3 or is_font(s, FACTION_ICON_FONT) for s in spans)
        ):
            # Section title wrapped onto a second line.
            self.add_title_spans(self.section, [{**spans[0], "text": " "}] + spans)
            self.section.touch(line.page, line.col, line.bbox)
            self.prev_line = line
            return True

        if is_font(first, BODY_FONT) and abs(first["size"] - NUMBER_SIZE) < 0.3:
            label = first["text"].strip()
            rest = spans[1:]
            rec = None
            if RULE_NUMBER_RE.match(label):
                rtype = "glossary" if label.startswith("G.") else "rule"
                rec = self.start_rule(label, rtype, None)
                self.numbered, self.roman = rec, None
            elif ROMAN_RE.match(label) and self.numbered is not None:
                rec = self.start_rule(f"{self.numbered.number}.{label}", "sub-rule", self.numbered)
                self.roman = rec
            elif LETTER_RE.match(label) and self.roman is not None:
                rec = self.start_rule(f"{self.roman.number}{label}", "sub-rule", self.roman)
            if rec is not None:
                self.add_spans(rec, rest, line)
                rec.touch(line.page, line.col, line.bbox)
                self.prev_line = line
                return True
            self.warn(line, f"Unrecognised 6pt label {label!r}; kept as text")

        if self.current is None:
            self.warn(line, "Text before the first heading; skipped")
            self.prev_line = line
            self.not_content.append(line)
            return True

        unusual = [
            s
            for s in spans
            if is_font(s, BODY_FONT) and abs(s["size"] - 10.0) > 0.3 and s["text"].strip()
        ]
        banner_size = all(abs(s["size"] - 11.9) < 0.3 for s in spans if s["text"].strip())
        if banner_size and self.chapter is not None and self.chapter.number is None:
            unusual = []  # the preface's own 11.9pt introduction, kept as its text
        elif banner_size and (self.banner_text or "sections refer to" in text):
            self.banner_text += " " + text
            self.prev_line = line
            self.not_content.append(line)
            return True
        if unusual:
            self.warn(
                line,
                f"Non-body font size {unusual[0]['size']:.1f} ({unusual[0]['font']}); appended to {self.label(self.current)}",
            )
        self.append_line(self.current, spans, line)
        self.prev_line = line
        return True

    def feed(self, row: list[Line]) -> bool:
        keep_going = self.feed_row(row)
        if keep_going:
            self.fed.extend(row)
        return keep_going

    def feed_table_row(self, row: list[Line]) -> bool:
        rec = self.current
        if rec is None:
            return True
        rec.title_open = False
        rec.has_table_rows = True
        if rec.segments and not rec.segments[-1].text.endswith("\n"):
            rec.segments.append(Segment("plain", "\n"))
        for i, line in enumerate(row):
            if i:
                rec.segments.append(Segment("plain", " | "))
            self.add_spans(rec, line.spans, line)
            rec.touch(line.page, line.col, line.bbox)
        rec.segments.append(Segment("plain", "\n"))
        self.prev_line = row[-1]
        return True

    def warn(self, line: Line, message: str) -> None:
        self.warnings.append({"page": line.page, "text": line.text.strip()[:80], "message": message})

    @staticmethod
    def label(rec: Record) -> str:
        return rec.number or rec.title or rec.key


# --- Output -----------------------------------------------------------------


def chapter_id(rec: Record) -> str:
    return number_to_id("section", rec.number) if rec.number else f"section-{rec.key}"


def build_output(parser: Parser, source_version: str):
    records = parser.records
    sections: list[dict] = []
    rules: list[dict] = []
    warnings = list(parser.warnings)

    chapters = [r for r in records if r.kind == "chapter"]
    factions = []
    for ch in chapters:
        if ch.faction_glyphs and ch.number and ch.number.isdigit():
            glyph = ch.faction_glyphs[0]
            factions.append(
                {
                    "id": slugify(ch.title),
                    "name": ch.title,
                    "glyph": glyph,
                    "chapter_section_id": chapter_id(ch),
                    "expansion": ch.expansion,
                    "source_page_start": min(ch.locations)[0],
                }
            )
    glyph_to_faction = {f["glyph"]: f["id"] for f in factions}
    # Lowercase variants of the icons draw the same faction (checked visually).
    for g, fid in list(glyph_to_faction.items()):
        glyph_to_faction.setdefault(g.lower(), fid)

    def faction_markers(rec: Record) -> list[str]:
        out = []
        for g in rec.faction_glyphs:
            fid = glyph_to_faction.get(g)
            if fid is None:
                warnings.append({"message": f"Unknown faction glyph {g!r} on {rec.number}"})
                continue
            if fid not in out:
                out.append(fid)
        return out

    faction_by_section = {f["chapter_section_id"]: f["id"] for f in factions}
    chapter_faction = {id(ch): faction_by_section[chapter_id(ch)] for ch in chapters if chapter_id(ch) in faction_by_section}

    def section_id_of(rec: Record) -> str:
        if rec.kind == "chapter":
            return chapter_id(rec)
        if rec.kind == "section":
            return number_to_id("section", rec.number)
        if rec.section is not None:
            return number_to_id("section", rec.section.number)
        return chapter_id(rec.chapter)

    def locations(rec: Record) -> list[dict]:
        return [{"page": p, "bbox": [round(v, 1) for v in b]} for (p, _c), b in sorted(rec.locations.items())]

    order = 0
    section_rule_ids: dict[str, list[str]] = {}
    for rec in records:
        if rec.kind in ("chapter", "section"):
            sid = chapter_id(rec) if rec.kind == "chapter" else number_to_id("section", rec.number)
            parent = None if rec.kind == "chapter" else chapter_id(rec.chapter)
            sections.append(
                {
                    "id": sid,
                    "number": rec.number,
                    "title": rec.title,
                    "level": 1 if rec.kind == "chapter" else 2,
                    "parent_section_id": parent,
                    "order": len(sections),
                    "faction_id": chapter_faction.get(id(rec.chapter if rec.kind == "section" else rec)),
                    "expansion": rec.expansion if rec.kind == "chapter" else None,
                    "source_page_start": min(rec.locations)[0] if rec.locations else None,
                    "rule_ids": [],
                }
            )
            section_rule_ids[sid] = sections[-1]["rule_ids"]

        text = render_segments(rec.segments)
        if rec.kind != "rule" and not text:
            continue  # heading with no body text of its own

        if rec.kind == "chapter":
            rid = f"rule-{rec.number.lower()}-intro" if rec.number else f"rule-{rec.key}"
            number, title = None, rec.title
        elif rec.kind == "section":
            rid = number_to_id("rule", rec.number)
            number, title = rec.number, rec.title
        else:
            rid = number_to_id("rule", rec.number)
            number = rec.number
            title = render_segments(rec.title_segments).rstrip(".").strip()

        owning_chapter = rec if rec.kind == "chapter" else rec.chapter
        pages = sorted({p for p, _c in rec.locations})
        rule = {
            "id": rid,
            "rule_number": number,
            "title": title,
            "text": text,
            "rule_type": rec.rule_type,
            "section_id": section_id_of(rec),
            "parent_rule_id": number_to_id("rule", rec.parent_rule.number) if rec.parent_rule else None,
            "order": order,
            "source_page_start": pages[0] if pages else None,
            "source_page_end": pages[-1] if pages else None,
            "source_locations": locations(rec),
            "faction_ids": [chapter_faction[id(owning_chapter)]] if id(owning_chapter) in chapter_faction else [],
            "faction_markers": faction_markers(rec),
            "cross_references": [],
            "source_version": source_version,
        }
        flags = (["table"] if rec.has_table_rows else []) + (["inline-icon"] if rec.inline_icons else [])
        if flags:
            rule["layout_flags"] = flags
        order += 1
        rules.append(rule)
        section_rule_ids[rule["section_id"]].append(rid)

    # Resolve cross-references against everything that has a printed number.
    by_number: dict[str, str] = {}
    for s in sections:
        if s["number"]:
            by_number[s["number"]] = s["id"]
    for r in rules:
        if r["rule_number"]:
            by_number[r["rule_number"]] = r["id"]
    unresolved = []
    for r in rules:
        for n in find_cross_references(plain_text(r["text"])):
            target = by_number.get(n)
            if target == r["id"]:
                continue
            r["cross_references"].append({"cited": n, "target_id": target})
            if target is None:
                unresolved.append({"rule_id": r["id"], "cited": n})

    ids = [r["id"] for r in rules] + [s["id"] for s in sections]
    dupes = sorted({i for i in ids if ids.count(i) > 1})

    report = {
        "counts": {
            "sections": len(sections),
            "rules": len(rules),
            "by_type": {t: sum(1 for r in rules if r["rule_type"] == t) for t in sorted({r["rule_type"] for r in rules})},
            "factions": len(factions),
        },
        "stopped_at_page": parser.stopped_at,
        "duplicate_ids": dupes,
        "unresolved_cross_references": unresolved,
        "unknown_item_glyphs": parser.unknown_glyphs,
        "tables": [r["id"] for r in rules if "table" in r.get("layout_flags", [])],
        "inline_icons": [r["id"] for r in rules if "inline-icon" in r.get("layout_flags", [])],
        "expansion_banners": parser.banners,
        "numbering_gaps": numbering_gaps(rules),
        "warnings": warnings,
        "known_limitations": [
            "Small-caps key terms are encoded as ordinary lowercase text and are not marked.",
            "Lowercase faction glyphs are mapped to the same faction as the uppercase glyph (checked visually for b, f, s).",
            "Table layout is flattened to 'cell | cell' rows; check against the PDF.",
        ],
    }
    return sections, rules, factions, report


IGNORED_IN_CONSERVATION = set(".|*")  # stripped title periods, table separators, italic markup
ITEM_MARK = "◆"


def conservation_check(parser: Parser, sections: list[dict], rules: list[dict]) -> dict:
    """Compare every character read from the PDF with every character written.

    Independent of the parse logic: if text was dropped, duplicated or garbled,
    the two character counts differ. Faction icons (stored as metadata), inline
    vector icons, whitespace, soft hyphens and the ignored marks are excluded.
    """
    from collections import Counter

    skip = {id(ln) for ln in parser.not_content}
    source: Counter = Counter()
    for line in parser.fed:
        if id(line) in skip:
            continue
        for s in line.spans:
            if is_font(s, FACTION_ICON_FONT):
                continue
            if is_font(s, ITEM_ICON_FONT):
                source[ITEM_MARK] += sum(1 for c in s["text"] if c.strip())
                continue
            source.update(c for c in s["text"] if c.strip() and c != "­")

    def chars(text: str) -> list[str]:
        text = re.sub(r"\{item:[a-z-]+\}", ITEM_MARK, text).replace("{icon}", "")
        return [c for c in text if c.strip()]

    out: Counter = Counter()
    for s in sections:
        out.update(chars((s["number"] or "") + s["title"]))
    for r in rules:
        if r["rule_type"] in ("rule", "glossary", "sub-rule"):
            n = r["rule_number"]
            label = n[-1] if n[-1].islower() else n.rsplit(".", 1)[-1] if r["rule_type"] == "sub-rule" else n
            out.update(chars(label + r["title"]))
        out.update(chars(r["text"]))

    for c in IGNORED_IN_CONSERVATION:
        source.pop(c, None)
        out.pop(c, None)
    missing = dict((source - out).most_common())
    extra = dict((out - source).most_common())
    return {
        "source_characters": sum(source.values()),
        "output_characters": sum(out.values()),
        "missing_from_output": missing,
        "extra_in_output": extra,
        "ok": not missing and not extra,
    }


def numbering_gaps(rules: list[dict]) -> list[str]:
    """Report X.Y.N sequences that skip a number (e.g. 4.1.1 then 4.1.3)."""
    gaps = []
    last: dict[str, int] = {}
    for r in rules:
        n = r["rule_number"]
        if not n or r["rule_type"] == "section-text":
            continue
        m = re.fullmatch(r"(.+)\.(\d+)", n)
        if not m:
            continue
        prefix, idx = m.group(1), int(m.group(2))
        expected = last.get(prefix, 0) + 1
        if idx != expected:
            gaps.append(f"{prefix}.{expected} expected before {n}")
        last[prefix] = idx
    return gaps


def extract(pdf: Path, version: str):
    """Parse the whole PDF. Returns (doc, sections, rules, factions, report)."""
    doc = pymupdf.open(pdf)
    parser = Parser()
    for row in group_rows(collect_lines(doc)):
        if not parser.feed(row):
            break
    sections, rules, factions, report = build_output(parser, version)
    report["conservation"] = conservation_check(parser, sections, rules)
    return doc, sections, rules, factions, report


def printed_date(doc: pymupdf.Document) -> str | None:
    """The edition date printed under the cover title, e.g. 'October 13, 2025'."""
    m = re.search(r"\(([A-Z][a-z]+ \d{1,2}, \d{4})\)", doc[0].get_text())
    return m.group(1) if m else None


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--pdf", required=True, type=Path)
    ap.add_argument("--version", required=True, help="Edition identifier, e.g. 2025-10-13")
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument(
        "--only",
        help="Comma-separated chapter numbers/letters to write (e.g. '2,6,G'). The whole book is "
        "still parsed so cross-references resolve; the report covers the whole book.",
    )
    args = ap.parse_args(argv)

    doc, sections, rules, factions, report = extract(args.pdf, args.version)

    if args.only:
        keep = {k.strip().upper() for k in args.only.split(",")}
        chapter_of = {}
        for s in sections:
            chapter_of[s["id"]] = s["number"].split(".")[0].upper() if s["number"] else s["id"]
        sections = [s for s in sections if chapter_of[s["id"]] in keep]
        rules = [r for r in rules if chapter_of[r["section_id"]] in keep]

    args.out.mkdir(parents=True, exist_ok=True)
    pdf_bytes = args.pdf.read_bytes()
    source = {
        "source_version": args.version,
        "title": "The Law of Root",
        "printed_date": printed_date(doc),
        "pdf_path": args.pdf.as_posix(),
        "pdf_sha256": hashlib.sha256(pdf_bytes).hexdigest(),
        "pdf_page_count": doc.page_count,
        "pdf_modified": doc.metadata.get("modDate"),
        "extractor_version": EXTRACTOR_VERSION,
        "extracted_at": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(),
        "partial": bool(args.only),
        "included_chapters": sorted({k.strip().upper() for k in args.only.split(",")}) if args.only else "all",
    }

    def write(name: str, data) -> None:
        (args.out / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    write("source.json", source)
    write("sections.json", sections)
    write("rules.json", rules)
    write("factions.json", factions)
    write("extraction-report.json", report)

    c = report["counts"]
    print(f"Parsed {c['rules']} rules in {c['sections']} sections, {c['factions']} factions (whole book).")
    print(f"Wrote {len(rules)} rules, {len(sections)} sections to {args.out}")
    print(
        f"Report: {len(report['warnings'])} warnings, {len(report['unresolved_cross_references'])} unresolved refs, "
        f"{len(report['numbering_gaps'])} numbering gaps, {len(report['duplicate_ids'])} duplicate ids, "
        f"{len(report['tables'])} tables"
    )
    cons = report["conservation"]
    print(
        f"Conservation: {cons['source_characters']} characters read, {cons['output_characters']} written"
        + ("; all accounted for." if cons["ok"] else f"; MISSING {cons['missing_from_output']} EXTRA {cons['extra_in_output']}")
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
