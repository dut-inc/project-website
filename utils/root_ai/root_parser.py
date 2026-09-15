from pypdf import PdfReader
import re, json

PDF_PATH = "data/root_law2025.pdf"
OUTPUT_PATH = "data/root_law.json"

reader = PdfReader(PDF_PATH)

rules = []
# RULE_PATTERN =  re.compile(r"^(\d+(?:\.\d+){1,3})\s+(.+)$")
# RULE_PATTERN =  re.compile(r"^((?:\d+(?:\.\d+)*|[A-HJ-V](?:\.\d*)*))\s+(.+)$")
RULE_PATTERN = re.compile(r"^(\d+(?:\.\d+)*|[A-HJ-V]\.\d*(?:\.\d+)*)\s+(.+)$")
# ARTIFACT_PATTERN = r"(?:([A-HJ-Z][A-HJ-Z]))+\b"
ARTIFACT_PATTERN = r"\b(?:([A-HJ-Z])\1)+\b"
# page_number = 4

# text = reader.pages[page_number - 1].extract_text()

# print(repr(text))
LAST_RULE_PAGE = 28 # since enumerate is 0 indexed
def clean_rule_text(rule_text, line=""): # string
    line = re.sub(ARTIFACT_PATTERN, "", line)
    # line = re.sub(r"(?<=\w)\s*-\s*(?=\w)", "", line)
    return rule_text[:-1].strip() + line.strip()

# 5.1.5 has images, might need to manually add this one in.     
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
                if current_rule["rule_text"].endswith("-"):
                    current_rule["rule_text"] = clean_rule_text(current_rule["rule_text"], line)
                rules.append(current_rule)
            current_rule = {
                "rule_number": match.group(1),
                "rule_text": match.group(2).strip(),
                "page_number": pn + 1,
            }
        elif current_rule:
            if current_rule["rule_text"].endswith("-"):
                current_rule["rule_text"] = clean_rule_text(current_rule["rule_text"], line)
            else:
                cleaned_line = re.sub(ARTIFACT_PATTERN, "", line.strip())
                current_rule["rule_text"] += " " + cleaned_line
if current_rule:
    rules.append(current_rule)
with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(rules, f, ensure_ascii=False, indent=4)

print(f"Extracted {len(rules)} rules from {PDF_PATH} and saved to {OUTPUT_PATH}.")