import type { Metadata } from "next";
import { siteMetadata } from "@/lib/metadata";
import { Caveat, Fraunces, IBM_Plex_Sans, IBM_Plex_Mono, Pixelify_Sans, Playfair_Display, Oswald} from "next/font/google";
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

// Pixel wordmark for "Perpetual Studio" in the title bar.
const brand = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-brand",
});

export const metadata: Metadata = siteMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} ${dleHeading.variable} ${sign.variable} ${brand.variable} font-body bg-studio-editor text-cream min-h-screen`}
      >
        <WorkspaceShell>{children}</WorkspaceShell>
      </body>
    </html>
  );
}
