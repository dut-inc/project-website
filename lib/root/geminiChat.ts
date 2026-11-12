// The website's rules chat: Google Gemini (free tier) answering Root rules
// questions with the same read-only tools as the MCP server (mcpTools.ts).
// app/api/root/chat/route.ts streams runChat()'s events to the browser.
//
// Grounding: the model gets SERVER_INSTRUCTIONS (look rules up, cite numbers,
// flag unchecked rules) and can only see the Law through the tools. After it
// answers, citationsIn() checks every rule number in the answer against the
// rule store and against what the tools actually returned, so the page can
// flag a number the model didn't look up or that doesn't exist.
//
// Gemini REST API (generateContent with function calling). The model's turns
// are sent back exactly as received, which keeps Gemini 3's thought signatures
// intact. No SDK: one fetch call.

import { RULE_NUMBER } from "./chatMarkup.ts";
import { factionsIn, rulesLinking } from "./factionLinks.ts";
import { getFaction, factions, verificationOf, ruleLabel, type Rule } from "./law.ts";
import {
  SERVER_INSTRUCTIONS,
  forAI,
  getFactionRulesText,
  getRelatedRulesText,
  getRuleText,
  resolveRule,
  searchRulesText,
} from "./mcpTools.ts";
import { ruleHref } from "./paths.ts";
import { topics } from "./topics.ts";

// Free-tier models (AI Studio pricing page; tool calling probed 2026-11-11), in
// the order they're tried. Each model has its own free quota, and the free
// tier's models get overloaded at times, so when one is busy, slow or out of
// quota the answer starts again on the next. gemini-3.8-flash is left out: on
// 2026-11-11 it answered 503 "high demand" or timed out on every probe.
// Override with GEMINI_MODELS (comma-separated).
export const DEFAULT_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];

export const CHAT_LIMITS = {
  maxMessages: 20, // conversation turns sent per request
  maxMessageChars: 2000,
  maxToolRounds: 6, // tool round trips before the model must answer
  requestTimeoutMs: 20_000, // one Gemini call; a slower model is skipped
  deadlineMs: 55_000, // the whole answer (the route's maxDuration is 60 s)
};

const API = "https://generativelanguage.googleapis.com/v1beta/models";

export const CHAT_INSTRUCTIONS = `${SERVER_INSTRUCTIONS}

You are the rules assistant on the Root Assistant website. People ask you during a game, often on a phone.
- Only help with the rules of Root. For anything else, say in one sentence that you can only answer questions about the Law of Root.
- Every statement about the rules must come from a rule you looked up in this conversation, cited by number. Don't mention exceptions, factions, maps or components you haven't looked up; if exceptions may exist, look them up or say which rules to check.
- Never conclude that something is allowed just because you found no rule against it. If the rules you found don't settle the question, say the Law doesn't address it and name the closest rules.
- When a question involves two factions, check first whether the Law lets them be in the same game at all, and whether either faction's rules mention the other.
- Lookups are limited, so be efficient: request several tools at once when you can (e.g. get_rule for two rules in one turn), and usually answer after 2–4 lookups.
- Cite rules by their printed number in plain text, e.g. 6.2.3 or 4.3.5.II. The website turns cited numbers into links, so don't write URLs or markdown links (this replaces the "with their links" part above).
- Be brief. Shape: **Short answer:** one or two sentences. **Why:** a few sentences or "- " bullets on how the rules interact. **Rules used:** the numbers and titles.
- Format with **bold**, *italics* and "- " bullets only. No headings, tables or code.
- If a rule you relied on was not checked by hand, add one short line saying so.`;

// --- Types -------------------------------------------------------------------

export type ChatMessage = { role: "user" | "assistant"; text: string };

export type Citation = {
  number: string; // as written in the answer
  id: string;
  label: string; // "6.2.3 Field Hospitals"
  href: string;
  checked: boolean; // text checked by hand against the PDF
  lookedUp: boolean; // a tool returned this rule during this answer
};

export type ChatEvent =
  | { type: "step"; text: string }
  | { type: "answer"; text: string; citations: Citation[]; unknown: string[]; model: string }
  | { type: "error"; code: ChatErrorCode; message: string };

export type ChatErrorCode = "config" | "quota" | "busy" | "upstream" | "blocked" | "input";

export type ChatOptions = {
  apiKey: string | undefined;
  models?: string[]; // tried in order; default DEFAULT_MODELS
  faction?: string;
  fetch?: typeof fetch;
  now?: () => number;
};

// "a, b,,c " -> ["a", "b", "c"]; undefined when empty.
export function modelList(value: string | undefined): string[] | undefined {
  const models = (value ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return models.length ? models : undefined;
}

// --- Tools -------------------------------------------------------------------

type Part = {
  text?: string;
  thought?: boolean;
  functionCall?: { id?: string; name: string; args?: Record<string, unknown> };
  functionResponse?: { id?: string; name: string; response: Record<string, unknown> };
  thoughtSignature?: string;
  [key: string]: unknown;
};
type Content = { role: "user" | "model"; parts: Part[] };

const RULE = {
  type: "string",
  description: 'A printed rule number such as "6.2.3", "4.3.5.II", "9.2.9.IIIa" or "G.20".',
};

export function toolDeclarations() {
  const factionIds = factions().map((f) => f.id);
  const factionList = factions()
    .map((f) => `${f.id} (${f.name})`)
    .join(", ");
  return [
    {
      name: "search_rules",
      description:
        'Full-text search over every rule in the Law of Root. Accepts a rule number (lists that rule and the rules under it), words (all must match; prefixes and simple plurals count), or a "quoted phrase". Optional filters narrow to one faction\'s relevant rules, an editorial topic, or one chapter. Returns numbers, titles and excerpts; call get_rule for full text.',
      parametersJsonSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: 'What to look for, e.g. "ambush", "move", "4.3".' },
          faction: { type: "string", enum: factionIds, description: `Limit to one faction's relevant rules: ${factionList}.` },
          topic: {
            type: "string",
            enum: topics().map((t) => t.id),
            description: "Limit to an editorial topic (not part of the Law).",
          },
          chapter: { type: "string", description: 'One chapter: "1"–"18", or an appendix letter such as "G".' },
          limit: { type: "integer", minimum: 1, maximum: 25, description: "How many results (default 8)." },
        },
        required: ["query"],
      },
    },
    {
      name: "get_rule",
      description:
        "The full text of one rule, with its sub-rules, parent rules, source page, the rules it cites and that cite it, faction icons printed on it, and whether its text was checked by hand.",
      parametersJsonSchema: { type: "object", properties: { rule: RULE }, required: ["rule"] },
    },
    {
      name: "get_faction_rules",
      description:
        "Everything the Law says about one faction: its own chapter (full text or an outline), the general rules that apply to it, the rules elsewhere it changes, and the rules that name it.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          faction: { type: "string", enum: factionIds, description: `The faction: ${factionList}.` },
          detail: { type: "string", enum: ["full", "outline"], description: '"outline" (numbers and titles) or "full".' },
        },
        required: ["faction"],
      },
    },
    {
      name: "get_related_rules",
      description:
        "Rules connected to one rule: parents, sub-rules, citations both ways, factions whose abilities modify it, its section's other rules, and its editorial topics. Use it to check for exceptions before answering.",
      parametersJsonSchema: { type: "object", properties: { rule: RULE }, required: ["rule"] },
    },
  ];
}

const str = (value: unknown, max = 200) => (typeof value === "string" ? value.slice(0, max) : "");

// Runs one tool call. Returns the text for the model and a line for the page.
export function runTool(name: string, args: Record<string, unknown> = {}): { output: string; step: string } {
  switch (name) {
    case "search_rules": {
      const query = str(args.query);
      const faction = getFaction(str(args.faction))?.id;
      const limit = typeof args.limit === "number" ? Math.min(25, Math.max(1, Math.round(args.limit))) : undefined;
      const output = searchRulesText(
        { query, faction, topic: str(args.topic) || undefined, chapter: str(args.chapter, 20) || undefined, limit },
        "",
      );
      const scope = faction ? ` (${getFaction(faction)!.name})` : "";
      return { output, step: `Searched “${query}”${scope}` };
    }
    case "get_rule":
    case "get_related_rules": {
      const input = str(args.rule, 40);
      const rule = resolveRule(input);
      const number = rule?.rule_number ?? input;
      return name === "get_rule"
        ? { output: getRuleText(input, ""), step: `Read ${number}` }
        : { output: getRelatedRulesText(input, ""), step: `Checked rules related to ${number}` };
    }
    case "get_faction_rules": {
      const faction = getFaction(str(args.faction));
      if (!faction) return { output: `No faction "${str(args.faction)}".`, step: "Looked for a faction" };
      const detail = args.detail === "full" ? "full" : "outline";
      return {
        output: getFactionRulesText(faction.id, detail, ""),
        step: `Read the ${faction.name} rules${detail === "outline" ? " (outline)" : ""}`,
      };
    }
    default:
      return { output: `Unknown tool "${name}".`, step: `Unknown tool ${name}` };
  }
}

// --- Citations -----------------------------------------------------------------

export function ruleNumbersIn(text: string): string[] {
  return [...new Set([...text.matchAll(RULE_NUMBER)].map((m) => m[1]))];
}

// Every rule id a text mentions, by number.
export function ruleIdsIn(text: string): Set<string> {
  const ids = new Set<string>();
  for (const number of ruleNumbersIn(text)) {
    const rule = resolveRule(number);
    if (rule) ids.add(rule.id);
  }
  return ids;
}

export function citationsIn(answer: string, seen: Set<string>): { citations: Citation[]; unknown: string[] } {
  const citations: Citation[] = [];
  const unknown: string[] = [];
  for (const number of ruleNumbersIn(answer)) {
    const rule = resolveRule(number);
    if (!rule) {
      unknown.push(number);
      continue;
    }
    citations.push({
      number,
      id: rule.id,
      label: ruleLabel(rule).replace(/\{icon\}/g, "").replace(/\{item:([a-z]+)\}/g, "$1"),
      href: ruleHref(rule.id),
      checked: verificationOf(rule.id).status === "verified",
      lookedUp: seen.has(rule.id),
    });
  }
  return { citations, unknown };
}

// --- The conversation ------------------------------------------------------------

class GeminiError extends Error {
  readonly code: ChatErrorCode;
  constructor(code: ChatErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

type GeminiResponse = {
  candidates?: { content?: Content; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; status?: string };
};

async function generate(
  model: string,
  body: unknown,
  apiKey: string,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<GeminiResponse> {
  if (timeoutMs < 1000) throw new GeminiError("busy", "Out of time.");
  let response: Response;
  try {
    response = await fetchImpl(`${API}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    // A timeout or a network failure.
    throw new GeminiError("busy", `${model} didn't respond in time.`);
  }
  const data = (await response.json().catch(() => ({}))) as GeminiResponse;
  if (response.ok) return data;
  if (response.status === 429) throw new GeminiError("quota", `${model}'s free quota is used up.`);
  if (response.status === 500 || response.status === 503 || response.status === 504) {
    throw new GeminiError("busy", `${model} is busy (${response.status}).`);
  }
  if (response.status === 400 && /api key/i.test(data.error?.message ?? "")) {
    throw new GeminiError("config", "The site's Gemini API key isn't valid.");
  }
  if (response.status === 401 || response.status === 403) {
    throw new GeminiError("config", "The site's Gemini API key was refused.");
  }
  if (response.status === 404) {
    // Retired or not offered to this key: move on to the next model.
    throw new GeminiError("busy", `Gemini doesn't offer the model "${model}" to this key.`);
  }
  throw new GeminiError("upstream", `Gemini returned an error (${response.status}). Try again in a moment.`);
}

// The factions a question involves (the player's own and any it names) and
// the Law's rules that link them, given to the model up front so it can't
// miss them (e.g. 18.2.1: the Knaves and the Vagabond can't share a game).
export type QuestionContext = { factionIds: string[]; links: Rule[] };

export function questionContext(question: string, playing?: string): QuestionContext {
  const factionIds = [...new Set([...(playing && getFaction(playing) ? [playing] : []), ...factionsIn(question)])];
  return { factionIds, links: rulesLinking(factionIds) };
}

export function systemText(faction?: string, context?: QuestionContext): string {
  const parts = [CHAT_INSTRUCTIONS];
  const playing = faction ? getFaction(faction) : undefined;
  if (playing) {
    parts.push(
      `The player says they are playing the ${playing.name} (faction id "${playing.id}"). Consider its rules, and pass faction: "${playing.id}" to search_rules when that helps. Still answer about other factions when asked.`,
    );
  }
  if (context && context.links.length) {
    const names = context.factionIds.map((id) => getFaction(id)!.name).join(", ");
    const rules = context.links
      .map((rule) => `- ${forAI(ruleLabel(rule)).replace(/\{icon\}/g, "")}: ${forAI(rule.text).replace(/\s+/g, " ").slice(0, 500)}`)
      .join("\n");
    parts.push(
      `This question involves: ${names}. These rules from the Law link those factions. Check them first: they can decide the answer outright (for example, whether the factions can be in the same game at all). Cite any that apply.\n${rules}`,
    );
  }
  return parts.join("\n\n");
}

export async function* runChat(messages: ChatMessage[], options: ChatOptions): AsyncGenerator<ChatEvent> {
  const fetchImpl = options.fetch ?? fetch;
  if (!options.apiKey) {
    yield { type: "error", code: "config", message: "The rules chat isn't set up on this server yet (no Gemini API key)." };
    return;
  }
  const last = messages.at(-1);
  if (!last || last.role !== "user" || !last.text.trim()) {
    yield { type: "error", code: "input", message: "Ask a question first." };
    return;
  }

  const models = [...new Set(options.models?.length ? options.models : DEFAULT_MODELS)];
  const now = options.now ?? Date.now;
  const deadline = now() + CHAT_LIMITS.deadlineMs;
  const start = (): Content[] =>
    messages.slice(-CHAT_LIMITS.maxMessages).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text.slice(0, CHAT_LIMITS.maxMessageChars) }],
    }));
  const tools = [{ functionDeclarations: toolDeclarations() }];
  const context = questionContext(last.text, options.faction);
  if (context.links.length) {
    const names = context.factionIds.map((id) => getFaction(id)!.name).join(" and the ");
    yield { type: "step", text: `Checked the rules linking the ${names}` };
  }

  // One model at a time. When a model is busy, slow or out of quota, the
  // answer starts over on the next model (a model's turns, with their thought
  // signatures, are only sent back to the same model).
  const failures: ChatErrorCode[] = [];
  for (const [index, model] of models.entries()) {
    if (index > 0) {
      if (now() >= deadline) break;
      yield { type: "step", text: `${models[index - 1]} is busy; starting again with ${model}` };
    }
    let result: ChatEvent;
    try {
      result = yield* answerWith(model, start(), tools, options, context, fetchImpl, () => deadline - now());
    } catch (error) {
      if (error instanceof GeminiError && (error.code === "busy" || error.code === "quota")) {
        failures.push(error.code);
        continue;
      }
      const code = error instanceof GeminiError ? error.code : "upstream";
      const message = error instanceof GeminiError ? error.message : "Something went wrong while answering.";
      yield { type: "error", code, message };
      return;
    }
    yield result;
    return;
  }
  yield failures.length && failures.every((code) => code === "quota")
    ? {
        type: "error",
        code: "quota",
        message: "The free Gemini quota is used up for today. Try again tomorrow, or use search in the meantime.",
      }
    : {
        type: "error",
        code: "busy",
        message: "Gemini's free models are all busy right now. Try again in a minute.",
      };
}

// One model's attempt: the tool loop until it answers. Throws GeminiError.
async function* answerWith(
  model: string,
  contents: Content[],
  tools: unknown[],
  options: ChatOptions,
  context: QuestionContext,
  fetchImpl: typeof fetch,
  timeLeft: () => number,
): AsyncGenerator<ChatEvent, ChatEvent> {
  // Rules given up front count as looked up for the citation check.
  const seen = new Set<string>(context.links.map((rule) => rule.id));
  const system = systemText(options.faction, context);
  for (let round = 0; round <= CHAT_LIMITS.maxToolRounds; round++) {
    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents,
      tools,
      // On the last round, no more lookups: answer with what was found.
      ...(round === CHAT_LIMITS.maxToolRounds ? { toolConfig: { functionCallingConfig: { mode: "NONE" } } } : {}),
    };

    const timeout = Math.min(CHAT_LIMITS.requestTimeoutMs, timeLeft());
    const data = await generate(model, body, options.apiKey!, fetchImpl, timeout);

    if (data.promptFeedback?.blockReason) {
      throw new GeminiError("blocked", "Gemini declined to answer that question.");
    }
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];
    const calls = parts.filter((p) => p.functionCall);

    const text = parts
      .filter((p) => typeof p.text === "string" && !p.thought)
      .map((p) => p.text)
      .join("")
      .trim();
    // An answer, or the last round (where any further calls are ignored).
    if (calls.length === 0 || round === CHAT_LIMITS.maxToolRounds) {
      if (!text) {
        throw new GeminiError(
          candidate?.finishReason === "SAFETY" ? "blocked" : "upstream",
          "Gemini didn't return an answer. Try rephrasing the question.",
        );
      }
      return { type: "answer", text, model, ...citationsIn(text, seen) };
    }

    // Send the model's turn back verbatim (thought signatures included),
    // then one function response per call.
    contents.push({ role: "model", parts });
    const responses: Part[] = [];
    for (const part of calls) {
      const call = part.functionCall!;
      const { output, step } = runTool(call.name, call.args);
      for (const id of ruleIdsIn(output)) seen.add(id);
      yield { type: "step", text: step };
      responses.push({
        functionResponse: { ...(call.id ? { id: call.id } : {}), name: call.name, response: { result: output } },
      });
    }
    if (round + 1 === CHAT_LIMITS.maxToolRounds) {
      responses.push({ text: "That was the last lookup. Answer now from the rules you found, and say what you couldn't check." });
    }
    contents.push({ role: "user", parts: responses });
  }
  throw new GeminiError("upstream", "Gemini kept looking rules up without answering. Try a narrower question.");
}
