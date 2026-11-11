import PageHeader from "@/components/PageHeader";
import ConnectorUrl from "@/components/root/ConnectorUrl";
import { pageMetadata } from "@/lib/metadata";
import { SOURCE } from "@/lib/root/law";
import { CONNECT_HREF, MCP_PATH, ROOT_HREF } from "@/lib/root/paths";

const DESCRIPTION =
  "Connect your own AI app to the Law of Root, so it looks rules up and cites rule numbers instead of guessing.";

export const metadata = pageMetadata(CONNECT_HREF, { title: "Use with your AI · Root", description: DESCRIPTION });

const TOOLS = [
  ["search_rules", "Finds rules by number, words or a quoted phrase, optionally within one faction, topic or chapter."],
  ["get_rule", "One rule's full text with its sub-rules, source page, the rules it cites, and whether it was checked by hand."],
  ["get_faction_rules", "A faction's chapter, the general rules that apply to it, the rules it changes, and where it's named."],
  ["get_related_rules", "Parent rules, sub-rules, citations both ways, factions that modify the rule, and its topics."],
] as const;

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-studio-border bg-white/[0.02] p-4">
      <h3 className="mb-2 font-semibold text-studio-bright">{title}</h3>
      <div className="space-y-2 text-[14px] leading-relaxed">{children}</div>
    </section>
  );
}

const code = "rounded bg-studio-chrome px-1.5 py-0.5 font-mono text-[13px] text-studio-bright";

export default function ConnectPage() {
  return (
    <div className="text-studio-text">
      <PageHeader
        href={CONNECT_HREF}
        back={{ href: ROOT_HREF, label: "root.law" }}
        title="Use with your AI"
        meta={["MCP connector", `Law of Root · ${SOURCE.printed_date}`]}
        description={DESCRIPTION}
      />

      <div className="max-w-3xl space-y-8">
        <section>
          <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-studio-muted">Connector URL</h2>
          <ConnectorUrl />
          <p className="mt-2 text-[13px] leading-relaxed text-studio-muted">
            Read-only and free: it only looks rules up. The AI itself runs in your app, on your own account. Nothing you ask
            is stored here.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-studio-muted">Add it to your app</h2>
          <Step title="Claude (web, desktop or mobile)">
            <p>
              Open Settings, go to Connectors, and add a custom connector with the URL above. Then ask a rules question in a
              new chat. Custom connectors depend on your Claude plan.
            </p>
          </Step>
          <Step title="Claude Code">
            <p>Run this in a terminal, with the URL above:</p>
            <pre className="overflow-x-auto rounded-md bg-studio-chrome p-3 font-mono text-[13px] text-studio-bright">
              claude mcp add --transport http root-rules {"<URL>"}
            </pre>
          </Step>
          <Step title="Other apps (Cursor and other MCP clients)">
            <p>
              Add a remote MCP server using streamable HTTP and the URL above. In apps configured with JSON, the entry looks
              like <code className={code}>{`"root-rules": { "url": "<URL>" }`}</code>.
            </p>
          </Step>
        </section>

        <section>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-studio-muted">What your AI can do with it</h2>
          <dl className="space-y-3 text-[14px] leading-relaxed">
            {TOOLS.map(([name, text]) => (
              <div key={name}>
                <dt className="font-mono text-[13px] text-studio-link">{name}</dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-lg border border-dashed border-studio-border px-4 py-3 text-[13px] leading-relaxed text-studio-muted">
          <p>
            The server tells your AI to look rules up instead of answering from memory, to cite rule numbers, and to say when
            a rule&apos;s text wasn&apos;t checked by hand against the PDF. Your AI writes the answer, so check the cited
            rules when it matters; every citation links back to this site. Endpoint path: <code className={code}>{MCP_PATH}</code>
          </p>
        </section>
      </div>
    </div>
  );
}
