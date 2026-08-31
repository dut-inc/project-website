"""
Parse character data from the Genshin Impact Fandom "Character/List" page.

Usage:
    python utils/dles/genshin.py

Requires:
    pip install requests beautifulsoup4 --break-system-packages
"""

import json
import re
from pathlib import Path

import requests
from bs4 import BeautifulSoup

API_URL = (
    "https://genshin-impact.fandom.com/api.php"
    "?action=parse&page=Character/List&format=json&prop=text"
)
OUTPUT_PATH = Path(__file__).resolve().parents[2] / "public" / "data" / "dles" / "genshin" / "characters.json"


def fetch_html() -> str:
    resp = requests.get(API_URL, headers={"User-Agent": "Mozilla/5.0"})
    resp.raise_for_status()
    data = resp.json()
    return data["parse"]["text"]["*"]


def icon_url(td):
    """Return the original Fandom image URL instead of a scaled thumbnail."""
    img = td.find("img")
    if not img:
        return None

    image_url = img.get("data-src") or img.get("src")
    if not image_url:
        return None

    # Fandom appends paths such as /revision/latest/scale-to-width-down/50
    # and cache-busting query strings to thumbnail URLs. Strip them so the
    # browser receives the original image, e.g. .../Amber_Icon.png/.
    image_url = image_url.split("/revision/", 1)[0].split("?", 1)[0]
    return f"{image_url.rstrip('/')}/"


def parse_quality(td):
    """<img alt="4 Stars" data-image-name="Icon 4 Stars.png" ...>"""
    img = td.find("img")
    if not img:
        return None
    text = img.get("alt", "") or img.get("data-image-name", "")
    m = re.search(r"(\d+)\s*Star", text)
    return int(m.group(1)) if m else None


def parse_characters(html: str):
    soup = BeautifulSoup(html, "html.parser")
    characters = []

    # Every character row has a <td data-name="..."> cell — use that as
    # the anchor instead of guessing which <table> to target.
    for name_td in soup.select("td[data-name]"):
        row = name_td.find_parent("tr")
        if row is None:
            continue
        cells = row.find_all("td")
        if len(cells) < 9:
            continue  # skip malformed/header rows

        icon_td, _name_td, quality_td, element_td, weapon_td, \
            region_td, gender_td, release_td, version_td = cells[:9]

        characters.append({
            "name": name_td["data-name"],
            "icon": icon_url(icon_td),
            "quality": parse_quality(quality_td),
            "element": element_td.get_text(strip=True),
            "element_icon": icon_url(element_td),
            "weapon": weapon_td.get_text(strip=True),
            "weapon_icon": icon_url(weapon_td),
            "region": region_td.get_text(strip=True),
            "region_icon": icon_url(region_td),
            "body_type": gender_td.get_text(strip=True),
            "release_date": release_td.get("data-release"),
            "version": version_td.get("data-version"),
        })

    return characters


if __name__ == "__main__":
    html = fetch_html()
    chars = parse_characters(html)

    print(f"Parsed {len(chars)} characters.")
    if chars:
        print(json.dumps(chars[0], indent=2, ensure_ascii=False))

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(chars, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"Saved {len(chars)} characters to {OUTPUT_PATH}")