# Root Rules Encyclopedia --- Agent Instructions

## Mission

Build a practical, searchable, interactive website for the board game
**Root** and its faction-specific rules. The source of truth is the Law
of Root PDF supplied by the project owner.

The goal is not to make a PDF viewer or a generic chatbot. Build a
**Root Rules Encyclopedia**: a structured rule database with
faction-focused views, cross-references, powerful search, and (later) an
AI rules assistant that explains answers with precise citations.

Prioritize correctness, traceability to the official rulebook, and
usefulness during an active game.

------------------------------------------------------------------------

## Product principles

1.  **The official rulebook is the source of truth.** Never invent,
    silently rewrite, or infer a rule that is not supported by the
    supplied rulebook or another explicitly approved official source.
2.  **Structure before AI.** First make the rules machine-readable and
    navigable. Do not begin by building a vector database, RAG pipeline,
    knowledge graph, MCP server, or autonomous rules engine.
3.  **One canonical copy of each rule.** A rule may appear in many
    faction/topic views, but it should normally be stored once and
    referenced by ID. Avoid manually duplicating rule text because
    copies will drift out of sync.
4.  **Faction-first UX.** Players should be able to open their faction
    and quickly find its rules, including general rules and rules that
    interact with that faction.
5.  **Every answer should be traceable.** Display rule numbers, titles,
    and source page references. AI-generated explanations must cite the
    exact rules used.
6.  **Be explicit about uncertainty.** If the source is ambiguous,
    incomplete, or does not answer a question, say so. Do not
    confidently guess.
7.  **Optimize for table use.** Make common information quick to find,
    readable on phones, and easy to navigate during a game.

------------------------------------------------------------------------

## Product scope and priorities

### Phase 0 --- Inspect and understand the source

Before implementing the data model:

-   Locate and inspect the supplied Law of Root PDF.
-   Identify its edition/version, table of contents, section hierarchy,
    rule numbering, faction sections, glossary/index, diagrams,
    footnotes, and page numbering.
-   Determine whether the PDF has selectable text or requires OCR.
-   Preserve exact rule numbers and source page references.
-   Identify rules that are repeated, referenced, or modified by
    faction-specific exceptions.
-   Record extraction uncertainties for manual review rather than
    silently correcting them.

Do not assume the rulebook's exact section structure or faction roster
in advance. Derive these from the supplied PDF and keep the data model
flexible enough to support expansions, updated editions, and additional
content.

### Phase 1 --- Structured rulebook website (MVP)

Build this before adding AI.

Required capabilities:

-   Browse all rules in their original lawbook order.
-   Browse rules by faction.
-   Browse rules by topic/tag.
-   Search across the entire rulebook.
-   Search within a selected faction or topic.
-   Filter search results by faction, topic, section, and (if useful)
    rule type.
-   Open a rule directly using its stable rule ID or URL.
-   Show rule number, title, text, source page, and section.
-   Link references to other rules when the source identifies them or
    when a relationship has been carefully verified.
-   Show related rules and relevant faction/topic labels.
-   Provide a clear way to return to the previous list or search
    results.
-   Make the interface responsive, with special attention to phone-sized
    screens.

Suggested navigation:

-   **All Rules**
-   **Core Rules**
-   **Factions**
    -   One page per faction found in the supplied rulebook
-   **Topics**
    -   Examples might include movement, battle, crafting, pieces,
        cards, relationships, hostility, dominance, scoring, and
        clearing control. Treat these as initial examples, not a fixed
        list.
-   **Search**

A faction page should be a useful player reference, not merely a copy of
the faction's own chapter. It should include:

1.  The faction's own rules, in a sensible order.
2.  General rules that directly affect how that faction plays.
3.  Rules from other sections that directly interact with the faction.
4.  Commonly relevant cross-faction interactions.
5.  Links to the original canonical rule entries.

Use headings or groups to distinguish faction-specific rules from
general rules that apply to the faction.

### Phase 2 --- Better search and rule relationships

After the MVP is working and the rule data has been checked:

-   Add robust full-text search (keyword matching, phrase matching, and
    ranking).
-   Support synonyms and common player language where useful.
-   Add manually verified tags and relationships between rules.
-   Add a "related rules" panel.
-   Make rule references clickable wherever possible.
-   Consider hybrid search: combine ordinary full-text search with
    semantic/vector search.
-   Keep filters such as faction and topic as explicit metadata filters;
    do not rely on embeddings to enforce them.

Semantic search is an enhancement, not a replacement for exact search.
Exact rule numbers and distinctive terms must remain easy to find.

### Phase 3 --- AI Rules Assistant (RAG)

Only add this after the structured rules and search are reliable.

The assistant should:

1.  Accept a natural-language rules question.
2.  Retrieve relevant canonical rules from the structured rule store.
3.  Respect selected faction/topic filters when supplied.
4.  Use retrieved rule text as its evidence.
5.  Explain the answer in plain language.
6.  Cite the exact rule numbers and link to the corresponding rule
    entries.
7.  Distinguish direct rule text from the assistant's interpretation or
    synthesis.
8.  State when the retrieved evidence is insufficient or conflicting.

**Grounding requirements:**

-   The assistant must not answer from general model knowledge when the
    answer depends on Root rules.
-   It must not invent rule numbers, quotations, exceptions, or faction
    abilities.
-   It should retrieve multiple rules when an interaction spans multiple
    sections.
-   It should quote only short excerpts when useful; prefer concise
    paraphrases with citations.
-   If no reliable supporting rule is found, say that it cannot
    determine the answer from the indexed source and offer the closest
    relevant rules.
-   When a question is ambiguous, ask one targeted clarifying question
    or clearly state the assumptions used.
-   If two rules appear to conflict, show both citations and explain the
    apparent interaction without inventing a resolution.

Example answer format:

> **Short answer:** \[Answer, with any necessary qualification.\]
>
> **Why:** \[Brief explanation of how the relevant rules interact.\]
>
> **Relevant rules:** \[Rule number and title\] · \[Rule number and
> title\]
>
> **Source:** \[Links to the canonical rule entries and source pages.\]

RAG means retrieval-augmented generation: retrieve relevant rules first,
then provide those rules to the language model as context. The model
should explain the retrieved evidence, not act as the source of truth.

### Phase 4 --- Advanced interaction model (optional)

Do not build this until real usage demonstrates a need.

Potential future features:

-   A structured interaction explorer for questions involving multiple
    factions, actions, pieces, relationships, or game states.
-   A knowledge graph representing entities and relationships such as
    factions, pieces, actions, clearings, items, statuses, and rules.
-   A deterministic rules engine for narrowly defined interactions where
    the rules can be represented unambiguously.
-   An AI tool interface or MCP server that exposes safe, read-only
    operations such as `search_rules`, `get_rule`, `get_faction_rules`,
    and `get_related_rules`.

A knowledge graph is useful when users need to traverse complex
relationships. It is not required for basic browsing or search. MCP is
an integration protocol for exposing tools/data to AI clients; it is not
a database, search algorithm, or substitute for the website.

Do not claim that an interaction engine can resolve every game situation
unless its logic has been explicitly implemented and tested against the
source rules.

------------------------------------------------------------------------

## Data model

Use a normalized, canonical rule store. Adapt the exact implementation
to the project's existing stack, but preserve these concepts.

### Rule

Each rule should have fields equivalent to:

-   `id`: stable internal identifier, such as `rule-9-5-4`.
-   `rule_number`: exact printed rule number, if one exists.
-   `title`: rule heading.
-   `text`: faithful extracted rule text.
-   `section_id`: parent section.
-   `source_page_start`: page in the source PDF.
-   `source_page_end`: optional ending page.
-   `faction_ids`: factions directly relevant to the rule.
-   `topic_ids`: relevant topics/tags.
-   `related_rule_ids`: verified links to other rules.
-   `cross_references`: references explicitly present in the source.
-   `rule_type`: optional classification, such as core,
    faction-specific, exception, clarification, or glossary.
-   `source_version`: rulebook edition/version.
-   `verification_status`: for example `unreviewed`, `verified`, or
    `needs_review`.
-   `notes`: internal editorial notes; do not present these as official
    rule text.

Use stable IDs that do not depend on a rule's title or current position
in the UI. If rule numbering changes between editions, preserve
edition/version information and avoid overwriting historical source data
without an explicit migration.

### Faction

Each faction should have:

-   `id`
-   `name`
-   `short_name` or display label, if useful
-   `description`, only if supported by approved source material
-   `rule_ids` or a queryable relationship to rules
-   optional icon/color/theme metadata for presentation

Populate factions from the actual source PDF rather than assuming a
fixed list.

### Topic

Each topic should have:

-   `id`
-   `name`
-   optional description
-   relationships to relevant rules

Use a controlled topic vocabulary where practical. Avoid creating many
near-duplicate tags.

### Section

Represent the original rulebook hierarchy:

-   `id`
-   `title`
-   `parent_section_id`
-   `order`
-   `rule_ids`

### Relationships

Keep relationships explicit and typed when useful. Examples:

-   `references`
-   `clarifies`
-   `modifies`
-   `exception_to`
-   `interacts_with`
-   `applies_to_faction`
-   `covers_topic`

Only create a relationship when it is supported by the source or has
been manually verified. Distinguish explicit source cross-references
from editorially added "related rule" links.

### Example record (illustrative only)

``` json
{
  "id": "rule-example",
  "rule_number": "X.Y.Z",
  "title": "Example rule title",
  "text": "Exact or faithfully extracted rule text goes here.",
  "section_id": "section-example",
  "source_page_start": 12,
  "faction_ids": ["faction-example"],
  "topic_ids": ["movement"],
  "related_rule_ids": ["rule-another-example"],
  "source_version": "edition-identifier",
  "verification_status": "unreviewed"
}
```

This is a schema illustration, not a claim about an actual Root rule. Do
not use placeholder data as real rules.

------------------------------------------------------------------------

## Faction views and the duplication question

The product should behave as if relevant rules are collected under each
faction, even though the underlying rule text is stored once.

For example, a rule may be visible in:

-   All Rules
-   Core Rules
-   A faction page
-   A topic page
-   Search results
-   Another faction's interaction section

All these views should point to the same canonical rule ID.

On a faction page, consider these groups:

-   **Faction rules** --- rules from that faction's own section.
-   **General rules that apply** --- shared rules relevant to the
    faction.
-   **Interactions and exceptions** --- rules from other sections that
    directly affect the faction.
-   **Related rules** --- useful adjacent rules that may not directly
    apply.

Do not label a rule as directly applicable merely because it mentions a
faction in passing. Use meaningful relevance criteria and allow
uncertain classifications to be reviewed.

This gives users the convenience of duplicated presentation without
duplicated source content or synchronization problems.

------------------------------------------------------------------------

## PDF ingestion and content quality

When importing the PDF:

-   Preserve printed rule numbering and headings.
-   Preserve paragraph/list structure where it affects meaning.
-   Preserve qualifiers, exceptions, and conditions exactly.
-   Keep page references to the original PDF.
-   Detect and flag broken reading order, split columns, tables,
    footnotes, and OCR errors.
-   Do not merge separate rules into one chunk if doing so loses their
    individual IDs.
-   Do not split a rule so aggressively that its conditions or
    exceptions become detached from it.
-   Store the original source PDF and the extracted structured data
    separately.
-   Keep extraction provenance so a reviewer can compare each record
    with the PDF.

Every rule should have an identifiable source location. Rules that have
not been checked should be marked as unverified and should not be
treated as authoritative by the AI assistant.

If the PDF is updated, support re-ingestion and comparison rather than
silently replacing existing content.

------------------------------------------------------------------------

## Search behavior

Search should support:

-   Exact rule numbers.
-   Rule titles.
-   Exact words and phrases.
-   Natural-language descriptions and common player phrasing.
-   Faction filters.
-   Topic filters.
-   Original section filters.

Search results should show:

-   Rule number and title.
-   A short relevant excerpt or highlighted match.
-   Faction/topic labels where useful.
-   Source page.
-   A link to open the full rule.

If a faction page is active, provide an obvious option to search only
within that faction's relevant rules or search the entire rulebook.

Do not make vector search a prerequisite for the MVP. A well-indexed
full-text search with metadata filters is the first implementation
target.

------------------------------------------------------------------------

## UI/UX guidance

The interface should feel like a reference tool used during a live board
game.

Prioritize:

-   Fast loading and low interaction friction.
-   Responsive mobile layout.
-   Readable rule text and clear hierarchy.
-   Persistent or easily accessible search.
-   Clear faction navigation.
-   Breadcrumbs or other orientation cues.
-   Clickable rule references.
-   A visible source/page reference.
-   Copyable or shareable deep links to individual rules.
-   A clear distinction between official rule text and editorial
    explanation.
-   Accessible contrast, keyboard navigation, and semantic markup.

Avoid overloading the first version with dashboards, animations,
elaborate visualizations, or AI chat that competes with the rulebook
itself.

Potential useful additions after the basics:

-   Recently viewed rules.
-   Favorites/bookmarks.
-   "Common interactions" shortcuts.
-   A compact game-table view.
-   A "show related rules" control.
-   Shareable links to a faction or rule.

------------------------------------------------------------------------

## Technical architecture guidance

Choose tools that fit the existing repository. Do not introduce
infrastructure without a concrete need.

A sensible conceptual architecture is:

``` text
Law of Root PDF
      |
      v
PDF extraction / OCR
      |
      v
Reviewable structured rule data
      |
      v
Canonical rule store
      |
      +------ Full-text search
      |
      +------ Faction/topic metadata
      |
      +------ Rule relationships
      |
      v
Root Rules Encyclopedia website
      |
      +------ Faction pages
      +------ Rule pages
      +------ Search and filters
      +------ Related-rule navigation
      |
      v
Later: semantic retrieval + RAG assistant
      |
      v
Optional: knowledge graph / deterministic interaction tools
```

Possible implementation choices (select based on the current project;
these are not mandatory):

-   A relational database or structured JSON files for canonical rule
    records.
-   Full-text search provided by the database or a lightweight search
    library.
-   A vector store only when semantic search is justified by real
    queries.
-   An LLM API for RAG only after reliable retrieval and citation
    mapping exist.
-   A graph database only if relationship traversal becomes a real
    requirement.

Do not add a vector database, graph database, separate backend service,
or MCP server merely because those technologies were mentioned. Prefer
the simplest architecture that meets the current requirements.

------------------------------------------------------------------------

## Testing and acceptance criteria

The MVP is ready when:

1.  The PDF's rule sections and rule numbers are represented accurately.
2.  A user can browse the original lawbook hierarchy.
3.  A user can open each faction page and find its own rules plus
    relevant shared/interaction rules.
4.  A rule shown in multiple places resolves to one canonical record.
5.  Full-text search works across the entire rulebook.
6.  Search can be restricted to a faction or other relevant filter.
7.  Rule references and related-rule links navigate to the correct
    records.
8.  Every rule page identifies its source page and rule number where
    available.
9.  The interface works on desktop and mobile.
10. Unverified extraction or classification is visible to maintainers
    and is not presented as confirmed fact.

For the later AI assistant, add tests with known rules questions,
including:

-   Straightforward questions answered by one rule.
-   Questions requiring multiple rules.
-   Faction-specific exceptions.
-   Questions with ambiguous wording.
-   Questions the rulebook does not answer.
-   Questions containing false assumptions.

The assistant passes only when its answer is supported by the cited
source rules and it handles insufficient evidence appropriately.

------------------------------------------------------------------------

## Agent workflow

Work incrementally and keep the project runnable.

1.  Inspect the repository, existing framework, conventions, and
    supplied PDF before making architectural decisions.
2.  Report a concise implementation plan based on what is actually
    present.
3.  Identify the PDF edition and inspect its structure.
4.  Propose the canonical data schema and a small representative
    extraction sample.
5.  Validate that sample against the PDF before processing the entire
    book.
6.  Implement the MVP in small, testable steps.
7.  Keep extracted content separate from presentation code.
8.  Add tests for parsing, IDs, cross-references, filters, and search.
9.  Document how to re-import or update the PDF.
10. Only propose Phase 2/3 infrastructure when the MVP is working or a
    concrete limitation justifies it.

When making changes:

-   Follow existing project conventions unless there is a clear reason
    not to.
-   Avoid unnecessary dependencies.
-   Do not rewrite unrelated parts of the application.
-   Do not fabricate missing source content.
-   Flag assumptions and unresolved questions.
-   Keep a short changelog or implementation notes.
-   Run relevant tests and checks after changes.
-   Summarize what changed, how to run it, and what remains incomplete.

------------------------------------------------------------------------

## Out of scope for the initial MVP

Unless the project owner explicitly asks, do not initially build:

-   A fully automated game-state referee.
-   A deterministic engine for every possible faction interaction.
-   A knowledge graph database.
-   An MCP server.
-   A vector database or embedding pipeline.
-   A chatbot that answers without citations.
-   A replacement for the official rulebook.

These may become valuable later, but they are not prerequisites for a
useful first release.

------------------------------------------------------------------------

## Final product vision

Build a **Root Rules Encyclopedia** that combines:

-   The reliability and precise numbering of the official Law of Root.
-   The convenience of faction-specific rule collections.
-   The discoverability of strong full-text and eventually semantic
    search.
-   A web of verified links between related rules.
-   Eventually, an AI rules assistant that cites its evidence and admits
    uncertainty.

The core idea is:

**Make the rules structured and trustworthy first. Make them easy to
navigate second. Add AI only when it can make that reliable foundation
more useful.**
