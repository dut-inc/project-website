"use client";

export type ExpandedTab = "game" | "season";

/**
 * Segmented Game | Season control for the expanded view. The Game segment
 * is only rendered when there's a live game.
 */
export default function GameSeasonTabs({
  active,
  onChange,
  showGame,
}: {
  active: ExpandedTab;
  onChange: (tab: ExpandedTab) => void;
  showGame: boolean;
}) {
  const tabs: { id: ExpandedTab; label: string }[] = [
    ...(showGame ? [{ id: "game" as const, label: "Game" }] : []),
    { id: "season" as const, label: "Season" },
  ];

  return (
    <div
      className="relative inline-flex rounded-full border border-ink/15 bg-ink/5 p-1"
      role="tablist"
      aria-label="Team view"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative rounded-full px-4 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-150 ${
              isActive
                ? "bg-market-red text-white shadow-[0_2px_8px_rgba(255,70,56,0.4)]"
                : "text-ink2 hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
