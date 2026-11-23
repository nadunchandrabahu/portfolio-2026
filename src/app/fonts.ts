import { Archivo, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";

// next/font downloads these at build time and serves them from this site,
// so nothing is requested from Google at runtime (CLAUDE.md 2.4).
//
// Only the two faces needed for the first paint are preloaded (Plex Sans
// regular for body text, Archivo for the name). Preloading all four costs
// ~1.5s of LCP on slow 4G because they compete for bandwidth.

/** Display: variable weight plus the width axis for the expanded cuts. */
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

/** Body: 400/500. */
export const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: "variable",
  style: "normal",
  variable: "--font-plex-sans",
  display: "swap",
});

/** Body italic, used only by the footer verse. */
export const plexSansItalic = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: "variable",
  style: "italic",
  variable: "--font-plex-sans-italic",
  display: "swap",
  preload: false,
});

/** Mono: the instrument voice for labels, tags and readouts. */
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: false,
});
