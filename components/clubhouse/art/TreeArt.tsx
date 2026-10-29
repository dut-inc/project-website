// Placeholder art: an old tree that has burst up through the floorboards.
// Purely decorative — navigation lives in RoomObject. viewBox 300 × 960.

const canopy: [number, number, number, string][] = [
  // cx, cy, r, fill — back to front, dark to light; kept inside the viewBox
  [80, 120, 76, "#2c4a32"],
  [170, 84, 84, "#2c4a32"],
  [236, 150, 60, "#2c4a32"],
  [112, 214, 76, "#30513a"],
  [210, 232, 64, "#30513a"],
  [56, 244, 52, "#30513a"],
  [258, 206, 38, "#355a3a"],
  [26, 176, 24, "#355a3a"],
  [146, 260, 40, "#355a3a"],
  [140, 134, 66, "#43703f"],
  [80, 66, 48, "#43703f"],
  [226, 76, 46, "#4f7f45"],
  [176, 196, 50, "#4f7f45"],
  [66, 190, 40, "#4f7f45"],
  [120, 42, 36, "#5b8c4c"],
  [200, 130, 30, "#5b8c4c"],
  [100, 150, 26, "#5b8c4c"],
];

// Little leaf sprigs layered over the canopy; every third one sways.
const sprigs: [number, number, number][] = [
  [22, 140, -30],
  [88, 10, 10],
  [150, 30, -12],
  [210, 22, 18],
  [276, 100, 40],
  [290, 190, 70],
  [255, 280, 120],
  [190, 292, 150],
  [120, 290, 190],
  [50, 300, 210],
  [8, 220, 250],
  [160, 160, 30],
  [80, 120, -40],
  [230, 160, 60],
];

function Leaf({ x, y, rotate, fill }: { x: number; y: number; rotate: number; fill: string }) {
  return (
    <path
      d="M0 0 C 7 -6 16 -6 22 0 C 16 6 7 6 0 0 Z"
      transform={`translate(${x} ${y}) rotate(${rotate})`}
      fill={fill}
      stroke="#1e3322"
      strokeWidth="0.8"
    />
  );
}

export default function TreeArt() {
  return (
    <svg viewBox="0 0 300 960" className="block h-auto w-full overflow-visible" aria-hidden focusable="false">
      <defs>
        <linearGradient id="tree-bark" x1="0" x2="1">
          <stop offset="0" stopColor="#3b2a1c" />
          <stop offset="0.55" stopColor="#6a4a2f" />
          <stop offset="1" stopColor="#4a3423" />
        </linearGradient>
        <radialGradient id="tree-lantern-glow">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* splintered floorboards around the roots */}
      <g stroke="#3e2b1c" strokeWidth="2" strokeLinejoin="round">
        <path d="M20 905 L96 880 L104 906 L30 934 Z" fill="#8a6243" />
        <path d="M200 884 L282 900 L276 928 L196 910 Z" fill="#7a5636" />
        <path d="M150 940 L230 930 L236 952 L158 958 Z" fill="#8a6243" />
      </g>

      {/* roots */}
      <g fill="url(#tree-bark)" stroke="#2b1d12" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M120 870 C 90 900 50 905 10 930 C 60 930 100 915 128 900 Z" />
        <path d="M190 870 C 220 895 260 895 296 920 C 250 925 210 915 182 900 Z" />
        <path d="M150 890 C 150 915 140 935 120 955 C 160 950 172 925 172 892 Z" />
      </g>

      {/* trunk */}
      <path
        d="M112 905 C 120 760 92 640 104 520 C 112 430 92 360 106 300 L 186 300 C 190 370 200 440 194 540 C 188 650 212 760 198 905 Z"
        fill="url(#tree-bark)"
        stroke="#2b1d12"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* bark lines and a knot */}
      <g fill="none" stroke="#2b1d12" strokeWidth="2" strokeLinecap="round" opacity="0.7">
        <path d="M128 860 C 134 760 118 680 128 590" />
        <path d="M170 870 C 176 780 164 700 176 600" />
        <path d="M150 560 C 146 480 158 420 150 330" />
        <path d="M124 470 C 120 420 130 380 124 340" />
      </g>
      <ellipse cx="160" cy="640" rx="12" ry="18" fill="#2b1d12" opacity="0.75" />
      <ellipse cx="161" cy="641" rx="6" ry="10" fill="#1a110a" />
      {/* moss */}
      <path d="M110 760 C 120 740 140 748 146 734 C 150 760 128 772 110 760 Z" fill="#5b8c4c" opacity="0.85" />
      <path d="M180 520 C 190 500 200 512 196 496 C 204 520 192 534 180 520 Z" fill="#5b8c4c" opacity="0.85" />

      {/* branches reaching into the room */}
      <g fill="none" stroke="#4a3423" strokeLinecap="round">
        <path d="M180 380 C 220 360 250 370 296 330" strokeWidth="16" />
        <path d="M118 360 C 80 330 50 330 14 300" strokeWidth="13" />
        <path d="M244 360 C 254 390 256 410 256 430" strokeWidth="4" stroke="#3b2a1c" />
      </g>

      {/* hanging lantern — a little magic in the branches */}
      <circle className="clubhouse-glow" cx="256" cy="462" r="46" fill="url(#tree-lantern-glow)" />
      <g stroke="#2b1d12" strokeWidth="2" strokeLinejoin="round">
        <path d="M244 436 L268 436 L264 444 L248 444 Z" fill="#a98245" />
        <rect x="246" y="444" width="20" height="30" rx="4" fill="#ffe2a0" />
        <path d="M246 474 L266 474 L262 482 L250 482 Z" fill="#a98245" />
      </g>

      {/* canopy */}
      {canopy.map(([cx, cy, r, fill], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={fill} />
      ))}
      <g fill="#6f9c55" opacity="0.5">
        <circle cx="120" cy="30" r="14" />
        <circle cx="236" cy="56" r="12" />
        <circle cx="64" cy="48" r="11" />
      </g>
      {sprigs.map(([x, y, rotate], i) => (
        <g key={i} className={i % 3 === 0 ? "clubhouse-sway" : undefined}>
          <Leaf x={x} y={y} rotate={rotate} fill={i % 2 ? "#6f9c55" : "#4f7f45"} />
          <Leaf x={x} y={y} rotate={rotate + 50} fill="#43703f" />
        </g>
      ))}

      {/* hanging vines */}
      <g fill="none" stroke="#355a3a" strokeWidth="3" strokeLinecap="round">
        <path d="M40 270 C 30 330 50 380 36 450" />
        <path d="M200 280 C 214 330 196 380 210 430" />
        <path d="M96 285 C 90 320 104 350 98 390" />
      </g>
      <g className="clubhouse-sway">
        <Leaf x={36} y={330} rotate={100} fill="#5b8c4c" />
        <Leaf x={40} y={400} rotate={60} fill="#4f7f45" />
        <Leaf x={36} y={450} rotate={110} fill="#6f9c55" />
      </g>
      <g className="clubhouse-sway clubhouse-sway--slow">
        <Leaf x={206} y={340} rotate={70} fill="#4f7f45" />
        <Leaf x={210} y={430} rotate={100} fill="#6f9c55" />
        <Leaf x={98} y={360} rotate={80} fill="#5b8c4c" />
      </g>

      {/* mushrooms among the roots */}
      <g stroke="#2b1d12" strokeWidth="1.5">
        <rect x="62" y="890" width="6" height="16" rx="2" fill="#efe7d2" />
        <path d="M52 892 C 54 876 76 876 78 892 Z" fill="#c1442d" />
        <rect x="80" y="898" width="5" height="11" rx="2" fill="#efe7d2" />
        <path d="M73 900 C 75 889 90 889 92 900 Z" fill="#d65b3f" />
      </g>
      <g fill="#efe7d2">
        <circle cx="60" cy="884" r="1.6" />
        <circle cx="70" cy="882" r="1.4" />
      </g>
    </svg>
  );
}
