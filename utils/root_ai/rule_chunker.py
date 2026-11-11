import json, re

with open("data/root_law.json", "r", encoding="utf-8") as f:
    rules = json.load(f)

SUBRULE_PATTERN = re.compile(
    r"(?<![\w.])(I|II|III|IV|V|VI)(?=\s{2,})"
)


def chunk_rule(rule):
    rule_number = rule["rule_number"]
    rule_text = rule["rule_text"]
    page_number = rule["page_number"]

    matches = list(SUBRULE_PATTERN.finditer(rule_text))
    if not matches:
        return [rule]

    chunks = []
    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(rule_text)
        subrule_text = rule_text[start:end].strip()

        if subrule_text:
            chunks.append(
                {
                    "rule_number": f"{rule_number}.{match.group(1)}",
                    "rule_text": subrule_text,
                    "page_number": page_number,
                }
            )

    return chunks or [rule]


chunked_rules = [chunk for rule in rules for chunk in chunk_rule(rule)]
with open("data/rules.json", "w", encoding="utf-8") as f:
    json.dump(chunked_rules, f, ensure_ascii=False, indent=4)
