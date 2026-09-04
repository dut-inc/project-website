import type { Metadata } from "next";
<<<<<<< HEAD
import { Barlow_Condensed, Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
=======
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono, Playfair_Display, Oswald} from "next/font/google";
>>>>>>> 816efaa3c1176ec9ee0c5e3ae494e2be7d76ac68
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

<<<<<<< HEAD
// The Seattle Sports Center title — a condensed grotesque that matches the
// letterforms of the real Pike Place Market sign.
const sign = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-sign",
=======
const dleHeading = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal"],
  variable: "--font-dle",
>>>>>>> 816efaa3c1176ec9ee0c5e3ae494e2be7d76ac68
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
<<<<<<< HEAD
        className={`${display.variable} ${body.variable} ${mono.variable} ${sign.variable} font-body wall-bg text-cream min-h-screen`}
=======
        className={`${display.variable} ${body.variable} ${mono.variable} ${dleHeading.variable} font-body wall-bg text-cream min-h-screen`}
>>>>>>> 816efaa3c1176ec9ee0c5e3ae494e2be7d76ac68
      >
        <Nav />
        <main className="relative mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-8">{children}</main>
      </body>
    </html>
  );
}
