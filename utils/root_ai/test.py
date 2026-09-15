from root_search import search_rules, get_embeddings, semantic_search
import numpy as np
FIRST_TIME = False
questions = [
    "What does defenseless mean?",
    "How many hits can I deal in battle?",
    "Can I move the same warrior multiple times?",
    "How does crafting work?",
    "Can I craft the same persistent effect twice?",
    "How does dominance work?",
    "What happens if I have no warriors defending?",
    "What happens when I attack someone who has no warriors?",
]
QUESTION_NUM = -1
# results = search_rules(questions[QUESTION_NUM])
# print(questions[QUESTION_NUM])
# for result in results:
#     print(
#         f'Search score: {result["score"]}\n'
#         f'{result["rule_number"]}:\n '
#         f'{result["rule_text"]} '
#         f'(page {result["page_number"]})'
#     )
if FIRST_TIME:
    embeddings = get_embeddings()
    print(embeddings.shape)
    np.save("data/rule_embeddings.npy", embeddings)
    
results = semantic_search(
    questions[QUESTION_NUM]
)

for result in results:
    print(
        f'Search score: {result["score"]}\n'
        f'{result["rule_number"]}:\n '
        f'{result["rule_text"]} '
        f'(page {result["page_number"]})'
    )