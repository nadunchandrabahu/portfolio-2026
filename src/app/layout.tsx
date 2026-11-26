import type { Metadata, Viewport } from "next";
import { site } from "@/content/site";
import { SITE_URL } from "@/lib/siteUrl";
import { THEME_COLORS, THEME_INIT_SCRIPT } from "@/lib/themeConfig";
import { archivo, jetbrainsMono, plexSans, plexSansItalic } from "./fonts";
import "./globals.css";

const title = `${site.name} · Data scientist and AI engineer, Sydney`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  // The meta description is the hero line (CLAUDE.md 11).
  description: site.heroLine,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.name,
    title,
    description: site.heroLine,
    locale: "en_AU",
  },
  twitter: { card: "summary_large_image", title, description: site.heroLine },
};

export const viewport: Viewport = {
  themeColor: THEME_COLORS.dark,
  colorScheme: "dark light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-AU"
      className={`${archivo.variable} ${plexSans.variable} ${plexSansItalic.variable} ${jetbrainsMono.variable}`}
      // The init script may set data-light / data-rain before React hydrates.
      suppressHydrationWarning
    >
      <head>
        {/* Saved theme (dark / light / rain) applied before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
