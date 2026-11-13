// The quiz's two button treatments, shared by <button> and <Link>.
// Square-cornered, hairline-bordered: labels on a specimen drawer, not pills.
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[2px] px-5 py-2.5 font-fidserif font-medium lining-nums text-[13px] uppercase tracking-[0.14em] transition-colors";

export function buttonClass(kind: "primary" | "quiet"): string {
  return kind === "primary"
    ? `${BASE} border border-fid-sand bg-fid-sand text-fid-ink hover:border-fid-white hover:bg-fid-white`
    : `${BASE} border border-fid-sand/35 text-fid-sand hover:border-fid-sand hover:bg-fid-sand/5`;
}
