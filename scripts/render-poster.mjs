// Render the hero gearbox poster (public/gearbox-poster.webp) from the live 3D scene.
// It is the LCP image and the no-WebGL fallback, so regenerate it after visual changes
// to the gearbox (CLAUDE.md 7.7).
//
// Usage: npm run build, then `npx next start --port 3100` in one terminal and
//        `node scripts/render-poster.mjs` in another.
// Needs Chrome installed (Playwright channel "chrome") for real GPU rendering.

import { createRequire } from "node:module";
import { chromium } from "@playwright/test";

const require = createRequire(import.meta.url);
const sharp = require(require.resolve("sharp", { paths: [require.resolve("next")] }));

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  reducedMotion: "reduce",
});
await page.goto("http://localhost:3100", { waitUntil: "networkidle" });
await page.mouse.move(700, 400);
await page.waitForFunction(
  () => {
    const w = document.querySelector("#hero canvas:not(.digital-rain)")?.closest(".gearbox-canvas-fade");
    return w && getComputedStyle(w).opacity === "1";
  },
  null,
  { timeout: 30000 },
);
await page.addStyleTag({
  content: `html, body { background: transparent !important; }
    body::after, .blueprint-grid, .gearbox-hint, .gearbox-inspect { display: none !important; }
    .gearbox-canvas-fade canvas { mask-image: none !important; }
    #hero img[src*="gearbox-poster"] { visibility: hidden !important; }`,
});
await page.waitForTimeout(1500);
const png = await page.locator("#hero canvas:not(.digital-rain)").screenshot({ omitBackground: true });
await browser.close();

const square = await sharp(png).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
const side = Math.max(square.info.width, square.info.height);
const pad = Math.round(side * 0.04);
// sharp runs resize before extend within one pipeline, so pad first, then resize.
const padded = await sharp(square.data)
  .extend({
    top: Math.floor((side - square.info.height) / 2) + pad,
    bottom: Math.ceil((side - square.info.height) / 2) + pad,
    left: Math.floor((side - square.info.width) / 2) + pad,
    right: Math.ceil((side - square.info.width) / 2) + pad,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();
const info = await sharp(padded)
  .resize(1200, 1200)
  .webp({ quality: 82, alphaQuality: 90, effort: 6 })
  .toFile("public/gearbox-poster.webp");
console.log("wrote public/gearbox-poster.webp", info.width, "x", info.height, Math.round(info.size / 1024) + "KB");
