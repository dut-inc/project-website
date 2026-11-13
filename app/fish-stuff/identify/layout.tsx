import type { ReactNode } from "react";
import { EB_Garamond } from "next/font/google";
import "./fish-id.css";

// The Fish Identification Quiz: its open-water theme (fish-id.css) and type.
//
// EB Garamond, a revival of the faces natural-history monographs were set in,
// carries titles and every species name; its italic is the convention for
// binomials. Interface text stays in the site's IBM Plex Sans; the small all-caps labels
// and buttons are set in EB Garamond capitals too.

const serif = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fid-serif",
  display: "swap",
});

export default function FishIdLayout({ children }: { children: ReactNode }) {
  return <div className={`fid ${serif.variable}`}>{children}</div>;
}
