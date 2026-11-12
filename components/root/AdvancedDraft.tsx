"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { chapterHref } from "@/lib/root/paths";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  canChoose,
  chooserOrder,
  deal,
  draftProblems,
  entryReach,
  type DealtCard,
  type DraftOptions,
  type FactionSetup,
  type ReachTable,
} from "@/lib/root/setupPlan";
import { FactionChip, RuleRef, SetupStep, SetupSummary, entryName, loadState, saveState, type ById } from "./setupParts";
import { Sword } from "./ui";

// The Advanced Setup faction draft (Law A.8), dealt on screen as setup cards.
// The physical extras (Vagabond characters, Knaves captains, hirelings,
// landmarks) are still dealt from the real cards.

const STORAGE_KEY = "root-advanced-draft-v1";

type State = { options: DraftOptions; pool: DealtCard[] | null; picks: string[] };

function randomUnit(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] / 2 ** 32;
}

function playerLabel(player: number, players: number): string {
  if (player === players) return `Player ${player}, last in turn order,`;
  if (player === 1) return "Player 1, the first player,";
  return `Player ${player}`;
}

const select = "root-field h-8 px-1.5 text-[14px] outline-none";
const quiet = "text-[13px] italic text-root-muted hover:text-root-link";

export default function AdvancedDraft({
  factions,
  table,
  steps,
}: {
  factions: FactionSetup[];
  table: ReachTable;
  steps: Record<string, ReactNode>;
}) {
  const byId: ById = Object.fromEntries(factions.map((f) => [f.id, f]));
  const [state, setState] = useState<State>(() => ({
    options: {
      players: 4,
      include: factions.map((f) => f.id).filter((id) => id !== "knaves-of-the-deepwood"),
      vagabondCards: 1,
      keepInsurgents: false,
    },
    pool: null,
    picks: [],
  }));
  const restored = useRef(false);

  useEffect(() => {
    const saved = loadState<State>(STORAGE_KEY);
    if (saved?.options && Array.isArray(saved.picks)) setState(saved); // eslint-disable-line react-hooks/set-state-in-effect
    restored.current = true;
  }, []);

  useEffect(() => {
    if (restored.current) saveState(STORAGE_KEY, state);
  }, [state]);

  const { options, pool, picks } = state;
  const problems = draftProblems(options, byId);
  const setOptions = (change: Partial<DraftOptions>) => setState((s) => ({ ...s, options: { ...s.options, ...change } }));

  function toggleFaction(id: string) {
    setOptions({
      include: options.include.includes(id) ? options.include.filter((x) => x !== id) : [...options.include, id],
    });
  }

  function dealCards() {
    setState((s) => ({ ...s, pool: deal(s.options, byId, randomUnit), picks: [] }));
  }

  if (!pool) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]">
          <label className="flex items-center gap-2">
            <span className="italic text-root-muted">Players</span>
            <select value={options.players} onChange={(e) => setOptions({ players: Number(e.target.value) })} className={select}>
              {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          {options.include.includes("vagabond") && (
            <label className="flex items-center gap-2" title="A.8.1: one card is recommended">
              <span className="italic text-root-muted">Vagabond cards</span>
              <select
                value={options.vagabondCards}
                onChange={(e) => setOptions({ vagabondCards: Number(e.target.value) as 1 | 2 })}
                className={select}
              >
                <option value={1}>1</option>
                <option value={2}>2 (adventurous)</option>
              </select>
            </label>
          )}
          {options.players === 2 && (
            <label className="flex items-center gap-2" title="A.8.2.I: with hirelings, if you're feeling adventurous">
              <input
                type="checkbox"
                className="accent-[rgb(var(--root-accent))]"
                checked={options.keepInsurgents}
                onChange={(e) => setOptions({ keepInsurgents: e.target.checked })}
              />
              <span className="italic text-root-muted">Keep insurgents</span>
            </label>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5" aria-label="Factions in the pool">
          {factions.map((f) => (
            <FactionChip key={f.id} faction={f} on={options.include.includes(f.id)} onClick={() => toggleFaction(f.id)} />
          ))}
        </div>

        {problems.length > 0 && (
          <ul className="space-y-0.5 text-[14px] text-root-warn">
            {problems.map((p) => (
              <li key={p.text}>
                {p.text} (<RuleRef rule={p.rule} />)
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button type="button" onClick={dealCards} disabled={problems.length > 0} className="root-btn h-10 px-5 text-[16px]">
            Deal {options.players + 1} cards
          </button>
          <span className="text-[13px] italic text-root-muted">
            after <Link href={chapterHref("section-a")} className="not-italic text-root-link hover:underline">A.1–A.7</Link>,
            following <RuleRef rule="A.8" />
          </span>
        </div>
      </div>
    );
  }

  const order = chooserOrder(options.players);
  const chosen = picks.map((key) => pool.find((c) => c.key === key)!).filter(Boolean);
  const done = chosen.length === options.players;
  const next = order[chosen.length];
  const leftover = pool.filter((c) => !picks.includes(c.key));

  function pick(card: DealtCard) {
    if (done || !canChoose(card, chosen)) return;
    setState((s) => ({ ...s, picks: [...s.picks, card.key] }));
  }

  return (
    <div className="space-y-4">
      <p className="font-rootdisplay text-[1.25rem] leading-snug text-root-ink" aria-live="polite">
        {done ? (
          <span className="text-root-ok">Everyone has chosen.</span>
        ) : (
          <>
            {playerLabel(next, options.players)} <span className="italic">chooses and sets up</span>{" "}
            <span className="font-rootbody text-[14px]">
              (<RuleRef rule="A.8.3" />)
            </span>
          </>
        )}
      </p>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {pool.map((card) => {
          const f = byId[card.factionId];
          const pickedBy = picks.indexOf(card.key);
          const available = !done && canChoose(card, chosen);
          const militant = card.card === "militant";
          const note =
            card.factionId === "vagabond"
              ? "Deal it a character card (A.8.2.III)"
              : card.factionId === "knaves-of-the-deepwood"
                ? "Deal it four Captains (A.8.2.IV)"
                : null;
          return (
            <li key={card.key} className="flex">
              <button
                type="button"
                onClick={() => pick(card)}
                disabled={!available}
                style={{ "--c": f.color } as CSSProperties}
                className={`root-card flex min-h-[6.5rem] w-full flex-col px-3 pb-2.5 pt-3.5 text-left ${
                  card.locked && pickedBy < 0 ? "root-card-locked" : ""
                } ${pickedBy >= 0 ? "opacity-55" : ""} ${!available && pickedBy < 0 && !card.locked ? "opacity-70" : ""}`}
              >
                <span
                  className={`flex items-start gap-1.5 font-rootdisplay text-[1.15rem] leading-tight ${
                    militant ? "text-root-militant" : "text-root-muted"
                  }`}
                >
                  {militant && <Sword className="mt-0.5 h-[1.1rem] w-[1.1rem] shrink-0" />}
                  {entryName(card, byId)}
                </span>
                {note && pickedBy < 0 && <span className="mt-1 text-[12px] italic leading-snug text-root-muted">{note}</span>}
                <span className="mt-auto pt-2 font-rootlabel text-[13px] text-root-muted">
                  reach {entryReach(card, byId)}
                  <span className="sr-only">, {militant ? "militant" : "insurgent"}</span>
                </span>
                {card.locked && pickedBy < 0 && (
                  <span className="root-stamp bottom-2 right-2 -rotate-[7deg] text-[12px] text-root-militant">locked</span>
                )}
                {pickedBy >= 0 && (
                  <span className="root-stamp bottom-2 right-2 -rotate-6 text-[14px] text-root-ink">P{order[pickedBy]}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {pool.some((c) => c.locked) && !done && (
        <p className="text-[13px] italic text-root-muted">
          A locked card can&apos;t be chosen until someone takes a militant faction (<RuleRef rule="A.8.2.II" />
          ).
        </p>
      )}

      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {picks.length > 0 && (
          <button type="button" onClick={() => setState((s) => ({ ...s, picks: s.picks.slice(0, -1) }))} className={quiet}>
            undo
          </button>
        )}
        <button type="button" onClick={dealCards} className={quiet}>
          deal again
        </button>
        <button type="button" onClick={() => setState((s) => ({ ...s, pool: null, picks: [] }))} className={quiet}>
          change setup
        </button>
      </div>

      {chosen.length > 0 && (
        <div>
          <p className="mb-1 text-[14px] italic text-root-muted">
            Setting up, in draft order. Homelands: <RuleRef rule="A.8.3.I" />–<RuleRef rule="A.8.3.III" />.
          </p>
          <ol>
            {chosen.map((card, index) => (
              <li key={card.key}>
                <SetupStep index={index + 1} faction={byId[card.factionId]} name={entryName(card, byId)} who={`P${order[index]}`}>
                  {steps[card.factionId]}
                </SetupStep>
              </li>
            ))}
          </ol>
        </div>
      )}

      {done && (
        <div className="space-y-2 border-t border-root-line pt-3">
          <SetupSummary entries={chosen} byId={byId} table={table} />
          <p className="text-[14px] italic text-root-muted">
            Box {leftover.map((c) => entryName(c, byId)).join(", ")}. Then score markers (<RuleRef rule="A.9" />) and keep 3
            of your 5 cards (<RuleRef rule="A.10" />).
          </p>
        </div>
      )}
    </div>
  );
}
