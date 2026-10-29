// Placeholder art: a bookcase of board games, drawn in the room's 3/4 view
// (front face parallel to the right wall). The black-and-gold box displayed
// face-out is The Pack, which lives inside Board Games. viewBox 200 × 390.

// Front-face plane of the right wall: x stays put, y drops 0.2 per unit of x.
const FRONT = "matrix(1 0.2 0 1 0 0)";

// Upright game boxes: x, width, height, fill, stripe
const topRow: [number, number, number, string, string][] = [
  [92, 14, 60, "#7b302e", "#ddb63a"],
  [107, 18, 66, "#2f7a6b", "#efe7d2"],
  [126, 12, 56, "#c9a227", "#7b302e"],
  [139, 11, 62, "#274b6d", "#8fb4d8"],
];
const midRow: [number, number, number, string, string][] = [
  [14, 16, 64, "#4d674d", "#e8dcc4"],
  [31, 12, 58, "#c1442d", "#efe7d2"],
  [44, 20, 66, "#e8dcc4", "#7b302e"],
  [65, 14, 60, "#3a6690", "#ddb63a"],
];

function Uprights({ rows, floor }: { rows: typeof topRow; floor: number }) {
  return (
    <>
      {rows.map(([x, w, h, fill, stripe]) => (
        <g key={x}>
          <rect x={x} y={floor - h} width={w} height={h} fill={fill} stroke="#2b1d12" strokeWidth="1.2" />
          <rect x={x} y={floor - h + 8} width={w} height="5" fill={stripe} opacity="0.9" />
          <rect x={x + 2} y={floor - 18} width={w - 4} height="3" fill={stripe} opacity="0.6" />
        </g>
      ))}
    </>
  );
}

export default function GameShelfArt() {
  return (
    <svg viewBox="0 0 200 390" className="block h-auto w-full" aria-hidden focusable="false">
      <defs>
        <linearGradient id="shelf-side" x1="0" x2="1">
          <stop offset="0" stopColor="#4a3423" />
          <stop offset="1" stopColor="#3a271c" />
        </linearGradient>
      </defs>

      {/* top and side faces */}
      <path d="M0 30 L160 62 L190 56 L30 24 Z" fill="#8a6243" stroke="#2b1d12" strokeWidth="2" strokeLinejoin="round" />
      <path d="M160 62 L190 56 L190 356 L160 362 Z" fill="url(#shelf-side)" stroke="#2b1d12" strokeWidth="2" strokeLinejoin="round" />

      <g transform={FRONT}>
        {/* frame and recessed back */}
        <rect x="0" y="30" width="160" height="300" fill="#62442e" stroke="#2b1d12" strokeWidth="2" />
        <rect x="10" y="40" width="140" height="232" fill="#2c1e13" />

        {/* shelves */}
        <g fill="#8a6243" stroke="#2b1d12" strokeWidth="1.2">
          <rect x="8" y="110" width="144" height="8" />
          <rect x="8" y="190" width="144" height="8" />
          <rect x="8" y="270" width="144" height="8" />
        </g>

        {/* top shelf: a flat stack + uprights */}
        <g stroke="#2b1d12" strokeWidth="1.2">
          <rect x="14" y="96" width="70" height="14" fill="#7b302e" />
          <rect x="18" y="84" width="62" height="12" fill="#e8dcc4" />
          <rect x="16" y="72" width="66" height="12" fill="#4d674d" />
          <rect x="22" y="62" width="56" height="10" fill="#c9a227" />
        </g>
        <path d="M24 102 H74 M26 90 H72" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
        <Uprights rows={topRow} floor={110} />

        {/* middle shelf: uprights + The Pack displayed face-out */}
        <Uprights rows={midRow} floor={190} />
        <g>
          <rect x="86" y="124" width="60" height="64" rx="2" fill="#1a1d1a" stroke="#c9a227" strokeWidth="2" />
          <rect x="91" y="129" width="50" height="54" fill="none" stroke="#c9a227" strokeWidth="0.8" opacity="0.7" />
          {/* fanned cards */}
          <g stroke="#2b1d12" strokeWidth="0.8">
            <rect x="104" y="134" width="14" height="20" rx="1.5" fill="#efe7d2" transform="rotate(-14 111 154)" />
            <rect x="109" y="133" width="14" height="20" rx="1.5" fill="#efe7d2" />
            <rect x="114" y="134" width="14" height="20" rx="1.5" fill="#efe7d2" transform="rotate(14 121 154)" />
          </g>
          <path d="M116 139 C 112 144 110 146 113 148 C 114.5 149 116 148 116 147 C 116 148 117.5 149 119 148 C 122 146 120 144 116 139 Z" fill="#2a2620" />
          <text x="116" y="168" textAnchor="middle" fontSize="8.5" letterSpacing="1.5" fill="#ddb63a" fontFamily="var(--font-mono), monospace" fontWeight="600">
            THE
          </text>
          <text x="116" y="178" textAnchor="middle" fontSize="8.5" letterSpacing="1.5" fill="#ddb63a" fontFamily="var(--font-mono), monospace" fontWeight="600">
            PACK
          </text>
        </g>

        {/* bottom shelf: dice, meeples, a deck of cards, a pawn */}
        <g stroke="#2b1d12" strokeWidth="1.2">
          <rect x="16" y="254" width="16" height="16" rx="3" fill="#efe7d2" />
          <rect x="36" y="258" width="12" height="12" rx="2.5" fill="#c1442d" />
          <path d="M60 270 L60 258 C 54 258 54 250 60 250 C 58 244 68 244 66 250 C 72 250 72 258 66 258 L66 270 Z" fill="#2f7a6b" />
          <path d="M78 270 L78 258 C 72 258 72 250 78 250 C 76 244 86 244 84 250 C 90 250 90 258 84 258 L84 270 Z" fill="#ddb63a" />
          <rect x="98" y="248" width="22" height="22" fill="#274b6d" />
          <path d="M132 270 C 132 262 136 258 138 256 C 134 254 134 246 140 246 C 146 246 146 254 142 256 C 144 258 148 262 148 270 Z" fill="#e8dcc4" />
        </g>
        <g fill="#2a2620">
          <circle cx="21" cy="259" r="1.4" />
          <circle cx="27" cy="265" r="1.4" />
          <circle cx="24" cy="262" r="1.4" />
          <circle cx="42" cy="264" r="1.3" fill="#efe7d2" />
        </g>
        <rect x="101" y="251" width="16" height="16" fill="none" stroke="#8fb4d8" strokeWidth="0.8" />

        {/* cabinet doors */}
        <g stroke="#2b1d12" strokeWidth="1.2">
          <rect x="12" y="282" width="66" height="42" fill="#7a5636" />
          <rect x="82" y="282" width="66" height="42" fill="#7a5636" />
          <circle cx="72" cy="303" r="2.5" fill="#a98245" />
          <circle cx="88" cy="303" r="2.5" fill="#a98245" />
        </g>
      </g>
    </svg>
  );
}
