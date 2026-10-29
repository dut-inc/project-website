// Placeholder art: a hanging wall planner for the daily guessing games —
// past days crossed off, today circled with a "?". Drawn flat; the room skews
// it onto the wall when its placement says plane: "left-wall".
// viewBox 140 × 190.

const COLS = 5;
const ROWS = 4;
const TODAY = 13;

export default function CalendarArt() {
  const cells = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    const x = 16 + (i % COLS) * 22;
    const y = 82 + Math.floor(i / COLS) * 22;
    cells.push(
      <g key={i}>
        <rect x={x} y={y} width="20" height="20" fill={i === TODAY ? "#fff7e0" : "#f3ead4"} stroke="#cbb893" strokeWidth="0.8" />
        {i < TODAY && (
          // crossed off: a played day
          <path
            d={`M${x + 4} ${y + 4} L${x + 16} ${y + 16} M${x + 16} ${y + 4} L${x + 4} ${y + 16}`}
            stroke={i % 4 === 1 ? "#3f9284" : "#c1442d"}
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.85"
          />
        )}
        {i === TODAY && (
          <>
            <circle cx={x + 10} cy={y + 10} r="11.5" fill="none" stroke="#c1442d" strokeWidth="2" />
            <text x={x + 10} y={y + 15} textAnchor="middle" fontSize="13" fontWeight="700" fill="#2a2620" fontFamily="var(--font-display), serif">
              ?
            </text>
          </>
        )}
      </g>,
    );
  }

  return (
    <svg viewBox="0 0 140 190" className="block h-auto w-full" aria-hidden focusable="false">
      {/* nail + hanging string */}
      <path d="M70 6 L30 40 M70 6 L110 40" stroke="#3b2a1c" strokeWidth="1.5" fill="none" />
      <circle cx="70" cy="6" r="4" fill="#a98245" stroke="#3b2a1c" strokeWidth="1.5" />

      {/* back page peeking out */}
      <rect x="10" y="40" width="124" height="146" fill="#cbb893" transform="rotate(2 72 113)" />
      {/* main sheet */}
      <rect x="8" y="38" width="124" height="146" fill="#efe7d2" stroke="#6b6250" strokeWidth="1.2" />
      {/* spiral binding */}
      <g fill="none" stroke="#3b2a1c" strokeWidth="2">
        {[22, 38, 54, 86, 102, 118].map((x) => (
          <path key={x} d={`M${x} 34 C ${x - 4} 38 ${x - 4} 44 ${x} 46`} />
        ))}
      </g>
      {/* header band */}
      <rect x="8" y="46" width="124" height="28" fill="#2f7a6b" />
      <text x="70" y="65" textAnchor="middle" fontSize="15" letterSpacing="3" fill="#efe7d2" fontFamily="var(--font-mono), monospace" fontWeight="500">
        DAILY
      </text>
      {cells}
      {/* pencil on a string */}
      <path d="M132 120 C 140 130 138 150 132 160" stroke="#3b2a1c" strokeWidth="1" fill="none" />
      <g transform="rotate(12 132 168)">
        <rect x="128" y="158" width="7" height="26" fill="#ddb63a" stroke="#3b2a1c" strokeWidth="1" />
        <path d="M128 184 L131.5 192 L135 184 Z" fill="#e8dcc4" stroke="#3b2a1c" strokeWidth="1" />
      </g>
    </svg>
  );
}
