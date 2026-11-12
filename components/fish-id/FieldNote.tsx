import { Fragment } from "react";
import type { Verdict } from "@/lib/fishId/engine";
import type { Fish } from "@/lib/fishId/types";
import FishName from "./FishName";

const VERDICT: Record<Verdict, { label: string; className: string }> = {
  correct: { label: "Correct", className: "text-fid-foam" },
  wrong: { label: "Incorrect", className: "text-fid-coral" },
  skipped: { label: "Skipped, not scored", className: "text-fid-mist" },
};

// What the species is, shown after a question is answered: both names and
// whatever optional notes the record has. Missing fields are simply left out.
export default function FieldNote({ fish, verdict }: { fish: Fish; verdict: Verdict }) {
  const facts = [
    ["Family", fish.family],
    ["Habitat", fish.habitat],
    ["Range", fish.distribution],
  ].filter((pair): pair is [string, string] => Boolean(pair[1]));

  return (
    <div className="fid-reveal">
      <p className={`font-mono text-[11px] uppercase tracking-[0.2em] ${VERDICT[verdict].className}`}>{VERDICT[verdict].label}</p>
      <p className="mt-2 font-fidserif text-2xl leading-tight text-fid-white">
        {fish.commonName}
        <span className="text-fid-mist/60"> · </span>
        <FishName field="scientificName" className="text-fid-sand">
          {fish.scientificName}
        </FishName>
      </p>
      {facts.length > 0 && (
        <dl className="mt-3 grid grid-cols-[4.75rem_1fr] items-baseline gap-x-3 gap-y-1 text-[13px] leading-relaxed">
          {facts.map(([term, value]) => (
            <div key={term} className="contents">
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-fid-foam/70">{term}</dt>
              <dd className="m-0 text-fid-mist">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {fish.description && (
        <p className="mt-3 max-w-prose text-[14px] leading-relaxed text-fid-mist">
          <Description text={fish.description} binomial={fish.scientificName} />
        </p>
      )}
    </div>
  );
}

// Species notes come from Wikipedia as plain text; the species' own binomial
// is set in italics wherever it appears, as everywhere else in the quiz.
function Description({ text, binomial }: { text: string; binomial: string }) {
  const parts = text.split(binomial);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <i>{binomial}</i>}
          {part}
        </Fragment>
      ))}
    </>
  );
}
