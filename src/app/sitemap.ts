import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

/** One page. (No lastModified: reading the clock would stop it prerendering.) */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 }];
}
