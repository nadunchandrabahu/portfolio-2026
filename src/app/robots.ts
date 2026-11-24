import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

/** Everything is public except the chat API (CLAUDE.md 11). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
