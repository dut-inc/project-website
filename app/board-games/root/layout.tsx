import type { ReactNode } from "react";
import { Alegreya, Alegreya_SC, IM_Fell_English } from "next/font/google";
import { tornEdgeCss } from "@/lib/root/paperEdges";
import "./root-theme.css";

// Every Root Assistant page: the paper-and-ink theme (root-theme.css), its
// fonts, and the torn-edge tiles (lib/root/paperEdges.ts).
//
// IM Fell English: a 17th-century type revival for titles, woodcut-storybook
// in feel. Alegreya: a bookish serif for reading rule text. Alegreya SC: small
// caps for labels and numbers, instead of the editor's monospace.

const display = IM_Fell_English({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-root-display",
  display: "swap",
});
const body = Alegreya({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-root-body", display: "swap" });
const label = Alegreya_SC({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-root-label", display: "swap" });

const EDGES = tornEdgeCss();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`root-theme ${display.variable} ${body.variable} ${label.variable} font-rootbody`}>
      <style dangerouslySetInnerHTML={{ __html: EDGES }} />
      {children}
    </div>
  );
}
