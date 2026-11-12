"use client";

import Link from "next/link";
import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { parseChat, type ChatInline } from "@/lib/root/chatMarkup";
import type { ChatEvent, Citation } from "@/lib/root/geminiChat";
import { Paper } from "./ui";

// The rules chat, as a panel that fills its container's height (the dashboard
// and /board-games/root/ask). Questions go to /api/root/chat, which answers
// with Gemini and the read-only rule tools, streaming progress lines and then
// the answer. Messages scroll inside the panel; the conversation is kept for
// this browser tab.

type Turn =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; citations: Citation[]; unknown: string[] }
  | { role: "error"; text: string };

const STORAGE_KEY = "root-rules-chat-v1";
const ENDPOINT = "/api/root/chat";
const MAX_INPUT_LINES = 4;

export default function RulesChat({ factions }: { factions: { id: string; name: string }[] }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [faction, setFaction] = useState("");
  const [input, setInput] = useState("");
  const [steps, setSteps] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const inputId = useId();
  const factionId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const restored = useRef(false);

  // The question box fits its text: one line empty, up to four, then it scrolls.
  useLayoutEffect(() => {
    const box = inputRef.current;
    if (!box) return;
    const style = getComputedStyle(box);
    const line = parseFloat(style.lineHeight) || 24;
    const chrome = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    const max = line * MAX_INPUT_LINES + chrome;
    box.style.height = "auto";
    const wanted = box.scrollHeight + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    box.style.height = `${Math.min(wanted, max)}px`;
    box.style.overflowY = wanted > max ? "auto" : "hidden";
  }, [input]);

  // Restore this tab's conversation, and ?faction= from the URL (read once).
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
      if (saved && Array.isArray(saved.turns)) {
        setTurns(saved.turns); // eslint-disable-line react-hooks/set-state-in-effect
        if (typeof saved.faction === "string") setFaction(saved.faction);
      }
    } catch {}
    const fromUrl = new URLSearchParams(window.location.search).get("faction");
    if (fromUrl && factions.some((f) => f.id === fromUrl)) setFaction(fromUrl);
    restored.current = true;
  }, [factions]);

  useEffect(() => {
    if (!restored.current) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ turns: turns.slice(-40), faction }));
    } catch {}
  }, [turns, faction]);

  // Keep the newest message in view, inside the panel only.
  useEffect(() => {
    const box = scrollRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [turns, steps, pending]);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || pending) return;
    const history = [...turns, { role: "user" as const, text }];
    setTurns(history);
    setInput("");
    setSteps([]);
    setPending(true);

    const messages = history
      .filter((t): t is Exclude<Turn, { role: "error" }> => t.role !== "error")
      .map((t) => ({ role: t.role, text: t.text }));

    let finished = false;
    const handle = (event: ChatEvent) => {
      if (event.type === "step") setSteps((s) => [...s, event.text]);
      else if (event.type === "answer") {
        finished = true;
        setTurns((t) => [...t, { role: "assistant", text: event.text, citations: event.citations, unknown: event.unknown }]);
      } else {
        finished = true;
        setTurns((t) => [...t, { role: "error", text: event.message }]);
      }
    };

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages, faction: faction || undefined }),
      });
      if (!response.body) throw new Error("no body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) if (line.trim()) handle(JSON.parse(line) as ChatEvent);
        if (done) break;
      }
      if (buffer.trim()) handle(JSON.parse(buffer) as ChatEvent);
      if (!finished) throw new Error("no answer");
    } catch {
      if (!finished) setTurns((t) => [...t, { role: "error", text: "The answer didn't arrive. Check your connection and try again." }]);
    } finally {
      setPending(false);
      setSteps([]);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    ask(input);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      ask(input);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="font-rootdisplay text-[1.6rem] leading-none text-root-ink">Ask the rules</h2>
        <label htmlFor={factionId} className="sr-only">
          Playing as
        </label>
        <select
          id={factionId}
          value={faction}
          onChange={(event) => setFaction(event.target.value)}
          disabled={pending}
          title="Playing as"
          className="root-field ml-auto h-8 max-w-[12rem] px-1.5 text-[14px] outline-none"
        >
          <option value="">Playing as anyone</option>
          {factions.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        {turns.length > 0 && (
          <button
            type="button"
            onClick={() => setTurns([])}
            disabled={pending}
            className="text-[13px] italic text-root-muted hover:text-root-link disabled:opacity-50"
          >
            clear
          </button>
        )}
      </div>
      <div className="root-squiggle mb-3 mt-1.5 w-36" aria-hidden />

      <div ref={scrollRef} className="-mx-1 min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-2" aria-live="polite">
        {turns.length === 0 && !pending && (
          <div className="flex h-full select-none flex-col items-center justify-center text-center">
            <p className="font-rootdisplay text-6xl italic tracking-tight text-root-ink/40 sm:text-7xl">Let&apos;s Root!</p>
            <p aria-hidden className="mt-3 font-rootdisplay text-3xl text-root-ink/25">❧</p>
          </div>
        )}

        {turns.map((turn, index) => (
          <TurnView key={index} turn={turn} index={index} />
        ))}

        {pending && (
          <div className="text-[14px] text-root-muted">
            <p className="animate-pulse italic">Leafing through the Law…</p>
            {steps.length > 0 && (
              <ul className="mt-1 space-y-0.5 font-rootlabel text-[13px]">
                {steps.map((step, i) => (
                  <li key={i}>❦ {step}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <form onSubmit={submit} className="pt-3">
        <label htmlFor={inputId} className="sr-only">
          Your rules question
        </label>
        {/* One line to start; grows with the text up to four lines, then scrolls. Enter sends. */}
        <textarea
          ref={inputRef}
          id={inputId}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={2000}
          placeholder="Ask about a rule…"
          className="root-field block w-full resize-none overflow-y-hidden px-3 py-2 text-[16px] leading-6 outline-none"
        />
        <p className="mt-2 text-[12px] italic leading-snug text-root-muted">
          Enter to ask, Shift+Enter for a new line. Answers come from Google Gemini (free), which can be wrong; check the
          cited rules. Google may use questions to improve its products.
        </p>
      </form>
    </div>
  );
}

function TurnView({ turn, index }: { turn: Turn; index: number }) {
  if (turn.role === "user") {
    // A torn slip of kraft paper, a little askew.
    return (
      <div className="flex justify-end">
        <Paper
          tone="kraft"
          small
          flat
          edge={(["a", "b", "c"] as const)[index % 3]}
          className="max-w-[85%]"
          style={{ transform: `rotate(${index % 2 ? 0.7 : -0.6}deg)` }}
          innerClassName="whitespace-pre-wrap px-4 py-2.5 text-[15.5px] text-root-ink"
        >
          {turn.text}
        </Paper>
      </div>
    );
  }
  if (turn.role === "error") {
    return (
      <div role="alert" className="border-l-2 border-root-warn pl-3 text-[14px] italic text-root-warn">
        {turn.text}
      </div>
    );
  }
  return <AnswerView text={turn.text} citations={turn.citations} unknown={turn.unknown} />;
}

function AnswerView({ text, citations, unknown }: { text: string; citations: Citation[]; unknown: string[] }) {
  const links = Object.fromEntries(citations.map((c) => [c.number, c.href]));
  const blocks = parseChat(text, links);
  const notLookedUp = citations.filter((c) => !c.lookedUp);
  const seen = new Set<string>();
  const unique = citations.filter((c) => !seen.has(c.id) && seen.add(c.id));

  return (
    <article className="border-l-2 border-root-accent/60 pl-4">
      <div className="space-y-2.5 text-[16px] leading-relaxed text-root-ink2">
        {blocks.map((block, i) =>
          block.kind === "p" ? (
            <p key={i}>
              {block.lines.map((line, j) => (
                <Fragment key={j}>
                  {j > 0 && <br />}
                  <Inline parts={line} />
                </Fragment>
              ))}
            </p>
          ) : (
            <List key={i} ordered={block.kind === "ol"} items={block.items} />
          ),
        )}
      </div>

      {unique.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {unique.map((c) => (
            <li key={c.id}>
              <Link
                href={c.href}
                title={c.checked ? "Text checked by hand against the PDF" : "Text not checked by hand"}
                className="root-token !py-0.5 !pl-2.5 !text-[13px] !text-root-ink"
              >
                {c.label}
                {!c.checked && <span className="text-[11px] italic text-root-muted">unchecked</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {(notLookedUp.length > 0 || unknown.length > 0) && (
        <div className="mt-2 space-y-0.5 text-[13px] italic text-root-warn">
          {notLookedUp.length > 0 && <p>Cited without looking up: {listOf(notLookedUp.map((c) => c.number))}. Check the rule.</p>}
          {unknown.length > 0 && <p>Not in the Law: {listOf(unknown)}. Treat that part with suspicion.</p>}
        </div>
      )}
    </article>
  );
}

function List({ ordered, items }: { ordered: boolean; items: ChatInline[][] }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={`${ordered ? "list-decimal" : "list-disc marker:text-root-accent"} space-y-1 pl-5`}>
      {items.map((item, j) => (
        <li key={j}>
          <Inline parts={item} />
        </li>
      ))}
    </Tag>
  );
}

function listOf(items: string[]): string {
  return items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

function Inline({ parts }: { parts: ChatInline[] }) {
  return (
    <>
      {parts.map((part, i) => {
        switch (part.kind) {
          case "text":
            return <Fragment key={i}>{part.text}</Fragment>;
          case "strong":
            return (
              <strong key={i} className="font-semibold text-root-ink">
                <Inline parts={part.children} />
              </strong>
            );
          case "em":
            return (
              <em key={i}>
                <Inline parts={part.children} />
              </em>
            );
          case "code":
            return (
              <code key={i} className="rounded bg-root-inset px-1 font-rootlabel text-[12px]">
                {part.text}
              </code>
            );
          case "link":
            return (
              <Link key={i} href={part.href} className="text-root-link hover:underline">
                {part.text}
              </Link>
            );
        }
      })}
    </>
  );
}
