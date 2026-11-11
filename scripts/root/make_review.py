"""Build a side-by-side review page: PDF crop next to each extracted record.

    .venv/Scripts/python scripts/root/make_review.py \
        --pdf public/data/root/Root_2025_Law.pdf \
        --data data/root/law-2025-10-13 \
        --chapters 2,6,G --extra rule-5-1-5,rule-5-2 \
        --out review.html

Reviewers mark each record "Matches" or "Problem" (kept in their browser) and
copy a plain-text summary to send back. The page is a review aid only; it is
not part of the website.
"""

from __future__ import annotations

import argparse
import base64
import html
import json
import re
from pathlib import Path

import pymupdf

PAD = (8, 3, 4, 3)  # left, top, right, bottom (pt) around each crop
DPI = 150


def crop(doc: pymupdf.Document, page: int, bbox: list[float]) -> str:
    p = doc[page - 1]
    r = pymupdf.Rect(bbox[0] - PAD[0], bbox[1] - PAD[1], bbox[2] + PAD[2], bbox[3] + PAD[3]) & p.rect
    pix = p.get_pixmap(dpi=DPI, clip=r)
    return "data:image/jpeg;base64," + base64.b64encode(pix.tobytes("jpeg", jpg_quality=82)).decode()


def inline(text: str) -> str:
    """Stored markup -> HTML: *italic*, {item:x}, {icon}."""
    out = html.escape(text, quote=False)
    out = re.sub(r"\*(.+?)\*", r'<em class="reminder">\1</em>', out, flags=re.S)
    out = re.sub(r"\{item:([a-z-]+)\}", r'<span class="chip item">\1</span>', out)
    out = out.replace("{icon}", '<span class="chip icon" title="Inline icon not extracted">icon</span>')
    return out


def body(text: str) -> str:
    parts = []
    for para in text.split("\n\n"):
        lines = para.split("\n")
        if sum(" | " in ln for ln in lines) >= 2:
            rows = []
            for ln in lines:
                cells = ln.split(" | ")
                if len(cells) == 1:
                    rows.append(f'<tr><th colspan="6">{inline(ln)}</th></tr>')
                else:
                    rows.append("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in cells) + "</tr>")
            parts.append(f'<div class="table-wrap"><table>{"".join(rows)}</table></div>')
        else:
            parts.append("<p>" + "<br>".join(inline(ln) for ln in lines) + "</p>")
    return "".join(parts)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", required=True, type=Path)
    ap.add_argument("--data", required=True, type=Path, help="Folder with rules.json, sections.json, factions.json")
    ap.add_argument("--chapters", default="", help="Chapter keys to include, e.g. 2,6,G")
    ap.add_argument("--extra", default="", help="Extra rule ids to include as edge cases")
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()

    rules = json.loads((args.data / "rules.json").read_text(encoding="utf-8"))
    sections = {s["id"]: s for s in json.loads((args.data / "sections.json").read_text(encoding="utf-8"))}
    factions = {f["id"]: f["name"] for f in json.loads((args.data / "factions.json").read_text(encoding="utf-8"))}
    source = json.loads((args.data / "source.json").read_text(encoding="utf-8"))
    doc = pymupdf.open(args.pdf)

    chapters = {c.strip().upper() for c in args.chapters.split(",") if c.strip()}
    extra = [i.strip() for i in args.extra.split(",") if i.strip()]

    def chapter_key(rule: dict) -> str:
        sid = rule["section_id"]
        while sections[sid]["parent_section_id"]:
            sid = sections[sid]["parent_section_id"]
        return (sections[sid]["number"] or sid).upper()

    def chapter_title(rule: dict) -> str:
        sid = rule["section_id"]
        while sections[sid]["parent_section_id"]:
            sid = sections[sid]["parent_section_id"]
        s = sections[sid]
        return f"{s['number']}. {s['title']}" if s["number"] else s["title"]

    groups: list[tuple[str, list[dict]]] = []
    for r in rules:
        if chapter_key(r) in chapters:
            title = chapter_title(r)
            if not groups or groups[-1][0] != title:
                groups.append((title, []))
            groups[-1][1].append(r)
    by_id = {r["id"]: r for r in rules}
    edge = [by_id[i] for i in extra if i in by_id]
    if edge:
        groups.append(("Edge cases from other chapters", edge))

    cards = []
    count = 0
    for title, items in groups:
        cards.append(f'<h2 class="group">{html.escape(title)}</h2>')
        for r in items:
            count += 1
            number = r["rule_number"] or "—"
            imgs = "".join(
                f'<img src="{crop(doc, loc["page"], loc["bbox"])}" alt="PDF page {loc["page"]}, {html.escape(number)}" loading="lazy">'
                for loc in r["source_locations"]
            )
            pages = r["source_page_start"] if r["source_page_start"] == r["source_page_end"] else f"{r['source_page_start']}–{r['source_page_end']}"
            meta = [f'<span class="meta-item">{html.escape(r["rule_type"])}</span>', f'<span class="meta-item">p. {pages}</span>']
            if r["faction_ids"]:
                meta.append('<span class="meta-item">chapter: ' + ", ".join(html.escape(factions.get(f, f)) for f in r["faction_ids"]) + "</span>")
            markers = "".join(f'<span class="chip faction">{html.escape(factions.get(f, f))}</span>' for f in r["faction_markers"])
            xrefs = "".join(
                f'<span class="chip xref{" broken" if not x["target_id"] else ""}">→ {html.escape(x["cited"])}</span>'
                for x in r["cross_references"]
            )
            flags = "".join(f'<span class="chip flag">{html.escape(f)}</span>' for f in r.get("layout_flags", []))
            title_html = f'<strong class="rule-title">{inline(r["title"])}.</strong> ' if r["title"] and r["rule_type"] not in ("section-text", "chapter-text") else ""
            heading = f'<div class="section-title">{inline(r["title"])}</div>' if r["rule_type"] in ("section-text", "chapter-text") else ""
            label = f"{number} {r['title']}".strip()
            cards.append(
                f"""
<article class="card" data-id="{r['id']}" data-label="{html.escape(label)}">
  <div class="pdf">{imgs}</div>
  <div class="extracted">
    <div class="head"><code class="num">{html.escape(number)}</code><code class="rid">{r['id']}</code></div>
    {heading}
    <div class="text">{title_html.strip()}{body(r['text']) if r['text'] else ''}</div>
    <div class="meta">{''.join(meta)}</div>
    {f'<div class="chips"><span class="chips-label">Faction icons</span>{markers}</div>' if markers else ''}
    {f'<div class="chips"><span class="chips-label">Cites</span>{xrefs}</div>' if xrefs else ''}
    {f'<div class="chips"><span class="chips-label">Flags</span>{flags}</div>' if flags else ''}
    <div class="verdict" role="group" aria-label="Review {html.escape(number)}">
      <button type="button" class="ok" id="ok-{r['id']}" aria-pressed="false">Matches</button>
      <button type="button" class="bad" id="bad-{r['id']}" aria-pressed="false">Problem</button>
      <input type="text" class="note" id="note-{r['id']}" placeholder="What's wrong? (optional)" hidden>
    </div>
  </div>
</article>"""
            )

    template = (Path(__file__).parent / "review_template.html").read_text(encoding="utf-8")
    page = (
        template.replace("{{CARDS}}", "\n".join(cards))
        .replace("{{COUNT}}", str(count))
        .replace("{{EDITION}}", html.escape(source.get("printed_date") or source["source_version"]))
        .replace("{{VERSION}}", html.escape(source["source_version"]))
    )
    args.out.write_text(page, encoding="utf-8")
    print(f"Wrote {count} records to {args.out} ({args.out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
