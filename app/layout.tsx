import type { Metadata } from "next";
import { Barlow_Condensed, Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

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

// The Seattle Sports Center title — a condensed grotesque that matches the
// letterforms of the real Pike Place Market sign.
const sign = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-sign",
});

export const metadata: Metadata = {
  title: "The Board",
  description: "Our shared clubhouse — pinned projects and a little bit of Seattle.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} ${sign.variable} font-body wall-bg text-cream min-h-screen`}
      >
        <Nav />
        <main className="relative mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-8">{children}</main>
      </body>
    </html>
  );
}
