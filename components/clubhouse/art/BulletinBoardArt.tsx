// Placeholder art: a corkboard of loose ends. Drawn flat (front-on); the room
// skews it onto the wall when its placement says plane: "left-wall".
// viewBox 260 × 190.

function Pin({ x, y, fill }: { x: number; y: number; fill: string }) {
  return (
    <g>
      <ellipse cx={x + 1.5} cy={y + 3} rx="4" ry="1.5" fill="rgba(0,0,0,0.35)" />
      <circle cx={x} cy={y} r="4.5" fill={fill} stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
      <circle cx={x - 1.3} cy={y - 1.5} r="1.4" fill="rgba(255,255,255,0.7)" />
    </g>
  );
}

export default function BulletinBoardArt() {
  return (
    <svg viewBox="0 0 260 190" className="block h-auto w-full" aria-hidden focusable="false">
      <defs>
        <pattern id="board-cork" width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="14" fill="#9a7048" />
          <circle cx="3" cy="4" r="1.2" fill="#7c5a3c" />
          <circle cx="10" cy="9" r="1" fill="#b38658" />
          <circle cx="7" cy="12" r="0.8" fill="#6e4f33" />
        </pattern>
      </defs>

      {/* frame + cork */}
      <rect x="2" y="2" width="256" height="186" rx="6" fill="#5a3d26" stroke="#2b1d12" strokeWidth="3" />
      <rect x="12" y="12" width="236" height="166" rx="2" fill="url(#board-cork)" />
      <rect x="12" y="12" width="236" height="166" rx="2" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="4" />

      {/* index card with scribbles */}
      <g transform="rotate(-4 58 56)">
        <rect x="24" y="24" width="72" height="56" fill="#efe7d2" />
        <line x1="24" y1="36" x2="96" y2="36" stroke="#c1442d" strokeWidth="1" opacity="0.6" />
        <g stroke="#6b6250" strokeWidth="1.4" strokeLinecap="round">
          <path d="M30 46 C 44 44 58 48 88 45" />
          <path d="M30 56 C 40 54 62 58 80 55" />
          <path d="M30 66 C 46 64 54 68 86 65" />
        </g>
      </g>
      <Pin x={60} y={26} fill="#d65b3f" />

      {/* sticky notes */}
      <g transform="rotate(5 134 46)">
        <rect x="112" y="24" width="44" height="44" fill="#ddb63a" />
        <path d="M118 40 L148 40 M118 50 L140 50" stroke="#6b5313" strokeWidth="1.6" strokeLinecap="round" />
      </g>
      <g transform="rotate(-7 220 112)">
        <rect x="198" y="92" width="40" height="40" fill="#8fd3c6" />
        <path d="M204 106 L230 106 M204 116 L222 116" stroke="#1d4a42" strokeWidth="1.6" strokeLinecap="round" />
      </g>

      {/* polaroid — reuses the existing review photo */}
      <g transform="rotate(3 205 52)">
        <rect x="174" y="20" width="62" height="70" fill="#f7f2e4" />
        <rect x="179" y="25" width="52" height="50" fill="#2a2620" />
        <image href="/images/ibisreview.png" x="179" y="25" width="52" height="50" preserveAspectRatio="xMidYMid slice" />
        <path d="M184 83 C 196 80 210 84 226 81" stroke="#6b6250" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
      <Pin x={205} y={22} fill="#3a6690" />

      {/* lightbulb sketch on graph paper */}
      <g transform="rotate(-3 70 132)">
        <rect x="30" y="100" width="80" height="66" fill="#e7ddc2" />
        <g stroke="rgba(42,38,32,0.15)" strokeWidth="0.8">
          <path d="M30 110 H110 M30 120 H110 M30 130 H110 M30 140 H110 M30 150 H110 M30 160 H110" />
          <path d="M40 100 V166 M50 100 V166 M60 100 V166 M70 100 V166 M80 100 V166 M90 100 V166 M100 100 V166" />
        </g>
        <g fill="none" stroke="#2a2620" strokeWidth="1.6" strokeLinecap="round">
          <path d="M62 148 C 50 138 52 116 70 114 C 88 116 90 138 78 148 Z" />
          <path d="M64 152 H76 M65 156 H75" />
          <path d="M70 106 V102 M92 120 L96 117 M48 120 L44 117" />
        </g>
      </g>
      <Pin x={70} y={104} fill="#ddb63a" />

      {/* torn paper scrap */}
      <path d="M126 98 L178 94 L182 140 L172 144 L160 139 L146 146 L130 141 Z" fill="#d9c8a0" />
      <path d="M134 110 H170 M134 120 H162 M134 130 H168" stroke="#6b6250" strokeWidth="1.3" strokeLinecap="round" />
      <Pin x={152} y={100} fill="#3f9284" />

      {/* red string — literal loose ends, one dangling free */}
      <g fill="none" stroke="#c1442d" strokeWidth="1.4" strokeLinecap="round">
        <path d="M60 26 C 100 50 160 60 205 22" />
        <path d="M70 104 C 100 120 130 96 152 100" />
        <path d="M152 100 C 170 130 186 150 176 172" />
      </g>
    </svg>
  );
}
