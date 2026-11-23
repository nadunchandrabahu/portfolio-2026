import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

// Every font is served from this site, never requested from Google at
// runtime (CLAUDE.md 2.4). next/font/google downloads at build time.
//
// Only the two faces needed for the first paint are preloaded (Plex Sans
// regular for body text, Archivo for the name). Preloading all four costs
// ~1.5s of LCP on slow 4G because they compete for bandwidth.

/**
 * Display: Archivo variable, trimmed to weights 500–800 and widths 100–125%
 * (56 KB instead of 88 KB). Regenerate with scripts/fonts/subset_archivo.py.
 */
export const archivo = localFont({
  src: "./fonts/archivo-variable.woff2",
  weight: "500 800",
  style: "normal",
  variable: "--font-archivo",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "100% 125%" }],
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
