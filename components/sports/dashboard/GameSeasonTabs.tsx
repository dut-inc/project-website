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
      className="relative inline-flex rounded-full border border-white/10 bg-white/5 p-1"
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
            className={`relative rounded-full px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-widest transition-colors duration-150 ${
              isActive
                ? "bg-market-red text-[#2a0c07] shadow-[0_0_8px_rgba(255,70,56,0.3)]"
                : "text-cream/45 hover:text-cream/85"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
