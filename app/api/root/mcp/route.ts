// Root Rules MCP server: read-only tools over the Law of Root, for people to
// connect their own AI app to (Claude, Cursor, ...). The AI runs on their
// account; this endpoint only looks rules up, so it costs nothing to run.
//
// Stateless Streamable HTTP via the official SDK's createMcpHandler: the
// 2026-07-28 protocol natively, plus the stateless fallback for 2025-era
// clients. No sessions, no auth, no writes, no secrets.

import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { factions } from "@/lib/root/law";
import {
  SERVER_INSTRUCTIONS,
  getFactionRulesText,
  getRelatedRulesText,
  getRuleText,
  searchRulesText,
} from "@/lib/root/mcpTools";
import { topics } from "@/lib/root/topics";

export const dynamic = "force-dynamic";

const FACTION_IDS = factions().map((f) => f.id) as [string, ...string[]];
const TOPIC_IDS = topics().map((t) => t.id) as [string, ...string[]];
const FACTION_LIST = factions()
  .map((f) => `${f.id} (${f.name})`)
  .join(", ");

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;

const ruleInput = z
  .string()
  .min(1)
  .max(40)
  .describe('A printed rule number such as "6.2.3", "4.3.5.II", "9.2.9.IIIa" or "G.20", or a rule id such as "rule-6-2-3".');

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] });

function buildServer(origin: string) {
  const server = new McpServer({ name: "root-rules", version: "1.0.0" }, { instructions: SERVER_INSTRUCTIONS });

  server.registerTool(
    "search_rules",
    {
      title: "Search the Law of Root",
      description:
        "Full-text search over every rule in the Law of Root. Accepts a rule number (lists that rule and the rules under it), words (all must match; prefixes and simple plurals count), or a \"quoted phrase\". Optional filters narrow to one faction's relevant rules, an editorial topic, or one chapter. Returns rule numbers, titles, short excerpts and links; call get_rule for full text.",
      inputSchema: z.object({
        query: z.string().min(1).max(200).describe("What to look for, e.g. \"ambush\", \"move rule\", \"4.3\" or \"\\\"three actions\\\"\"."),
        faction: z.enum(FACTION_IDS).optional().describe(`Limit to what this faction's page lists. One of: ${FACTION_LIST}.`),
        topic: z.enum(TOPIC_IDS).optional().describe("Limit to an editorial topic (not part of the Law)."),
        chapter: z
          .string()
          .max(20)
          .optional()
          .describe('Limit to one chapter: "1"–"18", or an appendix letter "A", "C", "G", "H", "K", "L", "M", "V".'),
        limit: z.number().int().min(1).max(25).optional().describe("How many results to return (default 8, max 25)."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => text(searchRulesText(args, origin)),
  );

  server.registerTool(
    "get_rule",
    {
      title: "Get a rule",
      description:
        "The full text of one rule from the Law of Root, with its sub-rules, parent rules for context, source page and PDF link, the rules it cites and that cite it, faction icons printed on it, and whether its text was checked by hand against the PDF.",
      inputSchema: z.object({ rule: ruleInput }),
      annotations: READ_ONLY,
    },
    async ({ rule }) => text(getRuleText(rule, origin)),
  );

  server.registerTool(
    "get_faction_rules",
    {
      title: "Get a faction's rules",
      description:
        "Everything the Law says about one faction: its own chapter (full text or an outline), the general rules that apply to it, the rules elsewhere that it changes (marked by its icon), and the rules that name it.",
      inputSchema: z.object({
        faction: z.enum(FACTION_IDS).describe(`The faction. One of: ${FACTION_LIST}.`),
        detail: z
          .enum(["full", "outline"])
          .optional()
          .describe('"full" (default) includes the chapter text; "outline" lists rule numbers and titles only.'),
      }),
      annotations: READ_ONLY,
    },
    async ({ faction, detail }) => text(getFactionRulesText(faction, detail ?? "full", origin)),
  );

  server.registerTool(
    "get_related_rules",
    {
      title: "Get related rules",
      description:
        "Rules connected to one rule: parent rules and sub-rules, rules it cites and rules that cite it, factions whose abilities modify it, other rules in its section, and its editorial topics. Use this to check for exceptions and interactions before answering.",
      inputSchema: z.object({ rule: ruleInput }),
      annotations: READ_ONLY,
    },
    async ({ rule }) => text(getRelatedRulesText(rule, origin)),
  );

  return server;
}

const handler = createMcpHandler((ctx) => buildServer(ctx.requestInfo ? new URL(ctx.requestInfo.url).origin : ""));

function serve(request: Request) {
  return handler.fetch(request);
}

export { serve as GET, serve as POST, serve as DELETE };
