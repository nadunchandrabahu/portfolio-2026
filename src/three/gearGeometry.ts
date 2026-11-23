import * as THREE from "three";

/**
 * Procedural involute spur gears (CLAUDE.md 7.2).
 *
 * Module 1, 20° pressure angle. Sun Z=24, planets Z=12, ring Z=48 internal:
 * 24 + 2·12 = 48 and (24 + 48) / 4 = 18, so four equally spaced planets mesh.
 * Pitch radii 12, 6, 24; sun–planet centre distance 18.
 *
 * Gears lie in the XY plane and are extruded along +Z.
 */

export const MODULE = 1;
export const PRESSURE_ANGLE = (20 * Math.PI) / 180;
export const FACE_WIDTH = 4;
export const BEVEL = 0.18;

export const TEETH = { sun: 24, planet: 12, ring: 48 } as const;
export const CENTRE_DISTANCE = ((TEETH.sun + TEETH.planet) * MODULE) / 2; // 18
export const RING_OUTER_RADIUS = 28.5;
export const CARRIER_RADIUS = 21.5;
export const CARRIER_THICKNESS = 2;

/** Planet positions on the carrier (radians). */
export const PLANET_ANGLES = [0, 0.5, 1, 1.5].map((t) => t * Math.PI);

/**
 * Initial tooth phases so everything meshes at t = 0. Sun and ring teeth are
 * centred on 0 rad; each planet (at a multiple of 90°) needs a gap facing
 * both, so it is offset by half its 30° pitch.
 */
export const PHASE = { sun: 0, planet: Math.PI / TEETH.planet, ring: 0 } as const;

const inv = (a: number) => Math.tan(a) - a;

const pitchRadius = (z: number) => (MODULE * z) / 2;
const baseRadius = (z: number) => pitchRadius(z) * Math.cos(PRESSURE_ANGLE);

/** Small backlash so meshing flanks never touch or z-fight (radians at radius r). */
const backlash = (r: number) => (0.06 * MODULE) / r;

function polar(r: number, a: number): THREE.Vector2 {
  return new THREE.Vector2(r * Math.cos(a), r * Math.sin(a));
}

function arc(points: THREE.Vector2[], r: number, from: number, to: number, steps: number) {
  for (let i = 1; i < steps; i++) points.push(polar(r, from + ((to - from) * i) / steps));
}

/** Half the angular thickness of an external tooth at radius r. */
function externalHalfAngle(z: number, r: number): number {
  const rb = baseRadius(z);
  const alpha = Math.acos(Math.min(1, rb / Math.max(r, rb)));
  return Math.PI / (2 * z) + inv(PRESSURE_ANGLE) - inv(alpha) - backlash(r);
}

/** Half the angular thickness of an internal (ring) tooth at radius r. */
function internalHalfAngle(z: number, r: number): number {
  const rb = baseRadius(z);
  const alpha = Math.acos(Math.min(1, rb / Math.max(r, rb)));
  return Math.PI / (2 * z) - inv(PRESSURE_ANGLE) + inv(alpha) - backlash(r);
}

/** Involute samples per flank. Five is visually smooth at this scale. */
const FLANK_STEPS = 5;

/** Closed outline of an external gear, counter-clockwise. */
export function externalOutline(z: number, phase = 0): THREE.Vector2[] {
  const rp = pitchRadius(z);
  const rb = baseRadius(z);
  const ra = rp + MODULE;
  const rf = rp - 1.25 * MODULE;
  const rStart = Math.max(rb, rf);
  const pitch = (2 * Math.PI) / z;
  const radii = Array.from(
    { length: FLANK_STEPS + 1 },
    (_, i) => rStart + ((ra - rStart) * i) / FLANK_STEPS,
  );
  const points: THREE.Vector2[] = [];

  for (let k = 0; k < z; k++) {
    const a = phase + k * pitch;
    const rootHalf = externalHalfAngle(z, rStart);
    // Left flank: radial from the root circle up to the base circle, then involute.
    if (rf < rb) points.push(polar(rf, a - rootHalf));
    for (const r of radii) points.push(polar(r, a - externalHalfAngle(z, r)));
    const tipHalf = externalHalfAngle(z, ra);
    arc(points, ra, a - tipHalf, a + tipHalf, 3);
    for (const r of [...radii].reverse()) points.push(polar(r, a + externalHalfAngle(z, r)));
    if (rf < rb) points.push(polar(rf, a + rootHalf));
    // Root land to the next tooth.
    arc(points, rf, a + rootHalf, a + pitch - rootHalf, 3);
  }
  return points;
}

/** Closed outline of an internal gear's toothed bore, counter-clockwise. */
export function internalOutline(z: number, phase = 0): THREE.Vector2[] {
  const rp = pitchRadius(z);
  const ra = rp - MODULE; // tips point inward
  const rf = rp + 1.25 * MODULE;
  const pitch = (2 * Math.PI) / z;
  const radii = Array.from({ length: FLANK_STEPS + 1 }, (_, i) => rf - ((rf - ra) * i) / FLANK_STEPS);
  const points: THREE.Vector2[] = [];

  for (let k = 0; k < z; k++) {
    const a = phase + k * pitch;
    for (const r of radii) points.push(polar(r, a - internalHalfAngle(z, r)));
    const tipHalf = internalHalfAngle(z, ra);
    arc(points, ra, a - tipHalf, a + tipHalf, 2);
    for (const r of [...radii].reverse()) points.push(polar(r, a + internalHalfAngle(z, r)));
    const rootHalf = internalHalfAngle(z, rf);
    arc(points, rf, a + rootHalf, a + pitch - rootHalf, 2);
  }
  return points;
}

function circlePath(r: number, cx = 0, cy = 0): THREE.Path {
  const path = new THREE.Path();
  path.absarc(cx, cy, r, 0, Math.PI * 2, false);
  return path;
}

/** Bore with a rectangular keyway notch at 12 o'clock. */
function keyedBore(r: number, keyWidth: number, keyDepth: number): THREE.Path {
  const half = Math.asin(keyWidth / 2 / r);
  const top = Math.PI / 2;
  const points: THREE.Vector2[] = [];
  const steps = 40;
  // Around the bore from just right of the key, the long way, to just left of it.
  for (let i = 0; i <= steps; i++) {
    points.push(polar(r, top + half + ((Math.PI * 2 - 2 * half) * i) / steps));
  }
  points.push(new THREE.Vector2(keyWidth / 2, r + keyDepth));
  points.push(new THREE.Vector2(-keyWidth / 2, r + keyDepth));
  return new THREE.Path(points);
}

const CURVE_SEGMENTS = 32;

/**
 * Extrude a profile along +Z with a single-step chamfer, centred on z = 0 so
 * explode offsets are symmetric. ExtrudeGeometry computes its own normals.
 */
export function extrude(shape: THREE.Shape, depth = FACE_WIDTH, bevel = BEVEL): THREE.ExtrudeGeometry {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.8,
    bevelSegments: 1,
    curveSegments: CURVE_SEGMENTS,
  });
  geometry.translate(0, 0, -(depth - 2 * bevel) / 2);
  return geometry;
}

export function sunShape(): THREE.Shape {
  const shape = new THREE.Shape(externalOutline(TEETH.sun, PHASE.sun));
  shape.holes.push(keyedBore(2.4, 1.1, 0.7));
  // Six lightening holes, leaving room for the EPH 2:8 engraving below the bore.
  for (let i = 0; i < 6; i++) {
    const p = polar(7.4, (i * Math.PI) / 3);
    shape.holes.push(circlePath(1.05, p.x, p.y));
  }
  return shape;
}

export function planetShape(): THREE.Shape {
  const shape = new THREE.Shape(externalOutline(TEETH.planet, PHASE.planet));
  shape.holes.push(circlePath(1.6));
  return shape;
}

export function ringShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, RING_OUTER_RADIUS, 0, Math.PI * 2, false);
  shape.holes.push(new THREE.Path(internalOutline(TEETH.ring, PHASE.ring)));
  return shape;
}

export const CARRIER_HOLE_ANGLES = [0.25, 0.75, 1.25, 1.75].map((t) => t * Math.PI);

export function carrierShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, CARRIER_RADIUS, 0, Math.PI * 2, false);
  shape.holes.push(circlePath(3));
  for (const a of CARRIER_HOLE_ANGLES) {
    const p = polar(11.5, a);
    shape.holes.push(circlePath(2.4, p.x, p.y));
  }
  return shape;
}

/**
 * Blueprint outline of an extruded shape: its outer contour and holes traced
 * on the front and back faces. Built straight from the 2D profile, so it costs
 * almost nothing (EdgesGeometry over the mesh took ~2s on a throttled phone).
 */
export function outlineGeometry(shape: THREE.Shape, depth: number): THREE.BufferGeometry {
  const { shape: outer, holes } = shape.extractPoints(CURVE_SEGMENTS);
  const positions: number[] = [];
  for (const loop of [outer, ...holes]) {
    for (const z of [depth / 2, -depth / 2]) {
      for (let i = 0; i < loop.length; i++) {
        const a = loop[i];
        const b = loop[(i + 1) % loop.length];
        if (a && b) positions.push(a.x, a.y, z, b.x, b.y, z);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

/** Hex bolt head facing +Z. */
export function hexHeadGeometry(radius: number, height: number): THREE.CylinderGeometry {
  const geometry = new THREE.CylinderGeometry(radius, radius, height, 6, 1);
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, 0, height / 2);
  return geometry;
}

/**
 * Knurled band for the carrier rim: a thin cylinder shell. The diamond knurl
 * comes from a procedural bump map (see materials.ts).
 */
export function knurlBandGeometry(): THREE.CylinderGeometry {
  const geometry = new THREE.CylinderGeometry(
    CARRIER_RADIUS + 0.06,
    CARRIER_RADIUS + 0.06,
    CARRIER_THICKNESS * 0.7,
    160,
    1,
    true,
  );
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

/** Flat arc on the ring face marking one project segment (for the brass inlay). */
export function segmentArcGeometry(index: number, count: number): THREE.RingGeometry {
  const gap = 0.035;
  const span = (Math.PI * 2) / count;
  // Segment 00 starts at 12 o'clock and runs clockwise, matching the 2D poster.
  const start = Math.PI / 2 - (index + 1) * span + gap;
  return new THREE.RingGeometry(26.05, 27.95, 24, 1, start, span - 2 * gap);
}

/** Angle (radians) of the boundary before segment `index`, clockwise from 12 o'clock. */
export const segmentBoundaryAngle = (index: number, count: number) =>
  Math.PI / 2 - (index * Math.PI * 2) / count;
