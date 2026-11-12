import Link from "next/link";
import { getFaction } from "@/lib/root/law";
import { factionHref } from "@/lib/root/paths";
import { setupRules, setupSectionOf } from "@/lib/root/setup";
import RuleEntry from "./RuleEntry";

// A faction's "Faction Setup" section from the Law (6.3, 7.3, ...), for the
// setup helper and the draft. Server component: passed to them as a prop.
export default function FactionSetupSteps({ factionId }: { factionId: string }) {
  const faction = getFaction(factionId)!;
  const section = setupSectionOf(factionId);
  return (
    <div className="space-y-4 leading-[1.65]">
      {setupRules(factionId).map((rule) => (
        <RuleEntry key={rule.id} rule={rule} />
      ))}
      <p className="text-[12px] text-root-muted">
        From the Law, {section.number} {section.title}.{" "}
        <Link href={factionHref(factionId)} className="text-root-link hover:underline">
          All {faction.name} rules
        </Link>
      </p>
    </div>
  );
}

export function setupStepsByFaction(ids: string[]) {
  return Object.fromEntries(ids.map((id) => [id, <FactionSetupSteps key={id} factionId={id} />]));
}
