import { renderToStaticMarkup } from "react-dom/server";
import { GearboxPoster } from "@/components/gearbox/GearboxPoster";

/**
 * The 2D gearbox drawing as a standalone SVG file. Desktop slots show it as a
 * lazy <img> when the 3D stage isn't running, so it isn't inlined (twice:
 * HTML plus React's page data) into every page load, phones included.
 * Page CSS variables don't reach inside an <img>, so they're resolved here.
 */
const TOKENS: [RegExp, string][] = [
  [/var\(--brass\)/g, "#c9a35e"],
  [/var\(--concrete\)/g, "#9a9fa5"],
  [/var\(--font-jetbrains-mono\), monospace/g, "ui-monospace, Menlo, Consolas, monospace"],
];

export function drawingResponse(variant: "machined" | "blueprint"): Response {
  let svg = renderToStaticMarkup(<GearboxPoster variant={variant} />);
  for (const [pattern, value] of TOKENS) svg = svg.replace(pattern, value);
  svg = svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
  });
}
