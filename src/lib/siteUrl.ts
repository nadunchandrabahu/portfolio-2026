/**
 * The site's canonical origin, for metadata, the sitemap, robots and JSON-LD.
 * Read at build time on the server. Not a secret, so it needs no NEXT_PUBLIC_.
 *
 * TODO(nadun): set SITE_URL to the production domain in Vercel once it's
 * chosen. Until then Vercel's production URL is used, then localhost.
 */
export const SITE_URL = (() => {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
})();
