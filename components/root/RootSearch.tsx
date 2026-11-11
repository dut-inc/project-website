"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { factionHref, ruleHref, searchHref } from "@/lib/root/paths";
import { search, type IndexRecord, type Segment } from "@/lib/root/search";

// The search page. Runs entirely in the browser over the index the page was
// built with. The URL (?q=&faction=&chapter=) holds the search, so results can
// be shared and the back button returns to them.

export type FactionOption = { id: string; name: string; color: string };
export type ChapterOption = { id: string; label: string; group: "core" | "faction" | "appendix" };

const PAGE = 40;
const EXAMPLES = ["4.3.2", "ambush", "\"three actions\"", "hostile", "G.20"];

function Highlighted({ segments }: { segments: Segment[] }) {
  return (
    <>
      {segments.map((s, i) =>
        s.hit ? (
          <mark key={i} className="rounded-sm bg-[#c9a66b]/25 px-0.5 text-studio-bright">
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}

export type TopicOption = { id: string; name: string };

export default function RootSearch({
  index,
  factions,
  chapters,
  topics,
}: {
  index: IndexRecord[];
  factions: FactionOption[];
  chapters: ChapterOption[];
  topics: TopicOption[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const factionById = useMemo(() => new Map(factions.map((f) => [f.id, f])), [factions]);
  const chapterById = useMemo(() => new Map(chapters.map((c) => [c.id, c])), [chapters]);
  const topicById = useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);

  // The page owns the search state. The URL is read once, when the page opens,
  // and written back as the search changes, so a search can be shared or
  // reloaded. (On this static page, useSearchParams didn't follow URL changes
  // made from the page, by router.replace or history.replaceState.)
  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const [faction, setFaction] = useState(() => {
    const id = params.get("faction") ?? "";
    return factionById.has(id) ? id : "";
  });
  const [chapter, setChapter] = useState(() => {
    const id = params.get("chapter") ?? "";
    return chapterById.has(id) ? id : "";
  });
  const [topic, setTopic] = useState(() => {
    const id = params.get("topic") ?? "";
    return topicById.has(id) ? id : "";
  });
  const [shown, setShown] = useState(PAGE);
  const filters = { faction: faction || undefined, chapter: chapter || undefined, topic: topic || undefined };
  const results = useMemo(
    () => search(index, query, { faction: faction || undefined, chapter: chapter || undefined, topic: topic || undefined }),
    [index, query, faction, chapter, topic],
  );

  useEffect(() => {
    const href = searchHref({ q: query.trim(), faction: faction || undefined, chapter: chapter || undefined, topic: topic || undefined });
    if (window.location.pathname + window.location.search === href) return;
    const timer = window.setTimeout(() => window.history.replaceState(window.history.state, "", href), 250);
    return () => window.clearTimeout(timer);
  }, [query, faction, chapter, topic]);

  function setFilter(name: "faction" | "chapter" | "topic", value: string) {
    setShown(PAGE);
    if (name === "faction") setFaction(value);
    else if (name === "chapter") setChapter(value);
    else setTopic(value);
  }

  // Enter on an exact rule number opens it.
  function submit(event: FormEvent) {
    event.preventDefault();
    const top = results[0];
    if (top?.kind === "number" && top.score === 1000) router.push(ruleHref(top.record.id));
  }

  const activeFaction = filters.faction ? factionById.get(filters.faction) : undefined;
  const q = query.trim();
  const groups: [ChapterOption["group"], string][] = [
    ["core", "Core rules"],
    ["faction", "Factions"],
    ["appendix", "Appendices"],
  ];

  return (
    <div className="max-w-3xl">
      <form onSubmit={submit} role="search">
        <label htmlFor={inputId} className="sr-only">
          Search the Law
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setShown(PAGE);
          }}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          placeholder={activeFaction ? `Search the ${activeFaction.name}'s rules` : "A rule number, a word, or a \"phrase\""}
          className="h-12 w-full rounded-md border border-studio-border bg-studio-chrome px-4 text-[16px] text-studio-bright outline-none placeholder:text-studio-muted/60 focus:border-studio-accent"
        />
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <label className="flex flex-col gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-studio-muted">
            Faction
            <select
              value={filters.faction ?? ""}
              onChange={(event) => setFilter("faction", event.target.value)}
              className="h-10 rounded-md border border-studio-border bg-studio-chrome px-2 font-body text-[14px] normal-case tracking-normal text-studio-bright outline-none focus:border-studio-accent"
            >
              <option value="">All factions</option>
              {factions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-studio-muted">
            Chapter
            <select
              value={filters.chapter ?? ""}
              onChange={(event) => setFilter("chapter", event.target.value)}
              className="h-10 rounded-md border border-studio-border bg-studio-chrome px-2 font-body text-[14px] normal-case tracking-normal text-studio-bright outline-none focus:border-studio-accent"
            >
              <option value="">All chapters</option>
              {groups.map(([group, label]) => (
                <optgroup key={group} label={label}>
                  {chapters
                    .filter((c) => c.group === group)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-studio-muted">
            Topic
            <select
              value={filters.topic ?? ""}
              onChange={(event) => setFilter("topic", event.target.value)}
              className="h-10 rounded-md border border-studio-border bg-studio-chrome px-2 font-body text-[14px] normal-case tracking-normal text-studio-bright outline-none focus:border-studio-accent"
            >
              <option value="">All topics</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </form>

      {activeFaction && (
        <p className="mt-4 rounded-md border border-studio-border bg-white/[0.02] px-3 py-2 text-[13px] leading-relaxed">
          <span aria-hidden className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: activeFaction.color }} />
          Searching what the{" "}
          <Link href={factionHref(activeFaction.id)} className="text-studio-link hover:underline">
            {activeFaction.name} page
          </Link>{" "}
          lists: its chapter, the rules it changes, and the rules that name it.{" "}
          <button type="button" onClick={() => setFilter("faction", "")} className="text-studio-link hover:underline">
            Search all factions
          </button>
        </p>
      )}

      <div aria-live="polite" className="mt-6">
        {!q ? (
          <div className="text-[14px] leading-relaxed text-studio-muted">
            <p>Search by rule number, by words (all must match; “craft” also finds “crafting”), or by a phrase in quotes.</p>
            <p className="mt-3 flex flex-wrap items-center gap-2">
              Try
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    setQuery(example);
                    inputRef.current?.focus();
                  }}
                  className="rounded-full border border-studio-border px-2.5 py-0.5 font-mono text-[12px] text-studio-text hover:border-studio-muted hover:text-studio-bright"
                >
                  {example}
                </button>
              ))}
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-[14px] text-studio-muted">
            <p>No rules match “{q}”{filters.faction || filters.chapter || filters.topic ? " with these filters" : ""}.</p>
            {(filters.faction || filters.chapter || filters.topic) && (
              <button
                type="button"
                onClick={() => {
                  setFaction("");
                  setChapter("");
                  setTopic("");
                }}
                className="mt-2 text-studio-link hover:underline"
              >
                Search the whole Law instead
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-studio-muted">
              {results.length} {results.length === 1 ? "result" : "results"}
              {results[0].kind === "number" && " · by rule number"}
            </p>
            <ol className="divide-y divide-studio-border border-y border-studio-border">
              {results.slice(0, shown).map(({ record, excerpt, titleSegments, kind, score }) => {
                const recordChapter = chapterById.get(record.chapterId);
                return (
                  <li key={record.id}>
                    <Link
                      href={ruleHref(record.id)}
                      className={`block px-1 py-3.5 transition-colors hover:bg-white/[0.03] ${
                        kind === "number" && score === 1000 ? "bg-studio-selected/30" : ""
                      }`}
                    >
                      <span className="flex flex-wrap items-baseline gap-x-2.5">
                        {record.number && <span className="font-mono text-[13px] text-studio-link">{record.number}</span>}
                        <span className="font-semibold text-studio-bright">
                          <Highlighted segments={titleSegments} />
                        </span>
                        <span className="ml-auto font-mono text-[11px] text-studio-muted">p. {record.page}</span>
                      </span>
                      {excerpt.length > 0 && (
                        <span className="mt-1 block text-[14px] leading-relaxed text-studio-text/90">
                          <Highlighted segments={excerpt} />
                        </span>
                      )}
                      {recordChapter && <span className="mt-1 block text-[12px] text-studio-muted">{recordChapter.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ol>
            {results.length > shown && (
              <button
                type="button"
                onClick={() => setShown((n) => n + PAGE * 2)}
                className="mt-4 rounded-md border border-studio-border px-4 py-2 text-[14px] text-studio-text hover:border-studio-muted hover:text-studio-bright"
              >
                Show more ({results.length - shown} left)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
