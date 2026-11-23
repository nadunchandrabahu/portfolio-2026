import { Archivo, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";

// next/font downloads these at build time and serves them from this site,
// so nothing is requested from Google at runtime (CLAUDE.md 2.4).

/** Display: variable weight plus the width axis for the expanded cuts. */
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

/** Body: 400/500, plus italic for the footer verse. */
export const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-plex-sans",
  display: "swap",
});

/** Mono: the instrument voice for labels, tags and readouts. */
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
