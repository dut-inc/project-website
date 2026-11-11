import Link from "next/link";
import { Fragment } from "react";
import { targetHref, targetLabel } from "@/lib/root/law";
import { parseBlocks, parseInline, type CrossReference, type Inline } from "@/lib/root/markup";

// Official rule text, rendered from the extracted markup. The words are the
// Law's; this only decides how they look (reminders in italics, item icons as
// labelled chips, citations as links).

export function InlineText({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((part, index) => {
        const node = renderPart(part);
        return part.italic ? (
          <em key={index} className="italic text-studio-text/80">
            {node}
          </em>
        ) : (
          <Fragment key={index}>{node}</Fragment>
        );
      })}
    </>
  );
}

function renderPart(part: Inline) {
  switch (part.kind) {
    case "text":
      return part.text;
    case "item":
      return <ItemChip item={part.item} />;
    case "icon":
      return (
        <span
          title="An icon printed in the PDF that can't be shown here. Open the source page to see it."
          className="mx-0.5 inline-flex h-[1.15em] min-w-[1.15em] items-center justify-center rounded border border-dashed border-studio-muted/60 px-1 align-[-0.15em] font-mono text-[0.6em] uppercase tracking-wider text-studio-muted"
        >
          <span aria-hidden>icon</span>
          <span className="sr-only">(icon, see the PDF)</span>
        </span>
      );
    case "ref":
      return (
        <Link
          href={targetHref(part.targetId)}
          title={targetLabel(part.targetId)}
          className={`${/\s/.test(part.text) ? "" : "font-mono text-[0.92em] "}text-studio-link underline decoration-studio-link/40 underline-offset-2 hover:decoration-studio-link`}
        >
          {part.text}
        </Link>
      );
  }
}

// An item icon from the Law ({item:boots}) as a labelled chip.
export function ItemChip({ item }: { item: string }) {
  return (
    <span className="mx-px inline-flex items-center rounded-[4px] border border-[#c9a66b]/45 bg-[#c9a66b]/10 px-1.5 py-px align-[0.05em] font-mono text-[0.72em] uppercase leading-tight tracking-wider text-[#e3c48f]">
      {item}
    </span>
  );
}

// A rule's title, which can contain item icons ("Dash ({item:boots})").
export function RuleTitle({ title }: { title: string }) {
  return <InlineText parts={parseInline(title)} />;
}

export default function RuleText({
  text,
  references = [],
  className = "",
}: {
  text: string;
  references?: CrossReference[];
  className?: string;
}) {
  const blocks = parseBlocks(text, references);
  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((block, index) =>
        block.kind === "paragraph" ? (
          <p key={index}>
            <InlineText parts={block.content} />
          </p>
        ) : (
          <div key={index} className="overflow-x-auto">
            <table className="min-w-[16rem] border-collapse text-[0.95em]">
              {block.caption && (
                <caption className="pb-1.5 text-left font-semibold text-studio-bright">
                  <InlineText parts={block.caption} />
                </caption>
              )}
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r} className="border-t border-studio-border first:border-t-0">
                    {row.map((cell, c) =>
                      c === 0 ? (
                        <th key={c} scope="row" className="py-1 pr-6 text-left font-normal text-studio-text">
                          <InlineText parts={cell} />
                        </th>
                      ) : (
                        <td key={c} className="px-2 py-1 text-right font-mono tabular-nums text-studio-bright">
                          <InlineText parts={cell} />
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      )}
    </div>
  );
}
