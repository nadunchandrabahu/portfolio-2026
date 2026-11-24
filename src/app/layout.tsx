import type { Metadata, Viewport } from "next";
import { site } from "@/content/site";
import { SITE_URL } from "@/lib/siteUrl";
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
