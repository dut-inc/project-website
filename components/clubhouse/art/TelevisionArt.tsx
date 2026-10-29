// Placeholder art: a chunky CRT on a media cabinet, showing an original
// stylized basketball broadcast (no real footage or logos). Drawn in the
// room's 3/4 view. viewBox 280 × 340.

const FRONT = "matrix(1 0.2 0 1 0 0)";

export default function TelevisionArt() {
  return (
    <svg viewBox="0 0 280 340" className="block h-auto w-full overflow-visible" aria-hidden focusable="false">
      <defs>
        <linearGradient id="tv-arena" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2a44" />
          <stop offset="1" stopColor="#2c3f5e" />
        </linearGradient>
        <linearGradient id="tv-court" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c58a4f" />
          <stop offset="1" stopColor="#e0a865" />
        </linearGradient>
        <pattern id="tv-scanlines" width="4" height="3" patternUnits="userSpaceOnUse">
          <rect width="4" height="1" fill="rgba(0,0,0,0.22)" />
        </pattern>
        <radialGradient id="tv-glow">
          <stop offset="0" stopColor="#9fc4ff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#9fc4ff" stopOpacity="0" />
        </radialGradient>
        <clipPath id="tv-screen">
          <rect x="44" y="84" width="112" height="102" rx="14" />
        </clipPath>
      </defs>

      {/* screen light spilling into the room */}
      <ellipse className="clubhouse-flicker" cx="110" cy="150" rx="130" ry="110" fill="url(#tv-glow)" />

      {/* media cabinet */}
      <path d="M0 210 L220 254 L260 246 L40 202 Z" fill="#8a6243" stroke="#2b1d12" strokeWidth="2" strokeLinejoin="round" />
      <path d="M220 254 L260 246 L260 316 L220 324 Z" fill="#3a271c" stroke="#2b1d12" strokeWidth="2" strokeLinejoin="round" />
      <g transform={FRONT}>
        <rect x="0" y="210" width="220" height="70" fill="#62442e" stroke="#2b1d12" strokeWidth="2" />
        <rect x="10" y="218" width="96" height="54" fill="#4a3423" stroke="#2b1d12" strokeWidth="1.2" />
        <rect x="114" y="218" width="96" height="54" fill="#4a3423" stroke="#2b1d12" strokeWidth="1.2" />
        {/* records / game cases peeking out */}
        <g stroke="#2b1d12" strokeWidth="1">
          <rect x="16" y="226" width="6" height="46" fill="#c1442d" />
          <rect x="24" y="230" width="6" height="42" fill="#efe7d2" />
          <rect x="32" y="224" width="6" height="48" fill="#274b6d" />
          <rect x="40" y="228" width="6" height="44" fill="#c9a227" />
        </g>
        <circle cx="194" cy="245" r="3" fill="#a98245" />
        {/* a little baseball on the cabinet */}
        <circle cx="196" cy="202" r="8" fill="#f3ead4" stroke="#2b1d12" strokeWidth="1.2" />
        <path d="M190 197 C 193 201 193 204 190 208 M202 197 C 199 201 199 204 202 208" stroke="#c1442d" strokeWidth="1" fill="none" />
      </g>

      {/* antenna */}
      <g stroke="#2b1d12" strokeWidth="2.5" strokeLinecap="round">
        <path d="M128 86 L92 14" />
        <path d="M134 88 L178 22" />
      </g>
      <circle cx="92" cy="14" r="4" fill="#a98245" stroke="#2b1d12" strokeWidth="1.5" />
      <circle cx="178" cy="22" r="4" fill="#a98245" stroke="#2b1d12" strokeWidth="1.5" />

      {/* CRT top and side */}
      <path d="M30 76 L190 108 L220 102 L60 70 Z" fill="#9a6e45" stroke="#2b1d12" strokeWidth="2" strokeLinejoin="round" />
      <path d="M190 108 L220 102 L220 232 L190 238 Z" fill="#4a3423" stroke="#2b1d12" strokeWidth="2" strokeLinejoin="round" />
      <path d="M128 85 C 130 78 136 78 138 87" fill="#2b1d12" />

      <g transform={FRONT}>
        {/* wood-grain casing */}
        <rect x="30" y="70" width="160" height="130" rx="10" fill="#7a5636" stroke="#2b1d12" strokeWidth="2.5" />
        <path d="M36 120 C 60 116 80 124 100 118 M36 160 C 56 156 70 164 92 158" stroke="#62442e" strokeWidth="1.5" fill="none" opacity="0.6" />
        <rect x="40" y="80" width="120" height="110" rx="16" fill="#1a1410" />

        {/* the broadcast */}
        <g clipPath="url(#tv-screen)">
          <rect x="44" y="84" width="112" height="102" fill="url(#tv-arena)" />
          {/* crowd */}
          <g fill="#4b5f82">
            {Array.from({ length: 18 }, (_, i) => (
              <circle key={i} cx={48 + i * 6.2} cy={112 + (i % 3) * 3} r="2.6" />
            ))}
          </g>
          <rect x="44" y="120" width="112" height="6" fill="#16223a" />
          {/* court */}
          <path d="M44 132 L156 132 L156 186 L44 186 Z" fill="url(#tv-court)" />
          <path d="M100 132 L100 186 M44 158 C 70 150 130 150 156 158" stroke="#f3ead4" strokeWidth="1.4" fill="none" opacity="0.8" />
          <path d="M126 132 L126 152 L156 152" stroke="#f3ead4" strokeWidth="1.4" fill="#c1442d" fillOpacity="0.35" />
          {/* hoop */}
          <rect x="141" y="96" width="14" height="12" fill="#efe7d2" stroke="#2a2620" strokeWidth="1" />
          <rect x="145" y="100" width="6" height="5" fill="none" stroke="#c1442d" strokeWidth="1" />
          <ellipse cx="146" cy="110" rx="7" ry="2" fill="none" stroke="#e8642f" strokeWidth="1.6" />
          <path d="M140 110 L142 120 M146 112 L146 121 M152 110 L150 120" stroke="#efe7d2" strokeWidth="0.8" />
          {/* shooter mid-jump */}
          <g fill="#efe7d2">
            <circle cx="72" cy="134" r="4" />
            <path d="M68 139 L76 139 L78 156 L66 156 Z" fill="#c1442d" />
            <path d="M74 140 L84 128" stroke="#efe7d2" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M68 156 L64 166 M76 156 L80 166" stroke="#efe7d2" strokeWidth="2.5" strokeLinecap="round" />
          </g>
          {/* shot arc + ball */}
          <path d="M86 126 C 104 92 130 92 144 106" stroke="#f3ead4" strokeWidth="1" strokeDasharray="2 3" fill="none" opacity="0.7" />
          <g className="clubhouse-ball">
            <circle cx="112" cy="100" r="5" fill="#e8642f" stroke="#2a2620" strokeWidth="1" />
            <path d="M107 100 H117 M112 95 V105" stroke="#2a2620" strokeWidth="0.7" />
          </g>
          {/* scorebug */}
          <rect x="48" y="172" width="74" height="10" rx="2" fill="#0e0f11" opacity="0.9" />
          <text x="52" y="179.5" fontSize="6.5" fill="#efe7d2" fontFamily="var(--font-mono), monospace">
            HOME 88 · AWAY 85
          </text>
          <rect x="124" y="172" width="16" height="10" rx="2" fill="#c9a227" />
          <text x="132" y="179.5" textAnchor="middle" fontSize="6.5" fill="#0e0f11" fontFamily="var(--font-mono), monospace">
            Q4
          </text>
          {/* live bug */}
          <circle cx="52" cy="92" r="2.2" fill="#ff4638" className="clubhouse-blink" />
          <text x="57" y="94.5" fontSize="6" fill="#efe7d2" fontFamily="var(--font-mono), monospace">
            LIVE
          </text>
          {/* scanlines, glare and flicker */}
          <rect x="44" y="84" width="112" height="102" fill="url(#tv-scanlines)" />
          <rect className="clubhouse-flicker" x="44" y="84" width="112" height="102" fill="#cfe0ff" fillOpacity="0.06" />
          <path d="M50 90 C 70 86 90 86 108 90 L 100 100 C 84 96 66 98 50 104 Z" fill="#ffffff" opacity="0.08" />
        </g>

        {/* knobs + speaker */}
        <circle cx="174" cy="96" r="6" fill="#a98245" stroke="#2b1d12" strokeWidth="1.5" />
        <circle cx="174" cy="114" r="6" fill="#a98245" stroke="#2b1d12" strokeWidth="1.5" />
        <path d="M168 132 H180 M168 138 H180 M168 144 H180 M168 150 H180 M168 156 H180" stroke="#2b1d12" strokeWidth="1.5" />

        {/* feet */}
        <rect x="46" y="200" width="16" height="8" fill="#2b1d12" />
        <rect x="158" y="200" width="16" height="8" fill="#2b1d12" />
      </g>
    </svg>
  );
}
