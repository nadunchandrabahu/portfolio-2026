import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy (CLAUDE.md 9), static so the page stays
 * prerendered. Nonces would force every visit to render on the server in
 * Next 16, so scripts are 'self' plus 'unsafe-inline' (Next's streamed page
 * data is inline). The site renders no user content as HTML: chat replies
 * are plain text, and links are allow-listed.
 *
 * - blob: in worker-src and script-src: three.js text (troika, behind drei
 *   <Text>) runs its typesetting in workers built from blobs, and those
 *   workers importScripts() further blobs. Only scripts already running on
 *   the page can create blob URLs, so this adds nothing past 'unsafe-inline'.
 * - frame-src 'self': BotID's challenge runs in a same-origin frame, proxied
 *   through this site (see withBotId), so connect-src stays 'self' too.
 * - 'unsafe-eval' only in development (React's dev tooling needs it).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' blob:${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "frame-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

/** BotID's proxied path sets its own (same-origin) framing headers; leave it alone. */
const BOTID_PATH = "149e9513-01fa-4fb0-aad4-566afd725d1b";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // The share card reads its fonts from disk; make sure they ship with it.
  outputFileTracingIncludes: { "/opengraph-image": ["./src/assets/og/*.ttf"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: `/((?!${BOTID_PATH}/).*)`, headers: securityHeaders }];
  },
};

// withBotId adds the rewrites that proxy BotID's challenge script through this origin.
export default withBotId(nextConfig);
