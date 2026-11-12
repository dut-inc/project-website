# Use your own AI with the Root rules (MCP)

The site has a free, read-only MCP server for the Law of Root. Connect your own AI
app to it, and the app looks rules up and cites rule numbers instead of guessing.
The AI runs in your app, on your account. The endpoint only looks rules up, and
nothing you ask is stored.

**URL:** `https://<the site's domain>/api/root/mcp`. Locally, the URL is
`http://localhost:3000/api/root/mcp`. It uses Streamable HTTP and needs no sign-in.

## Add it to your app

- **Claude (web, desktop or mobile):** go to Settings › Connectors › add a custom
  connector, and enter the URL. Then ask a rules question in a new chat. Whether
  custom connectors are available depends on your Claude plan, and they need the
  public URL, not localhost.
- **Claude Code:** run `claude mcp add --transport http root-rules <URL>`.
- **Other MCP clients (Cursor and so on):** add a remote MCP server that uses
  streamable HTTP. In apps configured with JSON, the entry looks like
  `"root-rules": { "url": "<URL>" }`.

## What the AI can do with it

| Tool | What it returns |
| --- | --- |
| `search_rules` | Rules matching a number, words or a "quoted phrase", optionally within one faction, topic or chapter |
| `get_rule` | One rule's full text, its sub-rules, its source page, the rules it cites, and whether its text was checked by hand |
| `get_faction_rules` | A faction's chapter, the general rules that apply to it, the rules it changes, and where it's named |
| `get_related_rules` | Parent rules, sub-rules, citations both ways, the factions that modify the rule, and its topics |

The server tells the AI to:
- look rules up instead of answering from memory;
- cite rule numbers;
- say when a rule's text wasn't checked by hand against the PDF.

Your AI still writes the answer, so check the cited rules when it matters.

Code: `app/api/root/mcp/route.ts` (endpoint) and `lib/root/mcpTools.ts` (tools).
The on-site chat (Gemini) uses the same tools.
