// Small scissor-cut paper scrap for a player's name -- the same cutout
// language as the home page's pinned project cards and CaseHeader (see
// app/globals.css's "Paper cutouts" block), scaled down to label size.
// Rotation/cut-shape rotate per index so neighbouring tags never share a
// silhouette, and so it's deterministic rather than flickering on re-render.

const CUT_CLASSES = ["scrap-cut", "scrap-cut-b", "scrap-cut-c", "scrap-cut-d", "scrap-cut-e"];
const ROTATIONS = [-3, 2, -2, 3, -1.5, 1.5];

export type PaperNameTagProps = {
  name: string;
  index?: number;
};

export default function PaperNameTag({ name, index = 0 }: PaperNameTagProps) {
  const cutClass = CUT_CLASSES[index % CUT_CLASSES.length];
  const rotation = ROTATIONS[index % ROTATIONS.length];

  return (
    <span className="cutout scrap" style={{ transform: `rotate(${rotation}deg)` }}>
      <span className={`${cutClass} block bg-kraft px-2.5 py-1 font-display text-sm leading-none text-ink`}>
        {name}
      </span>
    </span>
  );
}
