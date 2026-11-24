/**
 * Replies render as plain text (never HTML). Paragraphs split on blank lines,
 * and only URLs on this site, GitHub or LinkedIn become links; any other URL
 * stays as text. CLAUDE.md 8.5.
 */

export type Segment = { text: string; href?: string; external?: boolean };

const URL_PATTERN = /https?:\/\/[^\s<>"'`]+/g;
const TRAILING = /[.,;:!?)\]]+$/;
const ALLOWED_HOSTS = ["github.com", "www.github.com", "linkedin.com", "www.linkedin.com"];

function linkFor(candidate: string, ownHost: string): Segment | null {
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && !(url.protocol === "http:" && url.host === ownHost)) return null;
  if (url.host === ownHost) return { text: candidate, href: url.pathname + url.search + url.hash };
  if (ALLOWED_HOSTS.includes(url.host)) return { text: candidate, href: url.href, external: true };
  return null;
}

/** Split one paragraph into text and link segments. */
export function linkify(text: string, ownHost: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const raw = match[0];
    const url = raw.replace(TRAILING, "");
    const start = match.index ?? 0;
    const link = linkFor(url, ownHost);
    if (!link) continue;
    if (start > last) segments.push({ text: text.slice(last, start) });
    segments.push(link);
    last = start + url.length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments;
}

export function toParagraphs(reply: string): string[] {
  return reply
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
