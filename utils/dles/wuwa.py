"""
Parse resonator data from the Wuthering Waves Fandom "Resonator/List"
page and add each resonator's combat skills from the corresponding
Fandom skill pages.

Skills fetched:
    - Resonance Skill
    - Forte Circuit
    - Resonance Liberation
    - Intro Skill
    - Outro Skill

All fetched skills are grouped under the character's "forte" entry.

Usage:
    python parse_resonators.py

Requires:
    pip install requests beautifulsoup4 --break-system-packages
"""

import json
import re
from pathlib import Path

import requests
from bs4 import BeautifulSoup


API_BASE = "https://wutheringwaves.fandom.com/api.php"

RESONATOR_API_URL = (
    f"{API_BASE}"
    "?action=parse&page=Resonator/List&format=json&prop=text"
)

SKILL_PAGES = {
    "resonance_skill": "Resonance_Skill",
    "forte_circuit": "Forte_Circuit",
    "resonance_liberation": "Resonance_Liberation",
    "intro_skill": "Intro_Skill",
    "outro_skill": "Outro_Skill",
}

OUTPUT_PATH = (
    Path(__file__).resolve().parents[2]
    / "public"
    / "data"
    / "dles"
    / "wuwa"
    / "resonators.json"
)


def fetch_html(url: str) -> str:
    resp = requests.get(
        url,
        headers={"User-Agent": "Mozilla/5.0"},
        timeout=30,
    )
    resp.raise_for_status()

    data = resp.json()
    return data["parse"]["text"]["*"]


def fetch_skill_page(page_name: str) -> str:
    """
    Fetch a specific skill page from the Fandom API.
    """
    url = (
        f"{API_BASE}"
        f"?action=parse"
        f"&page={page_name}"
        f"&format=json"
        f"&prop=text"
    )

    return fetch_html(url)


def icon_url(cell):
    """
    Fandom lazy-loads images: real URL is in data-src, not src.

    Strip the "/scale-to-width-down/NN" thumbnail segment so the URL
    points at the full-resolution original instead of a resized copy.
    """
    img = cell.find("img")

    if not img:
        return None

    url = img.get("data-src")

    if not url:
        url = img.get("src")

    if not url:
        return None

    # Ignore placeholder images
    if url.startswith("data:image"):
        return None

    # Remove thumbnail resizing
    url = re.sub(
        r"/scale-to-width-down/\d+",
        "",
        url,
    )

    return url


def parse_quality(td):
    """<img alt="4 Stars" data-image-name="Icon 4 Stars.png" ...>"""
    img = td.find("img")

    if not img:
        return None

    text = img.get("alt", "") or img.get("data-image-name", "")

    m = re.search(r"(\d+)\s*Star", text)

    return int(m.group(1)) if m else None


def cell_labels(td):
    """
    Text labels in a cell, handling both normal links (<a>) and
    not-yet-created wiki pages, which render as:

        <span class="new">X</span>

    instead of an <a>.

    Some cells can contain multiple labels.
    """
    labels = [
        a.get_text(strip=True)
        for a in td.find_all("a")
    ]

    labels += [
        s.get_text(strip=True)
        for s in td.find_all("span", class_="new")
    ]

    return labels


def parse_skill_page(html: str):
    """
    Parse a skill page into a lookup:

        {
            "Roccia": {
                "name": "Acrobatic Trick",
                "icon": "https://..."
            },
            ...
        }

    The character/resonator name is used as the lookup key.
    """
    soup = BeautifulSoup(html, "html.parser")

    skills = {}

    for row in soup.select("table tr"):
        cells = row.find_all("td")

        if not cells:
            continue

        skill_cell = cells[0]

        # -----------------------------------------------------
        # Skill icon
        # -----------------------------------------------------

        img = skill_cell.select_one(
            ".wuwa-iconwcaption-img img"
        )

        if not img:
            continue

        skill_icon = img.get("data-src")

        if not skill_icon:
            skill_icon = img.get("src")

        # Ignore placeholder images
        if not skill_icon or skill_icon.startswith("data:image"):
            continue

        # Remove thumbnail resizing
        skill_icon = re.sub(
            r"/scale-to-width-down/\d+",
            "",
            skill_icon,
        )

        # -----------------------------------------------------
        # Skill name
        # -----------------------------------------------------

        skill_link = skill_cell.select_one(
            ".wuwa-iconwcaption a"
        )

        if not skill_link:
            continue

        skill_name = skill_link.get_text(strip=True)

        # -----------------------------------------------------
        # Character / Resonator
        # -----------------------------------------------------

        character_link = skill_cell.select_one(
            ".item.resonator .item-text a"
        )

        if not character_link:
            continue

        character_name = character_link.get_text(strip=True)

        skills[character_name] = {
            "name": skill_name,
            "icon": skill_icon,
        }

    return skills


def parse_all_skills():
    """
    Fetch and parse every skill page.

    Returns:

        {
            "resonance_skill": {
                "Roccia": {...},
                ...
            },
            "forte_circuit": {
                "Roccia": {...},
                ...
            },
            ...
        }
    """
    all_skills = {}

    for skill_type, page_name in SKILL_PAGES.items():
        print(f"Fetching {page_name}...")

        try:
            html = fetch_skill_page(page_name)
            skills = parse_skill_page(html)

            all_skills[skill_type] = skills

            print(
                f"  Parsed {len(skills)} "
                f"{skill_type.replace('_', ' ')} entries."
            )

        except Exception as e:
            print(
                f"  Failed to fetch {page_name}: {e}"
            )

            # Keep the key so resonators still get a null value
            all_skills[skill_type] = {}

    return all_skills


def parse_resonators(
    html: str,
    status: str,
    all_skills,
):
    soup = BeautifulSoup(html, "html.parser")

    results = []

    for row in soup.select(
        "table.article-table.sortable.alternating-colors-table tr"
    ):
        name_cell = row.find("center")

        if name_cell is None:
            continue  # header row

        cells = row.find_all("td")

        if len(cells) < 8:
            continue

        (
            name_td,
            quality_td,
            attribute_td,
            weapon_td,
            affiliation_td,
            faction_td,
            class_td,
            version_td,
        ) = cells[:8]

        # -----------------------------------------------------
        # Name
        # -----------------------------------------------------

        name = name_cell.get_text(strip=True)

        # -----------------------------------------------------
        # Build Forte entry
        # -----------------------------------------------------

        forte = {
            "resonance_skill": all_skills[
                "resonance_skill"
            ].get(name),

            "forte_circuit": all_skills[
                "forte_circuit"
            ].get(name),

            "resonance_liberation": all_skills[
                "resonance_liberation"
            ].get(name),

            "intro_skill": all_skills[
                "intro_skill"
            ].get(name),

            "outro_skill": all_skills[
                "outro_skill"
            ].get(name),
        }

        # -----------------------------------------------------
        # Build resonator
        # -----------------------------------------------------

        results.append({
            "name": name,

            "icon": icon_url(name_td),

            "quality": parse_quality(quality_td),

            "element": (
                cell_labels(attribute_td)[-1]
                if cell_labels(attribute_td)
                else None
            ),

            "element_icon": icon_url(attribute_td),

            "weapon": (
                cell_labels(weapon_td)[-1]
                if cell_labels(weapon_td)
                else None
            ),

            "weapon_icon": icon_url(weapon_td),

            "affiliation": (
                ", ".join(cell_labels(affiliation_td))
                or None
            ),

            "faction": (
                ", ".join(cell_labels(faction_td))
                or None
            ),

            "class": (
                class_td.get_text(strip=True)
                or None
            ),

            "version": (
                version_td.get_text(strip=True)
                or None
            ),

            "status": status,

            # -------------------------------------------------
            # All character combat skills
            # -------------------------------------------------

            "forte": forte,
        })

    return results


if __name__ == "__main__":

    # ---------------------------------------------------------
    # Fetch resonator page
    # ---------------------------------------------------------

    print("Fetching resonator data...")

    resonator_html = fetch_html(
        RESONATOR_API_URL
    )

    # ---------------------------------------------------------
    # Fetch all skill pages
    # ---------------------------------------------------------

    print("\nFetching skill data...")

    all_skills = parse_all_skills()

    # ---------------------------------------------------------
    # Split released / upcoming resonators
    # ---------------------------------------------------------

    marker = 'id="Announced_Upcoming_Resonators"'

    if marker in resonator_html:
        released_html, upcoming_html = (
            resonator_html.split(marker, 1)
        )
    else:
        released_html = resonator_html
        upcoming_html = ""

    # ---------------------------------------------------------
    # Parse resonators
    # ---------------------------------------------------------

    resonators = parse_resonators(
        released_html,
        "released",
        all_skills,
    )

    resonators += parse_resonators(
        upcoming_html,
        "upcoming",
        all_skills,
    )

    print(
        f"\nParsed {len(resonators)} resonators."
    )

    # ---------------------------------------------------------
    # Print an example
    # ---------------------------------------------------------

    if resonators:
        print("\nExample resonator:")

        print(
            json.dumps(
                resonators[0],
                indent=2,
                ensure_ascii=False,
            )
        )

    # ---------------------------------------------------------
    # Report missing skills
    # ---------------------------------------------------------

    print("\nChecking for missing skills...")

    for skill_type in SKILL_PAGES:
        missing = [
            resonator["name"]
            for resonator in resonators
            if resonator["forte"][skill_type] is None
        ]

        if missing:
            print(
                f"\n{skill_type.replace('_', ' ').title()}"
                " missing for:"
            )

            for name in missing:
                print(f"  - {name}")

    # ---------------------------------------------------------
    # Save
    # ---------------------------------------------------------

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with OUTPUT_PATH.open(
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(
            resonators,
            f,
            indent=2,
            ensure_ascii=False,
        )
        f.write("\n")

    print(
        f"\nSaved {len(resonators)} resonators to "
        f"{OUTPUT_PATH}"
    )