/**
 * The 2D gearbox drawings (GearboxPoster) as standalone files in
 * public/drawings/. Desktop slots show them as a lazy <img> when the 3D stage
 * isn't running, so they aren't inlined into every page load (twice: HTML
 * plus React's page data), phones included. tests/drawings.test.ts renders
 * them and keeps the files in sync; UPDATE_DRAWINGS=1 rewrites them.
 *
 * Page CSS variables don't reach inside an <img>, so they're resolved here.
 */
const TOKENS: [RegExp, string][] = [
  [/var\(--brass\)/g, "#c9a35e"],
  [/var\(--concrete\)/g, "#9a9fa5"],
  [/var\(--font-jetbrains-mono\), monospace/g, "ui-monospace, Menlo, Consolas, monospace"],
];

export const DRAWING_VARIANTS = ["machined", "blueprint"] as const;

export function toStandaloneSvg(markup: string): string {
  let svg = markup;
  for (const [pattern, value] of TOKENS) svg = svg.replace(pattern, value);
  return `${svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')}\n`;
}
