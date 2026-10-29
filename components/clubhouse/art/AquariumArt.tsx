import type { CSSProperties } from "react";

// Placeholder art: a big tank of Pacific Northwest fish on a wooden stand,
// drawn in the room's 3/4 view. viewBox 400 × 470.

const FRONT = "matrix(1 0.2 0 1 0 0)";

type FishProps = { x: number; y: number; scale?: number; body: string; fin: string; swim: number; duration: number; delay?: number; spots?: boolean };

// Drawn facing right; the swim animation flips it at each end of the tank.
function Fish({ x, y, scale = 1, body, fin, swim, duration, delay = 0, spots }: FishProps) {
  const style = { "--swim": `${swim}px`, animationDuration: `${duration}s`, animationDelay: `${delay}s` } as CSSProperties;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="clubhouse-fish" style={style}>
        <path d="M-22 0 L-34 -10 L-31 0 L-34 10 Z" fill={fin} stroke="#1a2a2a" strokeWidth="1" strokeLinejoin="round" />
        <path d="M-24 0 C -14 -13 10 -13 20 -2 C 22 0 22 1 20 3 C 10 13 -14 12 -24 0 Z" fill={body} stroke="#1a2a2a" strokeWidth="1.2" />
        <path d="M-6 -10 C -2 -16 6 -15 8 -9" fill={fin} stroke="#1a2a2a" strokeWidth="1" />
        <path d="M6 -6 C 3 -2 3 3 6 7" stroke="#1a2a2a" strokeWidth="1" fill="none" opacity="0.6" />
        {spots && (
          <g fill="#1a2a2a" opacity="0.5">
            <circle cx="-12" cy="-4" r="1.2" />
            <circle cx="-6" cy="-6" r="1.2" />
            <circle cx="-16" cy="1" r="1" />
          </g>
        )}
        <circle cx="13" cy="-2" r="2.4" fill="#f3ead4" />
        <circle cx="13.6" cy="-2" r="1.2" fill="#1a2a2a" />
      </g>
    </g>
  );
}

const bubbles: [number, number, number][] = [
  // x, radius, delay
  [272, 4, 0],
  [278, 3, 1.4],
  [268, 2.5, 2.6],
  [276, 3.5, 3.8],
];

export default function AquariumArt() {
  return (
    <svg viewBox="0 0 400 470" className="block h-auto w-full overflow-visible" aria-hidden focusable="false">
      <defs>
        <linearGradient id="aq-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4fa3a0" />
          <stop offset="0.5" stopColor="#2d7a80" />
          <stop offset="1" stopColor="#1d4f57" />
        </linearGradient>
        <linearGradient id="aq-side" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f7a7d" />
          <stop offset="1" stopColor="#163b42" />
        </linearGradient>
        <linearGradient id="aq-ray" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9fff6" stopOpacity="0.28" />
          <stop offset="1" stopColor="#e9fff6" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="aq-glow">
          <stop offset="0" stopColor="#7fd6cf" stopOpacity="0.3" />
          <stop offset="1" stopColor="#7fd6cf" stopOpacity="0" />
        </radialGradient>
        <clipPath id="aq-tank">
          <rect x="10" y="74" width="300" height="216" />
        </clipPath>
      </defs>

      {/* underwater light glowing on the wall */}
      <ellipse className="clubhouse-glow" cx="200" cy="200" rx="210" ry="170" fill="url(#aq-glow)" />

      {/* stand */}
      <path d="M0 300 L320 364 L380 352 L60 288 Z" fill="#8a6243" stroke="#2b1d12" strokeWidth="2" strokeLinejoin="round" />
      <path d="M320 364 L380 352 L380 442 L320 454 Z" fill="#3a271c" stroke="#2b1d12" strokeWidth="2" strokeLinejoin="round" />
      <g transform={FRONT}>
        <rect x="0" y="300" width="320" height="90" fill="#62442e" stroke="#2b1d12" strokeWidth="2" />
        <rect x="12" y="312" width="142" height="66" fill="#7a5636" stroke="#2b1d12" strokeWidth="1.2" />
        <rect x="166" y="312" width="142" height="66" fill="#7a5636" stroke="#2b1d12" strokeWidth="1.2" />
        <circle cx="146" cy="345" r="3" fill="#a98245" />
        <circle cx="174" cy="345" r="3" fill="#a98245" />
      </g>

      {/* tank side (seen through the glass) */}
      <path d="M310 132 L360 122 L360 342 L310 352 Z" fill="url(#aq-side)" stroke="#1a2a2a" strokeWidth="2" strokeLinejoin="round" />
      <path d="M310 318 L360 308 L360 342 L310 352 Z" fill="#b5a27c" />
      {/* hood */}
      <path d="M6 58 L314 120 L364 110 L56 48 Z" fill="#4a3423" stroke="#2b1d12" strokeWidth="2" strokeLinejoin="round" />
      <path d="M314 120 L364 110 L364 124 L314 134 Z" fill="#2b1d12" />

      <g transform={FRONT}>
        <g clipPath="url(#aq-tank)">
          <rect x="10" y="74" width="300" height="216" fill="url(#aq-water)" />
          {/* light shafts */}
          <path d="M40 74 L80 74 L130 290 L70 290 Z" fill="url(#aq-ray)" />
          <path d="M160 74 L186 74 L230 290 L190 290 Z" fill="url(#aq-ray)" />
          {/* driftwood + rocks */}
          <path d="M40 262 C 80 240 130 248 170 236 L176 246 C 140 258 90 256 46 272 Z" fill="#6a4a2f" stroke="#2b1d12" strokeWidth="1.2" />
          <ellipse cx="220" cy="270" rx="26" ry="14" fill="#6b6f6a" stroke="#2b2f2c" strokeWidth="1.2" />
          <ellipse cx="248" cy="276" rx="16" ry="9" fill="#868a82" stroke="#2b2f2c" strokeWidth="1.2" />
          {/* sand */}
          <path d="M10 270 C 60 262 110 278 160 268 C 210 258 260 276 310 266 L310 290 L10 290 Z" fill="#d9c8a0" />
          <path d="M10 280 C 70 274 140 286 210 278 C 250 274 290 282 310 278" stroke="#b5a27c" strokeWidth="1.5" fill="none" />
          {/* kelp and eelgrass */}
          <g fill="none" strokeLinecap="round">
            <path className="clubhouse-sway clubhouse-sway--rooted" d="M30 280 C 22 240 40 210 28 170 C 22 140 34 120 30 100" stroke="#4f7f45" strokeWidth="6" />
            <path className="clubhouse-sway clubhouse-sway--slow clubhouse-sway--rooted" d="M50 284 C 58 250 44 220 56 190 C 62 170 52 150 58 130" stroke="#6f9c55" strokeWidth="4" />
            <path className="clubhouse-sway clubhouse-sway--rooted" d="M286 276 C 292 250 280 230 290 200 C 296 184 288 170 292 156" stroke="#5b8c4c" strokeWidth="5" />
            <path className="clubhouse-sway clubhouse-sway--slow clubhouse-sway--rooted" d="M196 266 C 190 240 202 226 196 204" stroke="#6f9c55" strokeWidth="3.5" />
          </g>
          {/* fish: chinook salmon, rockfish, a lingcod and a little sculpin */}
          <Fish x={70} y={130} scale={1.25} body="#b9c4c6" fin="#8e9aa0" swim={150} duration={19} spots />
          <Fish x={150} y={190} scale={1.05} body="#e8642f" fin="#c1442d" swim={110} duration={14} delay={-5} />
          <Fish x={60} y={232} scale={0.85} body="#8a9a5b" fin="#5e6b3a" swim={180} duration={23} delay={-9} spots />
          <Fish x={210} y={110} scale={0.6} body="#ddb63a" fin="#a98245" swim={70} duration={11} delay={-3} />
          {/* bubbles */}
          <circle cx="272" cy="276" r="5" fill="#9aa39a" stroke="#2b2f2c" strokeWidth="1" />
          {bubbles.map(([x, r, delay]) => (
            <circle
              key={delay}
              className="clubhouse-bubble"
              cx={x}
              cy="268"
              r={r}
              fill="rgba(233,255,246,0.25)"
              stroke="rgba(233,255,246,0.75)"
              strokeWidth="1"
              style={{ animationDelay: `${-delay}s` }}
            />
          ))}
        </g>
        {/* glass edges and glare */}
        <rect x="10" y="74" width="300" height="216" fill="none" stroke="#1a2a2a" strokeWidth="3" />
        <path d="M24 84 L60 84 L28 150 L24 150 Z" fill="#ffffff" opacity="0.14" />
        <path d="M250 84 L262 84 L232 140 L226 140 Z" fill="#ffffff" opacity="0.1" />
        {/* hood front with its light strip */}
        <rect x="6" y="56" width="308" height="18" fill="#62442e" stroke="#2b1d12" strokeWidth="2" />
        <rect x="16" y="70" width="288" height="3" fill="#fff2c4" opacity="0.85" />
      </g>
    </svg>
  );
}
