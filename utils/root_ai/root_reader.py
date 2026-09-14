import json

with open("root_law.json", "r", encoding="utf-8") as f:
    rules = json.load(f)

for rule in rules:
    print("=" * 40)
    print(f"Rule Number: {rule['rule_number']}")
    print(f"Rule Text: {rule['rule_text']}")
    print(f"Page Number: {rule['page_number']}")