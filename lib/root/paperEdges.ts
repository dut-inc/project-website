// Torn paper edges for the Root Assistant theme (app/board-games/root/root-theme.css).
//
// Each edge is a seeded random walk: a gently ragged line that wanders a little in
// and out, with the odd sharp triangular tear, drawn as an SVG mask tile.
// The tile is opaque on the paper side. Tiles of different lengths repeat
// along each edge, so the pattern doesn't visibly line up. Three variants
// (torn-a, torn-b, torn-c) give neighbouring sheets different edges.
//
// Deterministic: the same seed always gives the same edge, so server and
// client agree and nothing changes between builds.

type Point = [number, number]; // [along the edge, depth into the paper]

function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEPTH = 20; // tile depth in SVG units; CSS stretches it to --tear

// The torn line along one edge, `length` units long, starting and ending at
// the same depth so tiles join seamlessly.
export function edgeProfile(length: number, seed: number): Point[] {
  const r = random(seed);
  const phase = r() * Math.PI * 2;
  const waves = 1 + Math.floor(r() * 2);
  const base = (t: number) => DEPTH * 0.42 + Math.sin((t / length) * Math.PI * 2 * waves + phase) * DEPTH * 0.12;

  // A gently ragged edge: small, frequent wobbles.
  const points: Point[] = [];
  for (let t = 0; t < length; t += 3 + r() * 5) {
    const d = base(t) + (r() - 0.5) * DEPTH * 0.14;
    points.push([t, Math.min(DEPTH * 0.6, Math.max(DEPTH * 0.08, d))]);
  }
  points[0] = [0, base(0)];
  points.push([length, base(0)]);

  // Tears: sharp triangular bites with straight sides and a pointed tip, as on
  // the game's torn-paper edges. Rare: usually one per tile, sometimes a small
  // second one, sometimes none.
  const cuts: { at: number; width: number; depth: number }[] = [];
  if (r() < 0.75) cuts.push({ at: length * (0.1 + r() * 0.7), width: 9 + r() * 9, depth: DEPTH * (0.85 + r() * 0.12) });
  if (r() < 0.4) cuts.push({ at: length * (0.1 + r() * 0.7), width: 5 + r() * 5, depth: DEPTH * (0.55 + r() * 0.15) });

  let out = points;
  for (const cut of cuts.sort((a, b) => a.at - b.at)) {
    const start = cut.at;
    const end = Math.min(length - 1, cut.at + cut.width);
    const before = out.filter(([t]) => t < start);
    const after = out.filter(([t]) => t > end);
    if (!before.length || !after.length) continue;
    const lean = 0.3 + r() * 0.4; // the tip sits off-centre, like a real tear
    out = [...before, [start, base(start)], [start + (end - start) * lean, cut.depth], [end, base(end)], ...after];
  }
  return out;
}

const fmt = (n: number) => Math.round(n * 10) / 10;

function svgUrl(width: number, height: number, d: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}' preserveAspectRatio='none'><path d='${d}' fill='black'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

type Side = "top" | "bottom" | "left" | "right";

// One mask tile: the paper side of the torn line is filled.
export function edgeTile(side: Side, length: number, seed: number): string {
  const profile = edgeProfile(length, seed);
  const line = (map: (p: Point) => Point) =>
    profile.map((p, i) => `${i ? "L" : "M"}${fmt(map(p)[0])} ${fmt(map(p)[1])}`).join(" ");
  switch (side) {
    case "top":
      return svgUrl(length, DEPTH, `${line(([t, d]) => [t, d])} L${length} ${DEPTH} L0 ${DEPTH} Z`);
    case "bottom":
      return svgUrl(length, DEPTH, `${line(([t, d]) => [t, DEPTH - d])} L${length} 0 L0 0 Z`);
    case "left":
      return svgUrl(DEPTH, length, `${line(([t, d]) => [d, t])} L${DEPTH} ${length} L${DEPTH} 0 Z`);
    case "right":
      return svgUrl(DEPTH, length, `${line(([t, d]) => [DEPTH - d, t])} L0 ${length} L0 0 Z`);
  }
}

const VARIANTS = [
  { name: "a", seed: 1301, lengths: { top: 463, bottom: 521, left: 487, right: 443 } },
  { name: "b", seed: 7919, lengths: { top: 509, bottom: 457, left: 433, right: 499 } },
  { name: "c", seed: 4243, lengths: { top: 449, bottom: 503, left: 479, right: 541 } },
] as const;

export const EDGE_VARIANTS = VARIANTS.map((v) => v.name);

// The CSS that defines --torn-* for each variant (.torn-a, .torn-b, .torn-c).
export function tornEdgeCss(): string {
  return VARIANTS.map(({ name, seed, lengths }) => {
    const sides: Side[] = ["top", "bottom", "left", "right"];
    const vars = sides.flatMap((side, i) => {
      const size = side === "top" || side === "bottom" ? "w" : "h";
      return [`--torn-${side}: ${edgeTile(side, lengths[side], seed + i * 101)};`, `--torn-${side}-${size}: ${lengths[side]}px;`];
    });
    return `.root-theme .torn-${name}{${vars.join("")}}`;
  }).join("\n");
}
