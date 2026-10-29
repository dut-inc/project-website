// Placeholder art: the desktop room shell — night sky, two angled walls
// meeting in a corner, floorboards, and the non-interactive furniture
// (armchair, lamp, rug, the cat). Interactive objects sit on top of this.
// The core composition is 0 0 1600 1000 (ROOM_ASPECT.desktop in
// lib/clubhouse.ts); the room carries on for 800 units left/right/up and
// 800 down so it can fill any screen shape without cropping the objects.

// Wall planes: draw flat inside these groups and it lands on the wall.
// Left wall: flat y 200 (top) → 740 (floor). Right wall: flat y −80 → 460.
const LEFT = "matrix(1 -0.2 0 1 0 0)";
const RIGHT = "matrix(1 0.2 0 1 0 0)";

// Full viewBox, including the bleed around the core composition.
const BLEED = { x: -800, y: -800, width: 3200, height: 2600 };

// Stars: a few placed by hand in the core sky, plus a deterministic scatter
// for the bleed (anything that lands behind a wall is simply covered).
const stars: [number, number, number][] = [
  [330, 40, 1.6], [420, 90, 1.2], [520, 28, 1.8], [610, 60, 1.1], [760, 22, 1.4], [860, 52, 1.9],
  [960, 18, 1.2], [1040, 70, 1.5], [1130, 34, 1.1], [1230, 96, 1.6], [1290, 26, 1.3], [1520, 40, 1.7],
  [1560, 150, 1.2], [1480, 170, 1.4], [700, 30, 1], [380, 130, 1],
];
for (let i = 0, seed = 7; i < 90; i++) {
  seed = (seed * 9301 + 49297) % 233280;
  const x = BLEED.x + (seed / 233280) * BLEED.width;
  seed = (seed * 9301 + 49297) % 233280;
  const y = BLEED.y + (seed / 233280) * 1160;
  if (y < 0 || x < 0 || x > 1600) stars.push([Math.round(x), Math.round(y), 1 + (i % 4) * 0.3]);
}

// String lights draped along the top of the walls: [x, y] anchor points,
// hung 12 units below the wall tops (left: y = 200 − 0.2x, right: y = 0.2x − 80).
const lightAnchors: [number, number][] = [];
for (let x = -750; x < 700; x += 150) lightAnchors.push([x, 212 - 0.2 * x]);
for (let x = 700; x <= 2400; x += 150) lightAnchors.push([x, 0.2 * x - 68]);

export default function RoomBackdrop({ className = "" }: { className?: string }) {
  const lightPath = lightAnchors
    .map(([x, y], i) => {
      if (i === 0) return `M${x} ${y}`;
      const [px, py] = lightAnchors[i - 1];
      return `Q${(px + x) / 2} ${(py + y) / 2 + 26} ${x} ${y}`;
    })
    .join(" ");
  const bulbs = lightAnchors.slice(1).map(([x, y], i) => {
    const [px, py] = lightAnchors[i];
    return [(px + x) / 2, (py + y) / 2 + 14] as const;
  });

  return (
    <svg
      viewBox={`${BLEED.x} ${BLEED.y} ${BLEED.width} ${BLEED.height}`}
      className={`block ${className}`}
      aria-hidden
      focusable="false"
    >
      <defs>
        {/* Solid #0f1520 above y=0 so the sky meets the navbar without a seam. */}
        <linearGradient id="rd-sky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="700">
          <stop offset="0" stopColor="#0f1520" />
          <stop offset="1" stopColor="#1f2b38" />
        </linearGradient>
        <linearGradient id="rd-wall-left" x1="0" x2="1">
          <stop offset="0" stopColor="#2f4636" />
          <stop offset="1" stopColor="#3f5c46" />
        </linearGradient>
        <linearGradient id="rd-wall-right" x1="0" x2="1">
          <stop offset="0" stopColor="#4a6a4f" />
          <stop offset="1" stopColor="#36503d" />
        </linearGradient>
        <linearGradient id="rd-floor" gradientUnits="userSpaceOnUse" x1="0" y1="600" x2="0" y2="1000">
          <stop offset="0" stopColor="#6e4c30" />
          <stop offset="1" stopColor="#8a6243" />
        </linearGradient>
        <pattern id="rd-wallpaper" width="48" height="56" patternUnits="userSpaceOnUse">
          <path d="M24 10 C 30 18 30 26 24 32 C 18 26 18 18 24 10 Z" fill="#ffffff" opacity="0.05" />
          <circle cx="0" cy="44" r="2" fill="#ffffff" opacity="0.05" />
          <circle cx="48" cy="44" r="2" fill="#ffffff" opacity="0.05" />
        </pattern>
        <pattern id="rd-planks" width="160" height="34" patternUnits="userSpaceOnUse" patternTransform="matrix(1 -0.2 0 1 0 0)">
          <rect width="160" height="34" fill="none" />
          <path d="M0 33.5 H160" stroke="#4a3423" strokeWidth="2" opacity="0.55" />
          <path d="M20 12 C 40 10 60 14 80 12" stroke="#a07550" strokeWidth="1" opacity="0.35" fill="none" />
        </pattern>
        <radialGradient id="rd-lamp" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd38a" stopOpacity="0.42" />
          <stop offset="0.5" stopColor="#ffc06b" stopOpacity="0.14" />
          <stop offset="1" stopColor="#ffc06b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rd-moonglow">
          <stop offset="0" stopColor="#f4e6c0" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f4e6c0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rd-vignette" gradientUnits="userSpaceOnUse" cx="800" cy="700" r="1500">
          <stop offset="0.5" stopColor="#0f1520" stopOpacity="0" />
          <stop offset="1" stopColor="#0f1520" stopOpacity="0.85" />
        </radialGradient>
        <linearGradient id="rd-window-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c2a44" />
          <stop offset="1" stopColor="#36507a" />
        </linearGradient>
      </defs>

      {/* night sky above the open-roofed room */}
      <rect x={BLEED.x} y={BLEED.y} width={BLEED.width} height={BLEED.height} fill="url(#rd-sky)" />
      {stars.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#f4e6c0" className={i % 4 === 0 ? "clubhouse-twinkle" : undefined} opacity="0.8" />
      ))}
      {/* moon — low enough to stay clear of the navbar */}
      <circle cx="1460" cy="172" r="90" fill="url(#rd-moonglow)" />
      <path d="M1480 142 A 34 34 0 1 0 1480 202 A 26 26 0 1 1 1480 142 Z" fill="#f4e6c0" />

      {/* left wall */}
      <g transform={LEFT}>
        <rect x="-800" y="200" width="1500" height="540" fill="url(#rd-wall-left)" />
        <rect x="-800" y="200" width="1500" height="360" fill="url(#rd-wallpaper)" />
        {/* wainscoting */}
        <rect x="-800" y="560" width="1500" height="180" fill="#5a3d26" />
        {[-660, -490, -320, -150, 20, 190, 360, 530].map((x) => (
          <rect key={x} x={x} y="584" width="150" height="128" rx="4" fill="#62442e" stroke="#3e2b1c" strokeWidth="2" />
        ))}
        <rect x="-800" y="552" width="1500" height="12" fill="#8a6243" />
        <rect x="-800" y="724" width="1500" height="16" fill="#3a271c" />
        {/* wall cap */}
        <rect x="-800" y="186" width="1500" height="16" fill="#3a271c" />
        <rect x="-800" y="186" width="1500" height="3" fill="#8a6243" />

        {/* round porthole window, out past the tree */}
        <circle cx="-170" cy="380" r="62" fill="url(#rd-window-sky)" />
        <circle cx="-150" cy="360" r="1.6" fill="#f4e6c0" />
        <circle cx="-196" cy="400" r="1.2" fill="#f4e6c0" />
        <path d="M-232 380 H-108 M-170 318 V442" stroke="#5a3d26" strokeWidth="5" />
        <circle cx="-170" cy="380" r="62" fill="none" stroke="#a98245" strokeWidth="10" />
      </g>

      {/* right wall */}
      <g transform={RIGHT}>
        <rect x="700" y="-80" width="1700" height="540" fill="url(#rd-wall-right)" />
        <rect x="700" y="-80" width="1700" height="360" fill="url(#rd-wallpaper)" />
        <rect x="700" y="280" width="1700" height="180" fill="#62442e" />
        {[720, 900, 1080, 1260, 1440, 1620, 1800, 1980, 2160].map((x) => (
          <rect key={x} x={x} y="304" width="150" height="128" rx="4" fill="#6b4a30" stroke="#3e2b1c" strokeWidth="2" />
        ))}
        <rect x="700" y="272" width="1700" height="12" fill="#9a6e45" />
        <rect x="700" y="444" width="1700" height="16" fill="#3a271c" />
        <rect x="700" y="-94" width="1700" height="16" fill="#3a271c" />
        <rect x="700" y="-94" width="1700" height="3" fill="#9a6e45" />

        {/* a pennant past the aquarium */}
        <path d="M1660 0 L1790 26 L1660 52 Z" fill="#2f7a6b" stroke="#2b1d12" strokeWidth="2" />
        <circle cx="1660" cy="0" r="4" fill="#a98245" />

        {/* arched window with the night outside */}
        <path d="M990 130 V 20 A 70 70 0 0 1 1130 20 V 130 Z" fill="url(#rd-window-sky)" />
        <circle cx="1030" cy="30" r="1.6" fill="#f4e6c0" />
        <circle cx="1090" cy="0" r="1.2" fill="#f4e6c0" />
        <circle cx="1100" cy="70" r="1.4" fill="#f4e6c0" />
        <path d="M990 130 C 1020 100 1050 110 1070 90 C 1090 104 1110 96 1130 112 V130 Z" fill="#22382b" />
        <g fill="none" stroke="#5a3d26" strokeWidth="7">
          <path d="M990 130 V 20 A 70 70 0 0 1 1130 20 V 130 Z" />
          <path d="M1060 -50 V130 M990 46 H1130" strokeWidth="5" />
        </g>
        <rect x="978" y="128" width="164" height="12" rx="2" fill="#8a6243" stroke="#3e2b1c" strokeWidth="2" />
        {/* a fern on the sill */}
        <path d="M1104 128 L1100 112 L1124 112 L1120 128 Z" fill="#c1442d" stroke="#3e2b1c" strokeWidth="1.5" />
        <g fill="none" stroke="#5b8c4c" strokeWidth="3" strokeLinecap="round">
          <path d="M1112 112 C 1104 96 1094 92 1086 94" />
          <path d="M1112 112 C 1114 92 1122 84 1130 84" />
          <path d="M1112 112 C 1110 98 1112 90 1110 80" />
        </g>

        {/* framed mountain print above the aquarium */}
        <rect x="1290" y="-40" width="130" height="96" fill="#3a271c" />
        <rect x="1300" y="-30" width="110" height="76" fill="#e8dcc4" />
        <path d="M1300 46 L1340 0 L1356 16 L1376 -14 L1410 46 Z" fill="#4d674d" />
        <path d="M1368 -2 L1376 -14 L1384 -2 L1378 2 Z" fill="#efe7d2" />
        <circle cx="1392" cy="-16" r="6" fill="#ddb63a" />
      </g>

      {/* corner shadow */}
      <path d="M700 60 L700 600" stroke="#1a1410" strokeWidth="10" opacity="0.35" />

      {/* floor */}
      <path d="M-800 900 L700 600 L2400 940 L2400 1800 L-800 1800 Z" fill="url(#rd-floor)" />
      <path d="M-800 900 L700 600 L2400 940 L2400 1800 L-800 1800 Z" fill="url(#rd-planks)" />

      {/* vines the tree has pushed along the top of the left wall */}
      <g fill="none" stroke="#355a3a" strokeWidth="4" strokeLinecap="round">
        <path d="M250 168 C 320 150 380 150 440 128 C 500 108 540 112 600 90" />
        <path d="M330 154 C 336 180 326 200 334 226" strokeWidth="3" />
        <path d="M470 120 C 478 146 468 160 474 184" strokeWidth="3" />
      </g>
      <g fill="#4f7f45" stroke="#1e3322" strokeWidth="0.8">
        {[[300, 160, 20], [360, 148, -30], [420, 134, 40], [500, 112, -20], [560, 100, 30], [334, 210, 100], [474, 170, 80]].map(([x, y, r], i) => (
          <path key={i} d="M0 0 C 7 -6 16 -6 22 0 C 16 6 7 6 0 0 Z" transform={`translate(${x} ${y}) rotate(${r})`} className={i % 2 ? "clubhouse-sway" : undefined} />
        ))}
      </g>

      {/* string lights */}
      <path d={lightPath} fill="none" stroke="#2b1d12" strokeWidth="2" />
      {bulbs.map(([x, y], i) => (
        <g key={i} className={i % 3 === 1 ? "clubhouse-twinkle" : undefined}>
          <circle cx={x} cy={y + 4} r="11" fill={["#ffd98a", "#f4a487", "#8fd3c6"][i % 3]} opacity="0.25" />
          <circle cx={x} cy={y + 4} r="4.5" fill={["#ffd98a", "#f4a487", "#8fd3c6"][i % 3]} />
        </g>
      ))}

      {/* potted fern past the aquarium */}
      <ellipse cx="1720" cy="902" rx="46" ry="10" fill="#000000" opacity="0.28" />
      <g fill="none" strokeLinecap="round" stroke="#4f7f45" strokeWidth="7">
        <path d="M1720 830 C 1690 780 1660 770 1636 776" />
        <path d="M1720 830 C 1750 776 1784 766 1806 774" />
        <path d="M1720 830 C 1712 770 1722 740 1716 716" stroke="#5b8c4c" />
        <path d="M1720 830 C 1694 800 1676 806 1662 820" stroke="#6f9c55" />
        <path d="M1720 830 C 1748 800 1766 806 1782 820" stroke="#6f9c55" />
      </g>
      <path d="M1684 830 L1756 830 L1746 898 L1694 898 Z" fill="#c1442d" stroke="#2b1d12" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M1680 826 H1760 V840 H1680 Z" fill="#a8392a" stroke="#2b1d12" strokeWidth="2.5" />

      {/* rug */}
      <ellipse cx="860" cy="868" rx="390" ry="104" fill="#c9a227" />
      <ellipse cx="860" cy="868" rx="372" ry="94" fill="#8c3b2e" />
      <ellipse cx="860" cy="868" rx="300" ry="72" fill="none" stroke="#efe7d2" strokeWidth="4" strokeDasharray="14 12" opacity="0.6" />
      <ellipse cx="860" cy="868" rx="190" ry="44" fill="#2f5a4f" />
      <ellipse cx="860" cy="868" rx="120" ry="26" fill="none" stroke="#c9a227" strokeWidth="3" />

      {/* stack of books on the floor */}
      <g stroke="#2b1d12" strokeWidth="1.5">
        <rect x="320" y="880" width="80" height="16" fill="#274b6d" />
        <rect x="326" y="866" width="70" height="14" fill="#c9a227" />
        <rect x="318" y="852" width="76" height="14" fill="#7b302e" />
        <rect x="350" y="836" width="22" height="16" rx="3" fill="#efe7d2" />
      </g>
      <path d="M372 840 C 382 840 382 850 372 850" fill="none" stroke="#2b1d12" strokeWidth="2" />
      <path className="clubhouse-steam" d="M356 828 C 350 818 364 812 358 800" fill="none" stroke="#efe7d2" strokeWidth="2" strokeLinecap="round" opacity="0.5" />

      {/* armchair */}
      <ellipse cx="530" cy="902" rx="120" ry="20" fill="#000000" opacity="0.28" />
      <g stroke="#2b1d12" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M456 830 C 448 744 476 704 532 704 C 588 704 616 744 608 830 Z" fill="#b8862f" />
        <path d="M472 800 C 470 750 494 724 532 724 C 570 724 594 750 592 800 Z" fill="#c99a3c" />
        <rect x="430" y="790" width="44" height="96" rx="20" fill="#a77826" />
        <rect x="590" y="790" width="44" height="96" rx="20" fill="#a77826" />
        <path d="M466 822 L598 822 C 606 822 610 848 602 860 L462 860 C 454 848 458 822 466 822 Z" fill="#d8ab4c" />
        <rect x="462" y="860" width="140" height="22" fill="#a77826" />
        <rect x="446" y="884" width="10" height="16" fill="#2b1d12" />
        <rect x="608" y="884" width="10" height="16" fill="#2b1d12" />
        {/* cushion + a teal throw */}
        <path d="M498 790 C 492 770 510 760 528 768 C 546 760 562 774 554 792 C 540 800 512 800 498 790 Z" fill="#c1442d" />
        <path d="M588 788 C 610 784 640 790 636 810 L626 872 C 614 866 604 870 596 860 Z" fill="#2f7a6b" />
      </g>
      <path d="M600 808 L630 812 M598 828 L626 832 M596 848 L622 852" stroke="#8fd3c6" strokeWidth="2" opacity="0.6" />

      {/* floor lamp */}
      <circle cx="680" cy="600" r="300" fill="url(#rd-lamp)" className="clubhouse-glow" />
      <ellipse cx="680" cy="910" rx="34" ry="8" fill="#000000" opacity="0.3" />
      <ellipse cx="680" cy="904" rx="26" ry="7" fill="#3a271c" stroke="#2b1d12" strokeWidth="2" />
      <path d="M680 904 V 606" stroke="#a98245" strokeWidth="5" />
      <path d="M646 608 L714 608 L700 556 L660 556 Z" fill="#f2d79a" stroke="#2b1d12" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M646 608 L714 608" stroke="#fff2c4" strokeWidth="3" />

      {/* sleeping cat on the rug */}
      <g className="clubhouse-breathe">
        <ellipse cx="930" cy="874" rx="40" ry="20" fill="#3b3a3f" stroke="#1a1410" strokeWidth="2" />
        <path d="M966 880 C 990 880 994 860 978 856" fill="none" stroke="#3b3a3f" strokeWidth="8" strokeLinecap="round" />
        <circle cx="898" cy="866" r="15" fill="#3b3a3f" stroke="#1a1410" strokeWidth="2" />
        <path d="M886 856 L888 840 L898 852 Z M904 852 L912 840 L912 858 Z" fill="#3b3a3f" stroke="#1a1410" strokeWidth="2" strokeLinejoin="round" />
        <path d="M890 868 C 893 870 896 870 898 868 M902 868 C 905 870 908 870 910 868" stroke="#efe7d2" strokeWidth="1.5" fill="none" />
      </g>
      <text x="914" y="836" fontSize="22" fill="#efe7d2" opacity="0.6" fontFamily="var(--font-sign), cursive" className="clubhouse-twinkle">
        z
      </text>
      <text x="928" y="818" fontSize="16" fill="#efe7d2" opacity="0.5" fontFamily="var(--font-sign), cursive">
        z
      </text>

      {/* fireflies drifting near the tree */}
      {[[250, 520], [300, 420], [210, 610], [330, 300], [420, 260]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="#fff2a8" className="clubhouse-firefly" style={{ animationDelay: `${-i * 1.7}s` }} />
      ))}

      {/* soft vignette to pull focus inward */}
      <rect x={BLEED.x} y={BLEED.y} width={BLEED.width} height={BLEED.height} fill="url(#rd-vignette)" />
    </svg>
  );
}
