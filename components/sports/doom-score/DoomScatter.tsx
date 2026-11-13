"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  LEAGUES,
  LEAGUE_STYLE,
  formatCap,
  formatWinPct,
  type DoomTeam,
  type League,
  type MarkerShape,
} from "@/lib/sports/doomScore";

// Doom score (x) against winning percentage (y) for every team in five leagues.
// League buttons fade teams out (they never disappear). Typing in the search
// lights only the teams in its dropdown; picking one lights just that team. The
// league buttons lock while the search has text. Hovering a point shows its
// name; clicking it opens the full team card.

const MARGIN = { top: 16, right: 20, bottom: 48, left: 56 };

// The doom axis runs high → low, so the top right is the good corner and the
// bottom left the bad one. The plot splits at a .500 record and the middle of
// the doom range. Colours run good (green) to bad (red).
const CORNERS = {
  topLeft: { label: "Living on borrowed time", short: "Borrowed time", color: "#fab219" }, // high doom, winning
  topRight: { label: "Sitting pretty", color: "#3fbf5a" }, // low doom, winning
  bottomLeft: { label: "Doomed", color: "#ef5b5b" }, // high doom, losing
  bottomRight: { label: "Rebuilding", color: "#ec835a" }, // low doom, losing
};
const LOGO = 28;
const MARK = 14;

function niceStep(range: number, target: number): number {
  const raw = range / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  return (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
}

function niceDomain(values: number[], step: number, clamp?: [number, number]): [number, number] {
  let lo = Math.floor(Math.min(...values) / step) * step;
  let hi = Math.ceil(Math.max(...values) / step) * step;
  if (lo === hi) hi = lo + step;
  if (clamp) {
    lo = Math.max(clamp[0], lo);
    hi = Math.min(clamp[1], hi);
  }
  return [lo, hi];
}

function ticks([lo, hi]: [number, number], step: number): number[] {
  const out: number[] = [];
  for (let v = lo; v <= hi + step / 1000; v += step) out.push(Math.round(v * 1000) / 1000);
  return out;
}

function matchesQuery(team: DoomTeam, q: string): boolean {
  return `${team.name} ${team.abbr} ${team.league}`.toLowerCase().includes(q);
}

export function Marker({ shape, color, size = MARK }: { shape: MarkerShape; color: string; size?: number }) {
  // 2px ring in the surface colour so overlapping marks stay separate.
  const common = { fill: color, stroke: "#24262A", strokeWidth: 2, strokeLinejoin: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden className="block overflow-visible">
      {shape === "circle" && <circle cx="8" cy="8" r="7" {...common} />}
      {shape === "square" && <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" {...common} />}
      {shape === "diamond" && <path d="M8 0.5 15.5 8 8 15.5 0.5 8Z" {...common} />}
      {shape === "triangle" && <path d="M8 1 15.5 14.5H0.5Z" {...common} />}
      {shape === "hexagon" && <path d="M4.25 1.5h7.5L15.5 8l-3.75 6.5h-7.5L0.5 8Z" {...common} />}
    </svg>
  );
}

function TeamMark({ team, size }: { team: DoomTeam; size: number }) {
  const style = LEAGUE_STYLE[team.league];
  if (!team.logo) return <Marker shape={style.shape} color={style.color} size={size * 0.5} />;
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-studio-chrome"
      style={{ width: size, height: size, boxShadow: `0 0 0 2px ${style.color}` }}
    >
      <Image
        src={team.logo}
        alt=""
        width={Math.round(size * 0.72)}
        height={Math.round(size * 0.72)}
        sizes={`${Math.round(size * 0.72)}px`}
        className="object-contain"
        style={{ width: size * 0.72, height: size * 0.72 }}
      />
    </span>
  );
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

export default function DoomScatter({ teams }: { teams: DoomTeam[] }) {
  const [leagues, setLeagues] = useState<Set<League>>(() => new Set(LEAGUES.map((l) => l.id)));
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [plotRef, width] = useWidth<HTMLDivElement>();

  const byId = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const selected = selectedId ? byId.get(selectedId) ?? null : null;
  const detail = detailId ? byId.get(detailId) ?? null : null;

  // The search drives the highlight whenever it has text: the picked team, or
  // every team still in the dropdown. Otherwise the league buttons do.
  const q = query.trim().toLowerCase();
  const searching = selected !== null || q !== "";
  const matches = useMemo(
    () => [...teams].sort((a, b) => a.name.localeCompare(b.name)).filter((t) => !q || matchesQuery(t, q)),
    [teams, q],
  );
  const matchIds = useMemo(() => new Set(matches.map((t) => t.id)), [matches]);
  const isActive = (team: DoomTeam) =>
    selected ? team.id === selected.id : q ? matchIds.has(team.id) : leagues.has(team.league);

  // Scales.
  const height = width < 640 ? 420 : 540;
  const innerW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerH = height - MARGIN.top - MARGIN.bottom;
  const doomValues = teams.map((t) => t.doomScore);
  const xStep = niceStep(Math.max(...doomValues) - Math.min(...doomValues) || 10, width < 640 ? 5 : 10);
  const xDomain = niceDomain(doomValues, xStep);
  const yStep = 0.1;
  const yDomain = niceDomain(teams.map((t) => t.winPct), yStep, [0, 1]);
  const xMid = (xDomain[0] + xDomain[1]) / 2;
  // Reversed: high doom on the left, low doom on the right.
  const x = (v: number) => MARGIN.left + ((xDomain[1] - v) / (xDomain[1] - xDomain[0])) * innerW;
  const y = (v: number) => MARGIN.top + innerH - ((v - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerH;

  // Faded points first, then active ones, with the focused team on top.
  const focusId = hoverId ?? selectedId;
  const ordered = [...teams].sort((a, b) => {
    const rank = (t: DoomTeam) => (t.id === focusId ? 2 : isActive(t) ? 1 : 0);
    return rank(a) - rank(b);
  });
  const labelTeam = focusId ? byId.get(focusId) ?? null : null;

  function toggleLeague(id: League) {
    setLeagues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allOn = leagues.size === LEAGUES.length;

  return (
    <>
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      {/* Side column: league filter, then the team search. */}
      <aside className="space-y-5 lg:sticky lg:top-4 lg:order-2 lg:w-64 lg:shrink-0">
        <fieldset disabled={searching} className="min-w-0">
          <legend className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-studio-muted">
            Filter by league
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {LEAGUES.map((league) => {
              const on = leagues.has(league.id);
              return (
                <button
                  key={league.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleLeague(league.id)}
                  className={`inline-flex items-center gap-2 rounded border px-2.5 py-1.5 font-mono text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-studio-accent disabled:cursor-not-allowed disabled:opacity-40 ${
                    on
                      ? "border-studio-muted/60 bg-studio-hover text-studio-bright"
                      : "border-studio-border text-studio-muted hover:text-studio-text"
                  }`}
                >
                  <span className={on ? "" : "opacity-40"}>
                    <Marker shape={league.shape} color={league.color} size={12} />
                  </span>
                  {league.id}
                </button>
              );
            })}
            {!allOn && (
              <button
                type="button"
                onClick={() => setLeagues(new Set(LEAGUES.map((l) => l.id)))}
                className="rounded px-2 py-1.5 font-mono text-xs text-studio-link hover:underline disabled:opacity-40"
              >
                Show all
              </button>
            )}
          </div>
          {searching && (
            <p className="mt-1.5 text-xs text-studio-muted">Clear the team search to filter by league.</p>
          )}
        </fieldset>

        <TeamSearch
          query={query}
          onQuery={(value) => {
            setQuery(value);
            setSelectedId(null);
          }}
          matches={matches}
          selected={selected}
          onSelect={(team) => {
            setSelectedId(team?.id ?? null);
            setQuery("");
          }}
        />
      </aside>

      {/* Plot. */}
      <div
        ref={plotRef}
        className="relative w-full min-w-0 select-none rounded border border-studio-border bg-studio-editor lg:order-1 lg:flex-1"
        style={{ height }}
        onMouseLeave={() => setHoverId(null)}
      >
        {width > 0 && (
          <>
            <svg width={width} height={height} className="absolute inset-0" aria-hidden>
              {ticks(yDomain, yStep).map((v) => (
                <g key={`y${v}`}>
                  <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(v)} y2={y(v)} stroke="#2b2d32" />
                  <text x={MARGIN.left - 8} y={y(v)} dy="0.32em" textAnchor="end" className="fill-studio-muted font-mono text-[11px]">
                    {formatWinPct(v)}
                  </text>
                </g>
              ))}
              {ticks(xDomain, xStep).map((v) => (
                <g key={`x${v}`}>
                  <line x1={x(v)} x2={x(v)} y1={MARGIN.top} y2={MARGIN.top + innerH} stroke="#2b2d32" />
                  <text x={x(v)} y={MARGIN.top + innerH + 18} textAnchor="middle" className="fill-studio-muted font-mono text-[11px]">
                    {v}
                  </text>
                </g>
              ))}
              {yDomain[0] < 0.5 && yDomain[1] > 0.5 && (
                <line
                  x1={MARGIN.left}
                  x2={width - MARGIN.right}
                  y1={y(0.5)}
                  y2={y(0.5)}
                  stroke="#8b8f98"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                />
              )}
              <line
                x1={x(xMid)}
                x2={x(xMid)}
                y1={MARGIN.top}
                y2={MARGIN.top + innerH}
                stroke="#8b8f98"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
              />
              {(
                [
                  [CORNERS.topLeft, width < 640 ? CORNERS.topLeft.short : CORNERS.topLeft.label, MARGIN.left + 10, MARGIN.top + 18, "start"],
                  [CORNERS.topRight, CORNERS.topRight.label, width - MARGIN.right - 10, MARGIN.top + 18, "end"],
                  [CORNERS.bottomLeft, CORNERS.bottomLeft.label, MARGIN.left + 10, MARGIN.top + innerH - 10, "start"],
                  [CORNERS.bottomRight, CORNERS.bottomRight.label, width - MARGIN.right - 10, MARGIN.top + innerH - 10, "end"],
                ] as const
              ).map(([corner, label, lx, ly, anchor]) => (
                <text
                  key={corner.label}
                  x={lx}
                  y={ly}
                  textAnchor={anchor}
                  fill={corner.color}
                  stroke="#24262A"
                  strokeWidth={4}
                  paintOrder="stroke"
                  className="font-mono text-[11px] font-medium uppercase tracking-[0.14em]"
                >
                  {label}
                </text>
              ))}
              <text x={MARGIN.left + innerW / 2} y={height - 10} textAnchor="middle" className="fill-studio-text text-[12px]">
                ← Higher doom score
              </text>
              <text
                transform={`translate(14 ${MARGIN.top + innerH / 2}) rotate(-90)`}
                textAnchor="middle"
                className="fill-studio-text text-[12px]"
              >
                Winning percentage →
              </text>
            </svg>

            {ordered.map((team) => {
              const active = isActive(team);
              const style = LEAGUE_STYLE[team.league];
              const focused = team.id === focusId;
              return (
                <button
                  key={team.id}
                  type="button"
                  tabIndex={active ? 0 : -1}
                  aria-haspopup="dialog"
                  aria-label={`${team.name}, ${team.league}. Open team details`}
                  onMouseEnter={() => setHoverId(team.id)}
                  onMouseLeave={() => setHoverId((id) => (id === team.id ? null : id))}
                  // Only keyboard focus shows the label; a click (or the card
                  // handing focus back on close) must not leave it stuck on.
                  onFocus={(e) => {
                    const fromCard = e.relatedTarget instanceof Element && e.relatedTarget.closest("dialog");
                    if (!fromCard && e.currentTarget.matches(":focus-visible")) setHoverId(team.id);
                  }}
                  onBlur={() => setHoverId((id) => (id === team.id ? null : id))}
                  onClick={() => {
                    setHoverId(null);
                    setDetailId(team.id);
                  }}
                  className={`absolute flex items-center justify-center rounded-full p-1.5 transition-opacity duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-studio-accent motion-reduce:transition-none ${
                    active ? "opacity-100" : "pointer-events-none opacity-[0.12]"
                  }`}
                  style={{
                    left: x(team.doomScore),
                    top: y(team.winPct),
                    transform: `translate(-50%, -50%) scale(${focused ? 1.3 : 1})`,
                  }}
                >
                  {team.logo ? <TeamMark team={team} size={LOGO} /> : <Marker shape={style.shape} color={style.color} />}
                </button>
              );
            })}

            {labelTeam && (
              <HoverLabel
                team={labelTeam}
                px={x(labelTeam.doomScore)}
                py={y(labelTeam.winPct)}
                width={width}
              />
            )}
          </>
        )}
      </div>
      </div>

      <details className="rounded border border-studio-border">
        <summary className="cursor-pointer px-3 py-2 font-mono text-xs text-studio-muted hover:text-studio-text">
          Show as table
        </summary>
        <DataTable teams={teams.filter(isActive)} />
      </details>
    </div>

    {/* Outside space-y-4, whose margin would override the dialog's centring. */}
    <TeamDialog team={detail} onClose={() => setDetailId(null)} />
    </>
  );
}

// The small hover label: just the name and a nudge to click.
function HoverLabel({ team, px, py, width }: { team: DoomTeam; px: number; py: number; width: number }) {
  const W = 190;
  const left = Math.min(Math.max(8, px - W / 2), width - W - 8);
  const above = py > 70;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-10 rounded border border-studio-border/70 bg-studio-chrome/70 px-2.5 py-1.5 text-center shadow-lg shadow-black/30 backdrop-blur-[2px]"
      style={{ left, width: W, ...(above ? { top: py - 26, transform: "translateY(-100%)" } : { top: py + 26 }) }}
    >
      <p className="truncate text-[13px] font-medium text-studio-bright">{team.name}</p>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-studio-muted">Click for more info</p>
    </div>
  );
}

// The full team card, as a modal dialog (Esc, the × or a click outside closes it).
function TeamDialog({ team, onClose }: { team: DoomTeam | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (team && !dialog.open) dialog.showModal();
    if (!team && dialog.open) dialog.close();
  }, [team]);

  const style = team ? LEAGUE_STYLE[team.league] : null;
  const stats: { label: string; value: string; note?: string }[] = team
    ? [
        { label: "Doom score", value: String(team.doomScore) },
        { label: "Winning percentage", value: formatWinPct(team.winPct) },
        { label: "Average player age", value: team.avgAge.toFixed(1) },
        {
          label: "Draft pick capital",
          value: `${team.draftPicks.firsts} first-rounders`,
          note: `${team.draftPicks.total} picks in all over the next 3 drafts`,
        },
        {
          label: team.league === "MLB" ? "Payroll situation" : "Salary cap situation",
          value: formatCap(team),
          note: team.league === "MLB" ? "MLB has no salary cap; this is the luxury-tax line." : undefined,
        },
      ]
    : [];

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-md border border-studio-border bg-studio-chrome p-0 text-studio-text shadow-2xl shadow-black/60 backdrop:bg-black/60"
    >
      {team && style && (
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            {team.logo ? (
              <TeamMark team={team} size={56} />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-studio-editor">
                <Marker shape={style.shape} color={style.color} size={24} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-studio-muted">
                {team.league} · {team.abbr}
              </p>
              <h2 id={titleId} className="mt-1 font-display text-3xl leading-tight text-studio-bright">
                {team.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-2 rounded px-2.5 py-1 text-xl text-studio-muted hover:bg-studio-hover hover:text-studio-bright"
            >
              ×
            </button>
          </div>

          <dl className="mt-6 grid gap-px overflow-hidden rounded border border-studio-border bg-studio-border sm:grid-cols-2">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`bg-studio-editor px-4 py-3.5 ${i === stats.length - 1 && stats.length % 2 === 1 ? "sm:col-span-2" : ""}`}
              >
                <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-studio-muted">{stat.label}</dt>
                <dd className="mt-1 text-xl tabular-nums text-studio-bright">{stat.value}</dd>
                {stat.note && <dd className="mt-0.5 text-xs text-studio-muted">{stat.note}</dd>}
              </div>
            ))}
          </dl>

          <p className="mt-4 text-xs text-studio-muted">Sample data: these numbers are placeholders.</p>
        </div>
      )}
    </dialog>
  );
}

function TeamSearch({
  query,
  onQuery,
  matches,
  selected,
  onSelect,
}: {
  query: string;
  onQuery: (value: string) => void;
  matches: DoomTeam[];
  selected: DoomTeam | null;
  onSelect: (team: DoomTeam | null) => void;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);

  // The input shows the picked team; typing over it clears the pick.
  const value = selected ? selected.name : query;

  function pick(team: DoomTeam) {
    onSelect(team);
    setOpen(false);
  }

  function clear() {
    onSelect(null);
    setOpen(false);
  }

  return (
    <div className="relative w-full">
      <label htmlFor={id} className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.16em] text-studio-muted">
        Find a team
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[cursor] ? `${listId}-${matches[cursor].id}` : undefined}
          autoComplete="off"
          placeholder="Search teams…"
          value={value}
          onChange={(e) => {
            onQuery(e.target.value);
            setCursor(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setCursor((c) => Math.min(c + 1, matches.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setCursor((c) => Math.max(c - 1, 0));
            } else if (e.key === "Enter" && open && matches[cursor]) {
              e.preventDefault();
              pick(matches[cursor]);
            } else if (e.key === "Escape") {
              if (open) setOpen(false);
              else clear();
            }
          }}
          className="w-full rounded border border-studio-border bg-studio-chrome py-1.5 pl-3 pr-8 text-sm text-studio-bright placeholder:text-studio-muted focus:border-studio-accent focus:outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear team search"
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded px-2 py-0.5 text-studio-muted hover:text-studio-bright"
          >
            ×
          </button>
        )}
      </div>
      {open && !selected && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded border border-studio-border bg-studio-chrome py-1 shadow-lg shadow-black/40"
        >
          {matches.length === 0 && <li className="px-3 py-2 text-sm text-studio-muted">No teams match.</li>}
          {matches.map((team, i) => {
            const style = LEAGUE_STYLE[team.league];
            return (
              <li
                key={team.id}
                id={`${listId}-${team.id}`}
                role="option"
                aria-selected={i === cursor}
                // mousedown, so the pick lands before the input's blur closes the list.
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(team);
                }}
                onMouseEnter={() => setCursor(i)}
                className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm ${
                  i === cursor ? "bg-studio-selected text-studio-bright" : "text-studio-text"
                }`}
              >
                <Marker shape={style.shape} color={style.color} size={10} />
                <span className="flex-1 truncate">{team.name}</span>
                <span className="font-mono text-[11px] text-studio-muted">{team.league}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DataTable({ teams }: { teams: DoomTeam[] }) {
  const rows = [...teams].sort((a, b) => b.doomScore - a.doomScore);
  return (
    <div className="max-h-96 overflow-auto border-t border-studio-border">
      <table className="w-full text-left text-[13px]">
        <thead className="sticky top-0 bg-studio-chrome font-mono text-[11px] uppercase tracking-wider text-studio-muted">
          <tr>
            <th className="px-3 py-2 font-normal">Team</th>
            <th className="px-3 py-2 font-normal">League</th>
            <th className="px-3 py-2 text-right font-normal">Doom</th>
            <th className="px-3 py-2 text-right font-normal">Win %</th>
            <th className="px-3 py-2 text-right font-normal">Firsts / picks</th>
            <th className="px-3 py-2 text-right font-normal">Avg. age</th>
            <th className="px-3 py-2 font-normal">Cap</th>
          </tr>
        </thead>
        <tbody className="tabular-nums text-studio-text">
          {rows.map((t) => (
            <tr key={t.id} className="border-t border-studio-border/60">
              <td className="whitespace-nowrap px-3 py-1.5 text-studio-bright">{t.name}</td>
              <td className="px-3 py-1.5">{t.league}</td>
              <td className="px-3 py-1.5 text-right">{t.doomScore}</td>
              <td className="px-3 py-1.5 text-right">{formatWinPct(t.winPct)}</td>
              <td className="px-3 py-1.5 text-right">
                {t.draftPicks.firsts} / {t.draftPicks.total}
              </td>
              <td className="px-3 py-1.5 text-right">{t.avgAge.toFixed(1)}</td>
              <td className="whitespace-nowrap px-3 py-1.5">{formatCap(t)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
