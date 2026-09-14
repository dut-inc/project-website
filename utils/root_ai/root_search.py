import json, re
from sentence_transformers import SentenceTransformer

with open("root_law.json", "r", encoding="utf-8") as f:
    rules = json.load(f)

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
texts = [
    f'{rule["rule_number"]} {rule["rule_text"]}'
    for rule in rules
]
def get_embeddings(texts):
    embeddings = model.encode(texts, convert_to_tensor=True)
    return embeddings

def search_rules(query, limit=10):
    query_lower = query.lower()
    query_words = set(
        re.findall(r"\b\w+\b", query_lower)
    )
    results = []
    for rule in rules:
        text = (
            rule["rule_number"] + " " +
            rule["rule_text"]
        ).lower()
        rule_words = set(
            re.findall(r"\b\w+\b", text)
        )
        score = len(query_words & rule_words)
        if score > 0:
            rule["score"] = score
            results.append(rule)
            if len(results) >= limit:
                break
    return results.sort(key=lambda x: x["score"], reverse=True) or results

# results = search_rules("gibberish")
# print(f"Search results for 'gibberish': {len(results)}")
# results2 = search_rules("attacking a clearing with no defending warriors")
# for result in results2:
#     print(
#         f'Search score: {result["score"]}\n'
#         f'{result["rule_number"]}:\n '
#         f'{result["rule_text"]} '
#         f'(page {result["page_number"]})'
#     )
