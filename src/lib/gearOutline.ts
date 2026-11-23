/**
 * 2D spur-gear outlines as SVG path data, for the static gearbox poster.
 * Trapezoidal teeth approximate the involute profile, which is plenty at
 * poster scale. The 3D gearbox (phase 3) generates true involutes.
 *
 * Module m, tooth count z: pitch radius = m·z/2, addendum = m,
 * dedendum = 1.25m. Internal gears point their tips inward.
 */

const r3 = (n: number) => Math.round(n * 1000) / 1000;

function polar(radius: number, angle: number): [number, number] {
  return [r3(radius * Math.cos(angle)), r3(radius * Math.sin(angle))];
}

export type GearSpec = {
  teeth: number;
  module?: number;
  internal?: boolean;
  /** Rotation of the first tooth centre, in radians. */
  phase?: number;
};

export function pitchRadius({ teeth, module = 1 }: GearSpec): number {
  return (module * teeth) / 2;
}

export function gearPath(spec: GearSpec): string {
  const { teeth, module = 1, internal = false, phase = 0 } = spec;
  const rp = pitchRadius(spec);
  const tip = internal ? rp - module : rp + module;
  const root = internal ? rp + 1.25 * module : rp - 1.25 * module;
  const pitch = (2 * Math.PI) / teeth;
  const rootHalf = pitch * 0.3;
  const tipHalf = pitch * 0.16;

  const parts: string[] = [];
  for (let k = 0; k < teeth; k++) {
    const a = phase + k * pitch;
    const p1 = polar(root, a - rootHalf);
    const p2 = polar(tip, a - tipHalf);
    const p3 = polar(tip, a + tipHalf);
    const p4 = polar(root, a + rootHalf);
    const next = polar(root, a + pitch - rootHalf);
    parts.push(
      `${k === 0 ? "M" : "L"}${p1[0]} ${p1[1]}`,
      `L${p2[0]} ${p2[1]}`,
      `A${r3(tip)} ${r3(tip)} 0 0 1 ${p3[0]} ${p3[1]}`,
      `L${p4[0]} ${p4[1]}`,
      `A${r3(root)} ${r3(root)} 0 0 1 ${next[0]} ${next[1]}`,
    );
  }
  parts.push("Z");
  return parts.join(" ");
}

/** Full circle as a path (for even-odd holes inside gear bodies). */
export function circlePath(radius: number, cx = 0, cy = 0): string {
  const r = r3(radius);
  return `M${r3(cx + r)} ${r3(cy)} A${r} ${r} 0 1 0 ${r3(cx - r)} ${r3(cy)} A${r} ${r} 0 1 0 ${r3(cx + r)} ${r3(cy)} Z`;
}

/**
 * Planetary set used across the site: sun 24, planets 12, ring 48 (internal).
 * 24 + 2·12 = 48 and (24 + 48) / 4 = 18, so four equally spaced planets mesh.
 * Sun–planet centre distance = 12 + 6 = 18.
 *
 * Phases: sun and ring teeth sit on 0°, so each planet (at a multiple of 90°)
 * needs a gap facing the sun and the ring: offset by half its 30° pitch.
 */
export const PLANETARY = {
  sun: { teeth: 24 },
  planet: { teeth: 12, phase: Math.PI / 12 },
  ring: { teeth: 48, internal: true },
  centreDistance: 18,
  planetAngles: [0, 90, 180, 270].map((deg) => (deg * Math.PI) / 180),
  ringOuterRadius: 28.5,
  carrierRadius: 21.5,
} as const;
