import json, re
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

with open("data/rules.json", "r", encoding="utf-8") as f:
    rules = json.load(f)

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
texts = [
    f'{rule["rule_number"]} {rule["rule_text"]}'
    for rule in rules
]
rule_embeddings = np.load("data/rule_embeddings.npy")

def get_embeddings(text_list = texts):
    embeddings = model.encode(texts, convert_to_numpy=True)
    return embeddings

def semantic_search(query, limit=10):
    query_embedding = model.encode([query], convert_to_numpy=True)
    similarities = cosine_similarity(query_embedding, rule_embeddings)[0]
    top_indices = similarities.argsort()[::-1][:limit]
    results = []
    for idx in top_indices:
        rule = rules[idx]
        rule["score"] = similarities[idx]
        results.append(rule)
    return results

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
