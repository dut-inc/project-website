// Placeholder art: the mobile clubhouse — the same room re-stacked as a
// three-storey cutaway so every object stays big enough to tap.
// Loft (tree, corkboard, calendar) · den (game shelf, TV) · ground floor
// (aquarium). viewBox 1000 × 3000, matching ROOM_ASPECT.mobile.

// [top of storey, back edge of its floor, front edge of its floor]
const storeys: [number, number, number][] = [
  [300, 1150, 1250],
  [1290, 1900, 2010],
  [2050, 2760, 2880],
];

export default function RoomBackdropMobile({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1000 3000" className={`block h-full w-full ${className}`} aria-hidden focusable="false">
      <defs>
        <linearGradient id="rm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f1520" />
          <stop offset="0.3" stopColor="#1f2b38" />
          <stop offset="1" stopColor="#141a24" />
        </linearGradient>
        <linearGradient id="rm-wall" x1="0" x2="1">
          <stop offset="0" stopColor="#2f4636" />
          <stop offset="0.5" stopColor="#46654c" />
          <stop offset="1" stopColor="#36503d" />
        </linearGradient>
        <linearGradient id="rm-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5e412a" />
          <stop offset="1" stopColor="#8a6243" />
        </linearGradient>
        <pattern id="rm-wallpaper" width="48" height="56" patternUnits="userSpaceOnUse">
          <path d="M24 10 C 30 18 30 26 24 32 C 18 26 18 18 24 10 Z" fill="#ffffff" opacity="0.05" />
          <circle cx="0" cy="44" r="2" fill="#ffffff" opacity="0.05" />
          <circle cx="48" cy="44" r="2" fill="#ffffff" opacity="0.05" />
        </pattern>
        <radialGradient id="rm-lamp">
          <stop offset="0" stopColor="#ffd38a" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ffc06b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rm-window-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c2a44" />
          <stop offset="1" stopColor="#36507a" />
        </linearGradient>
      </defs>

      <rect width="1000" height="3000" fill="url(#rm-sky)" />
      {[[80, 60], [190, 140], [300, 40], [700, 50], [820, 170], [940, 90], [620, 130]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.4" fill="#f4e6c0" opacity="0.8" className={i % 3 === 0 ? "clubhouse-twinkle" : undefined} />
      ))}
      <path d="M880 70 A 40 40 0 1 0 880 140 A 30 30 0 1 1 880 70 Z" fill="#f4e6c0" />

      {/* the house: gable loft + walls */}
      <path d="M30 300 L500 90 L970 300 Z" fill="#2c4133" />
      <path d="M30 300 L500 90 L970 300 Z" fill="url(#rm-wallpaper)" />
      <rect x="30" y="300" width="940" height="2580" fill="url(#rm-wall)" />
      <rect x="30" y="300" width="940" height="2580" fill="url(#rm-wallpaper)" />

      {storeys.map(([top, back, front], i) => (
        <g key={top}>
          {/* wainscoting */}
          <rect x="30" y={back - 150} width="940" height="150" fill="#5a3d26" />
          {[60, 290, 520, 750].map((x) => (
            <rect key={x} x={x} y={back - 130} width="190" height="112" rx="4" fill="#62442e" stroke="#3e2b1c" strokeWidth="2" />
          ))}
          <rect x="30" y={back - 158} width="940" height="12" fill="#8a6243" />
          {/* floor in gentle one-point perspective */}
          <path d={`M60 ${back} L940 ${back} L970 ${front} L30 ${front} Z`} fill="url(#rm-floor)" />
          {[0.25, 0.5, 0.75].map((t) => (
            <path key={t} d={`M${60 - 30 * t} ${back + (front - back) * t} H${940 + 30 * t}`} stroke="#4a3423" strokeWidth="2" opacity="0.5" />
          ))}
          {/* ceiling beam / floor slab below this storey */}
          <rect x="10" y={front} width="980" height="40" fill="#3a271c" />
          <rect x="10" y={front} width="980" height="5" fill="#8a6243" />
          {i < 2 && <rect x="30" y={front + 40} width="940" height="24" fill="#000000" opacity="0.25" />}
        </g>
      ))}

      {/* house frame */}
      <rect x="10" y="300" width="34" height="2620" fill="#3a271c" />
      <rect x="956" y="300" width="34" height="2620" fill="#3a271c" />
      <path d="M-10 318 L500 76 L1010 318" fill="none" stroke="#3a271c" strokeWidth="36" strokeLinejoin="round" />
      <path d="M-10 300 L500 58 L1010 300" fill="none" stroke="#7b302e" strokeWidth="14" strokeLinejoin="round" />

      {/* loft: string lights under the gable + an arched window */}
      <path d="M90 300 Q 290 250 500 140 Q 710 250 910 300" fill="none" stroke="#2b1d12" strokeWidth="3" />
      {[[200, 262], [320, 214], [420, 170], [580, 170], [680, 214], [800, 262]].map(([x, y], i) => (
        <g key={i} className={i % 2 ? "clubhouse-twinkle" : undefined}>
          <circle cx={x} cy={y + 16} r="15" fill={["#ffd98a", "#f4a487", "#8fd3c6"][i % 3]} opacity="0.25" />
          <circle cx={x} cy={y + 16} r="6.5" fill={["#ffd98a", "#f4a487", "#8fd3c6"][i % 3]} />
        </g>
      ))}
      <path d="M380 1000 V 900 A 70 70 0 0 1 520 900 V 1000 Z" fill="url(#rm-window-sky)" />
      <path d="M380 1000 V 900 A 70 70 0 0 1 520 900 V 1000 Z M450 830 V1000 M380 920 H520" fill="none" stroke="#5a3d26" strokeWidth="7" />
      <rect x="368" y="996" width="164" height="12" rx="2" fill="#8a6243" />

      {/* den: rug + pennant */}
      <ellipse cx="560" cy="1960" rx="380" ry="40" fill="#8c3b2e" stroke="#c9a227" strokeWidth="8" />
      <path d="M150 1380 L290 1408 L150 1436 Z" fill="#2f7a6b" stroke="#2b1d12" strokeWidth="2" />
      <text x="168" y="1414" fontSize="18" fill="#efe7d2" fontFamily="var(--font-mono), monospace" letterSpacing="2">
        GO!
      </text>

      {/* ground floor: ladder up to the den, lamp, sleeping cat */}
      <g stroke="#6a4a2f" strokeWidth="12" strokeLinecap="round">
        <path d="M850 2050 V2840 M930 2050 V2840" />
        {[2110, 2210, 2310, 2410, 2510, 2610, 2710, 2800].map((y) => (
          <path key={y} d={`M850 ${y} H930`} strokeWidth="9" />
        ))}
      </g>
      <circle cx="830" cy="2160" r="200" fill="url(#rm-lamp)" className="clubhouse-glow" />
      <g className="clubhouse-breathe">
        <ellipse cx="830" cy="2846" rx="44" ry="20" fill="#3b3a3f" stroke="#1a1410" strokeWidth="2" />
        <circle cx="796" cy="2838" r="16" fill="#3b3a3f" stroke="#1a1410" strokeWidth="2" />
        <path d="M784 2828 L786 2810 L796 2824 Z M802 2824 L810 2810 L812 2830 Z" fill="#3b3a3f" stroke="#1a1410" strokeWidth="2" strokeLinejoin="round" />
      </g>

      {/* foundation + grass */}
      <rect x="0" y="2920" width="1000" height="80" fill="#2a2620" />
      <path d="M0 2920 C 60 2908 120 2924 180 2912 C 260 2900 330 2922 420 2910 C 520 2898 600 2922 700 2908 C 800 2898 880 2920 1000 2906 V2930 H0 Z" fill="#355a3a" />

      {/* fireflies */}
      {[[260, 320], [120, 520], [300, 700], [880, 1500], [700, 2300]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" fill="#fff2a8" className="clubhouse-firefly" style={{ animationDelay: `${-i * 1.7}s` }} />
      ))}
    </svg>
  );
}
