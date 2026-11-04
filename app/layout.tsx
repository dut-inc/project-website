import type { Metadata } from "next";
import { Caveat, Fraunces, IBM_Plex_Sans, IBM_Plex_Mono, Playfair_Display, Oswald} from "next/font/google";
import "./globals.css";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const dleHeading = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal"],
  variable: "--font-dle",
});

// Marker-scrawl handwriting — used for annotations on the punk collage pages.
// (font-sign classes existed before this variable did, so this finally makes them real.)
const sign = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-sign",
});

export const metadata: Metadata = {
  title: "Perpetual Studio",
  description: "A shared workspace for our projects, tools, experiments and loose ends.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} ${dleHeading.variable} ${sign.variable} font-body bg-studio-editor text-cream min-h-screen`}
      >
        <WorkspaceShell>{children}</WorkspaceShell>
      </body>
    </html>
  );
}
