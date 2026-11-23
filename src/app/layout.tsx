import type { Metadata, Viewport } from "next";
import { archivo, jetbrainsMono, plexSans, plexSansItalic } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nadun Chandrabahu · Data scientist and AI engineer, Sydney",
  // The meta description is the hero line (CLAUDE.md 11). Moves to src/content/site.ts in phase 2.
  description:
    "I build and evaluate machine learning systems, from statistical models on large datasets to LLM fine-tuning and agentic AI evaluation.",
};

export const viewport: Viewport = {
  themeColor: "#0f1011",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-AU"
      className={`${archivo.variable} ${plexSans.variable} ${plexSansItalic.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
