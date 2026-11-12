// The rules chat: the Gemini tool loop (with a fake Gemini), citations and the
// answer markup. No network.
//
// Run with: npm test   (node --experimental-strip-types --test)

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseChat, parseInline } from "./chatMarkup.ts";
import {
  CHAT_LIMITS,
  DEFAULT_MODELS,
  citationsIn,
  modelList,
  questionContext,
  ruleNumbersIn,
  runChat,
  runTool,
  systemText,
  type ChatEvent,
} from "./geminiChat.ts";
import { factionsIn, rulesLinking } from "./factionLinks.ts";

type Call = { url: string; body: any; key: string | null };

// A fake generateContent: replies are returned in order; each records the request.
type Failure = { status: number; body?: object };

function fakeGemini(replies: (object | Failure)[]) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init.body)), key: new Headers(init.headers).get("x-goog-api-key") });
    const reply = replies.shift() ?? { status: 500 };
    if ("status" in reply) {
      const failure = reply as Failure;
      return new Response(JSON.stringify(failure.body ?? {}), { status: failure.status });
    }
    return new Response(JSON.stringify(reply), { status: 200 });
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

const modelSays = (...parts: object[]) => ({ candidates: [{ content: { role: "model", parts }, finishReason: "STOP" }] });

async function collect(gen: AsyncGenerator<ChatEvent>): Promise<ChatEvent[]> {
  const events: ChatEvent[] = [];
  for await (const event of gen) events.push(event);
  return events;
}

const ask = (text: string) => [{ role: "user" as const, text }];

test("without an API key the chat says it isn't set up", async () => {
  const events = await collect(runChat(ask("hi"), { apiKey: undefined }));
  assert.deepEqual(events.map((e) => e.type), ["error"]);
  assert.equal((events[0] as { code: string }).code, "config");
});

test("tool calls run, are sent back verbatim, and the answer is cited", async () => {
  const call = { functionCall: { id: "c1", name: "get_rule", args: { rule: "6.2.3" } }, thoughtSignature: "sig-abc" };
  const { calls, fetchImpl } = fakeGemini([
    modelSays(call),
    modelSays(
      { text: "thinking...", thought: true },
      { text: "**Short answer:** Field Hospitals, 6.2.3. Also see 4.3 and 99.9." },
    ),
  ]);
  const events = await collect(runChat(ask("What happens when cats die?"), { apiKey: "k", fetch: fetchImpl }));

  assert.deepEqual(events.map((e) => e.type), ["step", "answer"]);
  assert.equal((events[0] as { text: string }).text, "Read 6.2.3");

  assert.equal(calls.length, 2);
  assert.ok(calls[0].url.endsWith(`/models/${DEFAULT_MODELS[0]}:generateContent`));
  assert.equal(calls[0].key, "k");
  assert.match(calls[0].body.systemInstruction.parts[0].text, /Do not answer Root rules questions from memory/);
  assert.deepEqual(
    calls[0].body.tools[0].functionDeclarations.map((d: { name: string }) => d.name),
    ["search_rules", "get_rule", "get_faction_rules", "get_related_rules"],
  );
  // Second request: the model turn verbatim (signature kept), then the result with the call id.
  const [, modelTurn, toolTurn] = calls[1].body.contents;
  assert.deepEqual(modelTurn, { role: "model", parts: [call] });
  assert.equal(toolTurn.role, "user");
  assert.equal(toolTurn.parts[0].functionResponse.id, "c1");
  assert.equal(toolTurn.parts[0].functionResponse.name, "get_rule");
  assert.match(toolTurn.parts[0].functionResponse.response.result, /^# 6\.2\.3 Field Hospitals/);

  const answer = events[1] as Extract<ChatEvent, { type: "answer" }>;
  assert.equal(answer.text, "**Short answer:** Field Hospitals, 6.2.3. Also see 4.3 and 99.9.");
  assert.deepEqual(
    answer.citations.map((c) => [c.number, c.lookedUp, c.checked]),
    [
      ["6.2.3", true, true],
      ["4.3", false, true],
    ],
  );
  assert.equal(answer.citations[0].href, "/board-games/root/rule/6-2-3");
  assert.deepEqual(answer.unknown, ["99.9"]);
});

test("rules linking the factions in a question are given up front", async () => {
  // Owner report 2026-11-11: as the Vagabond, "can I move into a forest with the Knaves in it?"
  // got "yes"; the model never found 18.2.1 (they can't be played in the same game).
  assert.deepEqual(factionsIn("can i move into a forest with the knaves already in it?"), ["knaves-of-the-deepwood"]);
  assert.deepEqual(
    rulesLinking(["vagabond", "knaves-of-the-deepwood"]).map((r) => r.rule_number),
    ["18.2.1", "A.6.5", "A.8.1"],
  );
  assert.deepEqual(rulesLinking(["vagabond"]), [], "one faction links nothing");
  assert.ok(!rulesLinking(["marquise-de-cat", "eyrie-dynasties"]).some((r) => r.rule_number === "5.2"), "lists of every faction aren't links");

  const context = questionContext("can i move into a forest with the knaves already in it?", "vagabond");
  assert.deepEqual(context.factionIds, ["vagabond", "knaves-of-the-deepwood"]);
  assert.match(systemText("vagabond", context), /18\.2\.1 Exclusive with Vagabond: The Knaves of the Deepwood cannot be played in the same game as the Vagabond\./);
  assert.doesNotMatch(systemText(undefined, questionContext("how does battle work")), /These rules from the Law link/);

  const { calls, fetchImpl } = fakeGemini([modelSays({ text: "No: 18.2.1 says they can't share a game." })]);
  const events = await collect(runChat(ask("can i move into a forest with the knaves already in it?"), { apiKey: "k", fetch: fetchImpl, faction: "vagabond" }));
  assert.equal((events[0] as { text: string }).text, "Checked the rules linking the Vagabond and the Knaves of the Deepwood");
  assert.match(calls[0].body.systemInstruction.parts[0].text, /18\.2\.1/);
  const answer = last(events) as Extract<ChatEvent, { type: "answer" }>;
  assert.equal(answer.citations[0].lookedUp, true, "a rule given up front counts as looked up");
});

test("the playing-as faction goes into the instructions", async () => {
  const { calls, fetchImpl } = fakeGemini([modelSays({ text: "ok" })]);
  await collect(runChat(ask("Can I craft?"), { apiKey: "k", fetch: fetchImpl, faction: "vagabond" }));
  assert.match(calls[0].body.systemInstruction.parts[0].text, /playing the Vagabond \(faction id "vagabond"\)/);
});

const last = (events: ChatEvent[]) => events.at(-1) as ChatEvent & { code?: string; model?: string; message?: string };
const modelOf = (call: Call) => /\/models\/([^:]+):/.exec(call.url)![1];

test("a busy, slow, retired or exhausted model hands over to the next", async () => {
  for (const failure of [{ status: 503 }, { status: 500 }, { status: 429 }, { status: 404 }]) {
    const { calls, fetchImpl } = fakeGemini([failure, modelSays({ text: "fine" })]);
    const events = await collect(runChat(ask("q"), { apiKey: "k", fetch: fetchImpl }));
    assert.deepEqual(calls.map(modelOf), DEFAULT_MODELS.slice(0, 2), `status ${failure.status}`);
    assert.equal(last(events).model, DEFAULT_MODELS[1]);
    assert.match((events[0] as { text: string }).text, /is busy; starting again with/);
  }
  // A timeout or network failure (fetch throws).
  let n = 0;
  const flaky = (async () => {
    if (n++ === 0) throw new DOMException("timed out", "TimeoutError");
    return new Response(JSON.stringify(modelSays({ text: "ok" })));
  }) as unknown as typeof fetch;
  assert.equal(last(await collect(runChat(ask("q"), { apiKey: "k", fetch: flaky }))).type, "answer");
});

test("a model that fails mid-answer: the next one starts the answer over", async () => {
  const lookup = modelSays({ functionCall: { name: "get_rule", args: { rule: "4.2" } }, thoughtSignature: "sig" });
  const { calls, fetchImpl } = fakeGemini([lookup, { status: 503 }, modelSays({ text: "Moving is 4.2." })]);
  const events = await collect(runChat(ask("How do I move?"), { apiKey: "k", fetch: fetchImpl }));
  assert.deepEqual(calls.map(modelOf), [DEFAULT_MODELS[0], DEFAULT_MODELS[0], DEFAULT_MODELS[1]]);
  assert.equal(calls[2].body.contents.length, 1, "no turns from the first model");
  assert.equal(last(events).type, "answer");
  // 4.2 was looked up by the first model only, so the answer's citation isn't "looked up".
  assert.equal((last(events) as Extract<ChatEvent, { type: "answer" }>).citations[0].lookedUp, false);
});

test("when every model fails, the message says why", async () => {
  const quota = fakeGemini(DEFAULT_MODELS.map(() => ({ status: 429 })));
  assert.match(last(await collect(runChat(ask("q"), { apiKey: "k", fetch: quota.fetchImpl }))).message!, /quota is used up for today/);
  const mixed = fakeGemini([{ status: 429 }, { status: 503 }, { status: 503 }]);
  const out = last(await collect(runChat(ask("q"), { apiKey: "k", fetch: mixed.fetchImpl })));
  assert.equal(out.code, "busy");
  assert.match(out.message!, /all busy/);
});

test("the models list comes from GEMINI_MODELS; time runs out across models", async () => {
  assert.deepEqual(modelList(" a, b,,c "), ["a", "b", "c"]);
  assert.equal(modelList(""), undefined);
  const custom = fakeGemini([modelSays({ text: "x" })]);
  await collect(runChat(ask("q"), { apiKey: "k", fetch: custom.fetchImpl, models: ["m1", "m2"] }));
  assert.equal(modelOf(custom.calls[0]), "m1");

  let clock = 0;
  const slow = fakeGemini([{ status: 503 }, { status: 503 }]);
  const wrapped = (async (url: string, init: RequestInit) => {
    clock += CHAT_LIMITS.deadlineMs; // each call uses up the whole budget
    return slow.fetchImpl(url, init);
  }) as unknown as typeof fetch;
  const events = await collect(runChat(ask("q"), { apiKey: "k", fetch: wrapped, now: () => clock }));
  assert.equal(slow.calls.length, 1, "no second model after the deadline");
  assert.equal(last(events).code, "busy");
});

test("a bad key is a setup error, not a hand-over", async () => {
  const bad = fakeGemini([{ status: 400, body: { error: { message: "API key not valid. Please pass a valid API key." } } }]);
  const events = await collect(runChat(ask("q"), { apiKey: "k", fetch: bad.fetchImpl }));
  assert.equal(bad.calls.length, 1);
  assert.equal(last(events).code, "config");
});

test("the last round forbids more lookups", async () => {
  const lookup = modelSays({ functionCall: { name: "search_rules", args: { query: "move" } } });
  const replies = Array.from({ length: CHAT_LIMITS.maxToolRounds }, () => lookup);
  const { calls, fetchImpl } = fakeGemini([...replies, modelSays({ text: "Moving is 4.2." })]);
  const events = await collect(runChat(ask("How do I move?"), { apiKey: "k", fetch: fetchImpl }));
  assert.equal(events.at(-1)!.type, "answer");
  assert.equal(calls.at(-1)!.body.toolConfig.functionCallingConfig.mode, "NONE");
  assert.equal(calls[0].body.toolConfig, undefined);
  assert.match(calls.at(-1)!.body.contents.at(-1).parts.at(-1).text, /That was the last lookup/);

  // A model that still asks for lookups on the last round: its text is the answer;
  // with no text there is no answer to give.
  const stubborn = (withText: boolean) =>
    fakeGemini([
      ...replies,
      modelSays(...(withText ? [{ text: "Best effort: 4.2." }] : []), { functionCall: { name: "get_rule", args: { rule: "4.2" } } }),
    ]);
  const late = stubborn(true);
  assert.equal(last(await collect(runChat(ask("q"), { apiKey: "k", fetch: late.fetchImpl }))).type, "answer");
  const none = stubborn(false);
  assert.equal(last(await collect(runChat(ask("q"), { apiKey: "k", fetch: none.fetchImpl, models: ["only"] }))).code, "upstream");
});

test("tools describe themselves for the progress list", () => {
  assert.equal(runTool("search_rules", { query: "ambush", faction: "vagabond" }).step, "Searched “ambush” (Vagabond)");
  assert.equal(runTool("get_related_rules", { rule: "4.3.1" }).step, "Checked rules related to 4.3.1");
  assert.equal(runTool("get_faction_rules", { faction: "lizard-cult" }).step, "Read the Lizard Cult rules (outline)");
  assert.match(runTool("get_rule", { rule: "99.9" }).output, /No rule "99\.9"/);
});

test("rule numbers are found in prose", () => {
  assert.deepEqual(ruleNumbersIn("See 6.2.3, 4.3.5.II and 9.2.9.IIIa; also G.20. Not v1.2.3 or 12x.3."), [
    "6.2.3",
    "4.3.5.II",
    "9.2.9.IIIa",
    "G.20",
  ]);
  assert.deepEqual(citationsIn("Nothing here.", new Set()), { citations: [], unknown: [] });
});

test("answer markup: blocks, emphasis, rule links, no foreign links", () => {
  const links = { "6.2.3": "/board-games/root/rule/6-2-3" };
  const blocks = parseChat("**Short answer:** yes, per 6.2.3.\n\n- one *two*\n- three\n\n1. first\n2. second", links);
  assert.deepEqual(
    blocks.map((b) => b.kind),
    ["p", "ul", "ol"],
  );
  assert.deepEqual(blocks[0], {
    kind: "p",
    lines: [
      [
        { kind: "strong", children: [{ kind: "text", text: "Short answer:" }] },
        { kind: "text", text: " yes, per " },
        { kind: "link", text: "6.2.3", href: "/board-games/root/rule/6-2-3" },
        { kind: "text", text: "." },
      ],
    ],
  });
  assert.deepEqual(parseInline("[evil](https://evil.test) and [ok](/board-games/root/rule/4-2)"), [
    { kind: "text", text: "evil" },
    { kind: "text", text: " and " },
    { kind: "link", text: "ok", href: "/board-games/root/rule/4-2" },
  ]);
  assert.deepEqual(parseInline("2 * 3 * 4"), [{ kind: "text", text: "2 * 3 * 4" }]);
  assert.deepEqual(parseInline("<script>x</script>"), [{ kind: "text", text: "<script>x</script>" }]);
});
