"use client";

import type { StatLine } from "@/lib/sports/types";

export interface StatSection {
  title?: string;
  stats: StatLine[];
}

/** Generic labeled stat table(s) — used by both the Game and Season tabs. */
export default function StatSections({ sections }: { sections: StatSection[] }) {
  const filtered = sections.filter((s) => s.stats.length > 0);
  if (filtered.length === 0) return null;

  return (
    <div className="space-y-4">
      {filtered.map((section, i) => (
        <div key={i}>
          {section.title && (
            <h4 className="mb-2 font-display text-[10px] font-medium uppercase tracking-[0.22em] text-ink2">
              {section.title}
            </h4>
          )}
          <div className="divide-y divide-ink/10 border border-ink/15 bg-white">
            {section.stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-baseline justify-between gap-3 px-3.5 py-2"
              >
                <span className="min-w-0 truncate text-[13px] text-ink/80">{stat.label}</span>
                <span className="shrink-0 text-right font-mono text-sm font-semibold text-ink tabular-nums">
                  {stat.value}
                  {stat.sublabel && (
                    <span className="ml-1.5 text-[11px] font-normal text-ink2/70">{stat.sublabel}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
