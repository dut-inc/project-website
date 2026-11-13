import type { CSSProperties } from "react";

// The open-water backdrop behind the quiz (styles in
// app/fish-stuff/identify/fish-id.css). `depth` runs from 0 (selection screen)
// to 1 and darkens the water as a run's score grows.
export default function Water({ depth = 0 }: { depth?: number }) {
  const style = { "--fid-depth": Math.min(1, Math.max(0, depth)) } as CSSProperties;
  return (
    <div aria-hidden className="fid-water" style={style}>
      <div className="fid-snow fid-snow-far" />
      <div className="fid-snow fid-snow-near" />
    </div>
  );
}
