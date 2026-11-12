"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SECOND_VAGABOND, bySetupLetter, entry, type FactionSetup, type ReachTable } from "@/lib/root/setupPlan";
import { FactionChip, RuleRef, SetupStep, SetupSummary, entryName, loadState, saveState } from "./setupParts";

// The reach calculator: pick the factions in play, check reach (5.2), and see
// the standard setup order (5.1.7) with each faction's setup steps (folded).
// `steps` holds each faction's setup section, rendered on the server.

const STORAGE_KEY = "root-setup-helper-v1";

export default function SetupHelper({
  factions,
  table,
  steps,
}: {
  factions: FactionSetup[];
  table: ReachTable;
  steps: Record<string, ReactNode>;
}) {
  const byId = Object.fromEntries(factions.map((f) => [f.id, f]));
  const [keys, setKeys] = useState<string[]>([]);
  const restored = useRef(false);

  // Restore this tab's picks.
  useEffect(() => {
    const ids = new Set(factions.map((f) => f.id));
    const saved = loadState<string[]>(STORAGE_KEY);
    if (Array.isArray(saved)) setKeys(saved.filter((k) => k === SECOND_VAGABOND || ids.has(k))); // eslint-disable-line react-hooks/set-state-in-effect
    restored.current = true;
  }, [factions]);

  useEffect(() => {
    if (restored.current) saveState(STORAGE_KEY, keys);
  }, [keys]);

  function toggle(key: string) {
    setKeys((current) => {
      if (current.includes(key)) {
        // Removing the Vagabond removes the second one too.
        return current.filter((k) => k !== key && !(key === "vagabond" && k === SECOND_VAGABOND));
      }
      return [...current, key];
    });
  }

  const entries = keys.map(entry);
  const ordered = bySetupLetter(entries, byId);
  const reachTag = (n: number) => <span className="font-rootlabel text-[12px] text-root-muted">{n}</span>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {factions.map((f) => (
          <FactionChip key={f.id} faction={f} extra={reachTag(f.reach)} on={keys.includes(f.id)} onClick={() => toggle(f.id)} />
        ))}
        {keys.includes("vagabond") && (
          <FactionChip
            faction={byId.vagabond}
            label="Vagabond (2nd)"
            extra={reachTag(byId.vagabond.secondReach ?? byId.vagabond.reach)}
            on={keys.includes(SECOND_VAGABOND)}
            onClick={() => toggle(SECOND_VAGABOND)}
          />
        )}
        {keys.length > 0 && (
          <button type="button" onClick={() => setKeys([])} className="px-1.5 text-[13px] italic text-root-muted hover:text-root-link">
            clear
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-[14px] italic text-root-muted">
          Pick the factions at the table. The numbers are their reach (<RuleRef rule="5.2" />
          ).
        </p>
      ) : (
        <>
          <SetupSummary entries={entries} byId={byId} table={table} />
          <div>
            <p className="mb-1 text-[14px] italic text-root-muted">
              Setting up, in order (<RuleRef rule="5.1.7" />
              ), after <RuleRef rule="5.1.1" />–<RuleRef rule="5.1.6" />:
            </p>
            <ol>
              {ordered.map((e, index) => {
                const f = byId[e.factionId];
                return (
                  <li key={e.key}>
                    <SetupStep index={index + 1} letter={f.letter} faction={f} name={entryName(e, byId)}>
                      {steps[f.id]}
                    </SetupStep>
                  </li>
                );
              })}
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
