import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GearboxPoster } from "@/components/gearbox/GearboxPoster";
import { DRAWING_VARIANTS, toStandaloneSvg } from "@/lib/drawingSvg";

const dir = join(process.cwd(), "public", "drawings");
const update = process.env.UPDATE_DRAWINGS === "1";

describe("gearbox drawings in public/drawings", () => {
  it.each(DRAWING_VARIANTS)("gearbox-%s.svg matches the component", (variant) => {
    const svg = toStandaloneSvg(renderToStaticMarkup(createElement(GearboxPoster, { variant })));
    const file = join(dir, `gearbox-${variant}.svg`);
    if (update) {
      mkdirSync(dir, { recursive: true });
      writeFileSync(file, svg);
    }
    expect(existsSync(file), "run with UPDATE_DRAWINGS=1 to generate").toBe(true);
    expect(readFileSync(file, "utf8"), "out of date: run with UPDATE_DRAWINGS=1").toBe(svg);
    expect(svg).not.toMatch(/var\(--/);
  });
});
