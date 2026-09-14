from pypdf import PdfReader
import re, json

PDF_PATH = "root_law2025.pdf"
OUTPUT_PATH = "root_law.json"

reader = PdfReader(PDF_PATH)

rules = []
# RULE_PATTERN =  re.compile(r"^(\d+(?:\.\d+){1,3})\s+(.+)$")
RULE_PATTERN =  re.compile(r"^((?:\d+(?:\.\d+)*|[A-HK-V](?:\.\d*)*))\s+(.+)$")

# page_number = 30

# text = reader.pages[page_number - 1].extract_text()

# print(repr(text))
LAST_RULE_PAGE = 28 # since enumerate is 0 indexed
current_rule = None
for pn, page in enumerate(reader.pages):
    if pn > LAST_RULE_PAGE:
        break
    text = page.extract_text()
    lines = text.splitlines()
    for line in lines:
        if line == str(pn+1):
            continue
        match = RULE_PATTERN.match(line)
        if match:
            if current_rule:
                rules.append(current_rule)
            current_rule = {
                "rule_number": match.group(1),
                "rule_text": match.group(2).strip(),
                "page_number": pn + 1,
            }
        elif current_rule:
            current_rule["rule_text"] += " " + line.strip()
if current_rule:
    rules.append(current_rule)
with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(rules, f, ensure_ascii=False, indent=4)

print(f"Extracted {len(rules)} rules from {PDF_PATH} and saved to {OUTPUT_PATH}.")