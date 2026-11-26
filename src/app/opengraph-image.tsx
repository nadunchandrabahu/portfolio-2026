import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/content/site";

/**
 * Share card (CLAUDE.md 11): the hero's name and role on graphite with a
 * faint blueprint grid, and the availability line.
 * Rendered on request, then cached: the URL Next.js puts in the og:image tag
 * carries a content hash, so the response can be cached as immutable. Fonts:
 * scripts/fonts/build_og_fonts.py.
 */

export const alt = `${site.name}: ${site.role}, Sydney`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const C = {
  graphite: "#0f1011",
  steelLine: "#2f3337",
  bone: "#ece7de",
  concrete: "#9a9fa5",
  brass: "#c9a35e",
};

export default async function OpengraphImage() {
  const [archivo, mono] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/og/archivo-800-expanded.ttf")),
    readFile(join(process.cwd(), "src/assets/og/jetbrains-mono-500.ttf")),
  ]);
  const [first = "", ...rest] = site.name.toUpperCase().split(" ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "64px 72px",
          background: C.graphite,
          backgroundImage: `linear-gradient(${C.steelLine}55 1px, transparent 1px), linear-gradient(90deg, ${C.steelLine}55 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          color: C.bone,
          fontFamily: "Mono",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 20, letterSpacing: 2, color: C.concrete }}>
            {site.eyebrow.toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "Archivo", fontSize: 76, lineHeight: 1.05, color: C.bone }}>{first}</div>
            <div style={{ fontFamily: "Archivo", fontSize: 76, lineHeight: 1.05, color: C.bone }}>{rest.join(" ")}</div>
            <div style={{ display: "flex", marginTop: 28, fontSize: 30, color: C.brass }}>{site.role}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", fontSize: 20, color: C.concrete }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: C.brass, marginRight: 14 }} />
            {site.availability}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable" },
      fonts: [
        { name: "Archivo", data: archivo, weight: 800, style: "normal" },
        { name: "Mono", data: mono, weight: 500, style: "normal" },
      ],
    },
  );
}
