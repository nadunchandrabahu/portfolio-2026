import * as THREE from "three";
import type { FocusTarget } from "./gearboxStore";

/**
 * Camera presets per focus target (CLAUDE.md 7.8). Directions are unit-ish
 * vectors from the target toward the camera; distance is in multiples of the
 * assembly radius and is scaled to fit the viewport aspect at runtime.
 *
 * Planet presets track the planet as the carrier turns (see Gearbox.tsx),
 * which keeps the ring fixed and the kinematics physically true.
 */

export type CameraPreset = {
  /** Direction from target to camera. */
  direction: THREE.Vector3;
  /** Distance as a multiple of the assembly's fit distance. */
  zoom: number;
};

const dir = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).normalize();

/** Three-quarter view used for the hero and the reduced-motion still. */
export const OVERVIEW_DIRECTION = dir(0.55, 0.32, 1);

/** Overall views swing toward this more side-on angle as the gearbox explodes. */
export const EXPLODED_DIRECTION = dir(1.5, 0.4, 1);

export const CAMERA_PRESETS: Record<FocusTarget, CameraPreset> = {
  overview: { direction: OVERVIEW_DIRECTION, zoom: 1 },
  sun: { direction: dir(0.18, 0.12, 1), zoom: 0.62 },
  engineering: { direction: dir(0.35, 0.25, 1), zoom: 0.58 },
  data: { direction: dir(0.35, 0.25, 1), zoom: 0.58 },
  ai: { direction: dir(0.35, 0.25, 1), zoom: 0.58 },
  build: { direction: dir(0.35, 0.25, 1), zoom: 0.58 },
  ring: { direction: dir(0, 0, 1), zoom: 0.95 },
};

/** Planet index on the carrier for each discipline (matches PLANET_ANGLES). */
export const PLANET_INDEX = { engineering: 0, data: 1, ai: 2, build: 3 } as const;
export type PlanetPart = keyof typeof PLANET_INDEX;

export const isPlanet = (focus: FocusTarget): focus is PlanetPart => focus in PLANET_INDEX;

/**
 * Distance at which a sphere of `radius` fits the camera's view, accounting for
 * narrow (portrait) viewports.
 */
export function fitDistance(radius: number, camera: THREE.PerspectiveCamera): number {
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const limiting = Math.min(vFov, hFov);
  return radius / Math.sin(limiting / 2);
}
