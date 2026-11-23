import { describe, expect, it } from "vitest";
import {
  CENTRE_DISTANCE,
  CROSS_DISC_RADIUS,
  crossOutline,
  externalOutline,
  internalOutline,
  MODULE,
  PLANET_ANGLES,
  SUN_BORE_RADIUS,
  TEETH,
} from "@/three/gearGeometry";

const radii = (points: { x: number; y: number }[]) => points.map((p) => Math.hypot(p.x, p.y));

/** Count teeth by counting how often the outline climbs above the pitch circle. */
function countTeeth(points: { x: number; y: number }[], pitch: number, internal = false): number {
  const above = radii(points).map((r) => (internal ? r < pitch : r > pitch));
  let crossings = 0;
  for (let i = 0; i < above.length; i++) {
    if (above[i] && !above[(i - 1 + above.length) % above.length]) crossings++;
  }
  return crossings;
}

describe("planetary gear set", () => {
  it("satisfies the assembly condition for four equally spaced planets", () => {
    expect(TEETH.sun + 2 * TEETH.planet).toBe(TEETH.ring);
    expect((TEETH.sun + TEETH.ring) % PLANET_ANGLES.length).toBe(0);
    expect(CENTRE_DISTANCE).toBe(((TEETH.sun + TEETH.planet) * MODULE) / 2);
  });

  it.each([
    ["sun", TEETH.sun],
    ["planet", TEETH.planet],
  ])("%s outline has the right tooth count and radii", (_, z) => {
    const outline = externalOutline(z);
    const pitch = (MODULE * z) / 2;
    const r = radii(outline);
    expect(countTeeth(outline, pitch)).toBe(z);
    expect(Math.max(...r)).toBeCloseTo(pitch + MODULE, 3); // addendum
    expect(Math.min(...r)).toBeCloseTo(pitch - 1.25 * MODULE, 3); // dedendum
  });

  it("ring outline is internal: tips inward, 48 teeth", () => {
    const outline = internalOutline(TEETH.ring);
    const pitch = (MODULE * TEETH.ring) / 2;
    const r = radii(outline);
    expect(countTeeth(outline, pitch, true)).toBe(TEETH.ring);
    expect(Math.min(...r)).toBeCloseTo(pitch - MODULE, 3);
    expect(Math.max(...r)).toBeCloseTo(pitch + 1.25 * MODULE, 3);
  });

  it("sun and planet tips clear each other's roots at the centre distance", () => {
    const sunTip = (MODULE * TEETH.sun) / 2 + MODULE;
    const planetRoot = (MODULE * TEETH.planet) / 2 - 1.25 * MODULE;
    expect(sunTip + planetRoot).toBeLessThan(CENTRE_DISTANCE);
  });
});

describe("centre cross", () => {
  it("fits on its boss and shows whole through the sun bore", () => {
    const r = Math.max(...radii(crossOutline()));
    expect(r).toBeLessThan(CROSS_DISC_RADIUS);
    expect(r).toBeLessThan(SUN_BORE_RADIUS);
  });

  it("is upright: the long arm points down", () => {
    const ys = crossOutline().map((p) => p.y);
    expect(-Math.min(...ys)).toBeGreaterThan(Math.max(...ys));
  });
});
