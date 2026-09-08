import json
from bs4 import BeautifulSoup
from html import unescape


# Paste the entire API response here
RAW_DATA = r'''
PASTE YOUR API RESPONSE HERE
'''


def extract_resonance_skills(raw_data):
    # Parse JSON
    data = json.loads(raw_data)

    # Get the HTML contained in parse.text.*
    html = data["parse"]["text"]["*"]

    # Parse HTML
    soup = BeautifulSoup(html, "html.parser")

    results = []

    # Every skill/character pair is inside a table row
    for row in soup.select("table tr"):
        cells = row.find_all("td")

        if not cells:
            continue

        skill_cell = cells[0]

        # ---------------------------------------------------------
        # Get the RESONANCE SKILL ICON
        # ---------------------------------------------------------
        skill_img = skill_cell.select_one(
            ".wuwa-iconwcaption-img img"
        )

        if not skill_img:
            continue

        # Fandom uses data-src because the images are lazy-loaded
        skill_icon = (
            skill_img.get("data-src")
            or skill_img.get("src")
        )

        if not skill_icon or skill_icon.startswith("data:image"):
            continue

        # ---------------------------------------------------------
        # Get the CHARACTER
        # ---------------------------------------------------------
        character = skill_cell.select_one(
            ".item.resonator .item-text a"
        )

        if not character:
            continue

        character_name = character.get_text(strip=True)

        # ---------------------------------------------------------
        # Get skill name
        # ---------------------------------------------------------
        skill_link = skill_cell.select_one(
            ".wuwa-iconwcaption a"
        )

        skill_name = (
            skill_link.get_text(strip=True)
            if skill_link
            else None
        )

        results.append({
            "character": character_name,
            "skill": skill_name,
            "icon": skill_icon
        })

    return results


# Extract
skills = extract_resonance_skills(RAW_DATA)


# Print results
for skill in skills:
    print(f'{skill["character"]} | {skill["skill"]} | {skill["icon"]}')


# Also save as JSON
with open("resonance_skills.json", "w", encoding="utf-8") as f:
    json.dump(skills, f, indent=2, ensure_ascii=False)

print(f"\nExtracted {len(skills)} resonance skills.")
