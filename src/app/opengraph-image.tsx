import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/content/site";

/**
 * Share card (CLAUDE.md 11), in the data-plate style: the hero's name and
 * role on graphite with a faint blueprint grid, and the stamped nameplate.
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
  engraved: "#2a2d31",
};

function Screw({ style }: { style: React.CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        width: 14,
        height: 14,
        borderRadius: 7,
        background: "linear-gradient(135deg, #d9dce0, #6f757c)",
        border: "1px solid #4a4f56",
        ...style,
      }}
    />
  );
}

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
            <div style={{ fontFamily: "Archivo", fontSize: 60, lineHeight: 1.05, color: C.bone }}>{first}</div>
            <div style={{ fontFamily: "Archivo", fontSize: 60, lineHeight: 1.05, color: C.bone }}>{rest.join(" ")}</div>
            <div style={{ display: "flex", marginTop: 28, fontSize: 30, color: C.brass }}>{site.role}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", fontSize: 20, color: C.concrete }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: C.brass, marginRight: 14 }} />
            {site.availability}
          </div>
        </div>

        {/* The data plate. */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignSelf: "flex-end",
            width: 360,
            marginLeft: 40,
            padding: "36px 34px 32px",
            borderRadius: 6,
            border: "1px solid #8a9097",
            background: "linear-gradient(160deg, #c9cdd1 0%, #9ea4aa 45%, #b6bbc0 70%, #8d9399 100%)",
            color: C.engraved,
            fontSize: 15,
            letterSpacing: 1.2,
          }}
        >
          <Screw style={{ top: 12, left: 12 }} />
          <Screw style={{ top: 12, right: 12 }} />
          <Screw style={{ bottom: 12, left: 12 }} />
          <Screw style={{ bottom: 12, right: 12 }} />
          <div style={{ display: "flex", paddingBottom: 14, marginBottom: 18, borderBottom: `1px solid ${C.engraved}66` }}>
            DATA PLATE
          </div>
          {site.dataPlate.map((row) => (
            <div key={row.field} style={{ display: "flex", marginTop: 10 }}>
              <div style={{ display: "flex", width: 104, color: "#3d4146" }}>{row.field.toUpperCase()}</div>
              <div style={{ display: "flex", flex: 1 }}>{row.value.toUpperCase()}</div>
            </div>
          ))}
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
