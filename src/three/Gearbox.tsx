"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { damp, damp3 } from "maath/easing";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { about } from "@/content/about";
import { PROJECT_IDS } from "@/content/projects";
import {
  CAMERA_PRESETS,
  EXPLODED_DIRECTION,
  fitDistance,
  isPlanet,
  PLANET_INDEX,
} from "./cameraPresets";
import { Callout } from "./Callouts";
import * as G from "./gearGeometry";
import { useGearboxStore, type FocusTarget } from "./gearboxStore";
import { createMaterials } from "./materials";

/** Gear units (module 1) → scene units. The assembly is ~1.8 units in radius. */
export const SCALE = 1 / 16;
export const ASSEMBLY_RADIUS = G.RING_OUTER_RADIUS * SCALE;

const FONT = "/fonts/jetbrains-mono-gearbox.ttf";
/**
 * Every character engraved on the gearbox. Passed to each <Text> so troika
 * preloads exactly these; without it, it preloads the string "undefined",
 * finds letters missing from our subset font, and fetches a fallback font
 * from a CDN. Must stay in sync with scripts/fonts/subset_gearbox_mono.py.
 */
const GLYPHS = "0123456789 EPHZ:=Ø";
const FRONT = G.FACE_WIDTH / 2;
const PLATE_Z = -(G.FACE_WIDTH / 2 + G.CARRIER_THICKNESS / 2 + 0.25);
/** Axial travel of each part at explode = 1, in gear units. */
const EXPLODE_TRAVEL = { carrier: -10, planets: 6, sun: 13 };
const PLANETS = ["engineering", "data", "ai", "build"] as const;
const TAU = Math.PI * 2;

type Geometries = ReturnType<typeof buildGeometries>;

function buildGeometries() {
  const shapes = {
    sun: G.sunShape(),
    planet: G.planetShape(),
    ring: G.ringShape(),
    carrier: G.carrierShape(),
  };
  const centreLines = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-31, 0, FRONT + 0.4),
    new THREE.Vector3(31, 0, FRONT + 0.4),
    new THREE.Vector3(0, -31, FRONT + 0.4),
    new THREE.Vector3(0, 31, FRONT + 0.4),
  ]);
  // Ø48 dimension across the ring pitch circle, plus the Z=24 leader.
  const z = FRONT + 0.4;
  const dims = new THREE.BufferGeometry().setFromPoints(
    [
      [-24, 24.4, -24, 31],
      [24, 24.4, 24, 31],
      [-24, 30.2, 24, 30.2],
      [8.6, 8.6, 13.2, 13.2],
      [13.2, 13.2, 16.6, 13.2],
    ].flatMap(([x1, y1, x2, y2]) => [new THREE.Vector3(x1, y1, z), new THREE.Vector3(x2, y2, z)]),
  );
  return {
    sun: G.extrude(shapes.sun),
    planet: G.extrude(shapes.planet),
    ring: G.extrude(shapes.ring, G.FACE_WIDTH, 0.25),
    carrier: G.extrude(shapes.carrier, G.CARRIER_THICKNESS, 0.2),
    sunEdges: G.outlineGeometry(shapes.sun, G.FACE_WIDTH),
    planetEdges: G.outlineGeometry(shapes.planet, G.FACE_WIDTH),
    ringEdges: G.outlineGeometry(shapes.ring, G.FACE_WIDTH),
    carrierEdges: G.outlineGeometry(shapes.carrier, G.CARRIER_THICKNESS),
    knurl: G.knurlBandGeometry(),
    pin: new THREE.CylinderGeometry(1.45, 1.45, G.FACE_WIDTH + 0.6, 24).rotateX(Math.PI / 2),
    pinNut: G.hexHeadGeometry(1.15, 0.5),
    bolt: G.hexHeadGeometry(0.7, 0.4),
    indexLine: new THREE.BoxGeometry(2.6, 0.12, 0.06),
    segments: PROJECT_IDS.map((_, i) => G.segmentArcGeometry(i, PROJECT_IDS.length)),
    centreLines,
    dims,
  };
}

function disposeGeometries(geometries: Geometries) {
  for (const value of Object.values(geometries)) {
    if (Array.isArray(value)) value.forEach((g) => g.dispose());
    else value.dispose();
  }
}

const planetPositions = G.PLANET_ANGLES.map(
  (a) => [G.CENTRE_DISTANCE * Math.cos(a), G.CENTRE_DISTANCE * Math.sin(a)] as const,
);

const segmentLabels = PROJECT_IDS.map((id, i) => {
  const span = TAU / PROJECT_IDS.length;
  const mid = Math.PI / 2 - (i + 0.5) * span;
  const r = 27;
  // Keep numbers upright-ish: flip the ones on the lower half.
  const upper = Math.sin(mid) >= -0.2;
  return {
    id,
    n: String(i).padStart(2, "0"),
    position: [r * Math.cos(mid), r * Math.sin(mid), FRONT + 0.03] as const,
    rotation: upper ? mid - Math.PI / 2 : mid + Math.PI / 2,
  };
});

const indexLines = PROJECT_IDS.map((_, i) => {
  const a = G.segmentBoundaryAngle(i, PROJECT_IDS.length);
  const r = 27;
  return { position: [r * Math.cos(a), r * Math.sin(a), FRONT + 0.03] as const, rotation: a };
});

const BOLT_ANGLES = Array.from({ length: 8 }, (_, i) => ((i + 0.5) * TAU) / 8);

export function Gearbox({ reducedMotion }: { reducedMotion: boolean }) {
  const geometries = useMemo(() => buildGeometries(), []);
  const materials = useMemo(() => createMaterials(), []);
  useEffect(
    () => () => {
      disposeGeometries(geometries);
      materials.dispose();
    },
    [geometries, materials],
  );
  const inlays = useMemo(() => PROJECT_IDS.map(() => materials.inlay.clone()), [materials]);
  useEffect(() => () => inlays.forEach((m) => m.dispose()), [inlays]);

  const focus = useGearboxStore((s) => s.focus);

  const sunGroup = useRef<THREE.Group>(null);
  const sunSpin = useRef<THREE.Group>(null);
  const carrierAssembly = useRef<THREE.Group>(null);
  const plateGroup = useRef<THREE.Group>(null);
  const planetGroups = useRef<(THREE.Group | null)[]>([]);
  const planetSpins = useRef<(THREE.Group | null)[]>([]);
  const solids = useRef(new Set<THREE.Object3D>());
  const outlines = useRef(new Set<THREE.Object3D>());
  const blueprintOnly = useRef(new Set<THREE.Object3D>());
  const centreLineRef = useRef<THREE.LineSegments>(null);

  // Damped "current" values the scene renders from.
  const current = useRef({ rpm: 0, explode: 0, blueprint: 0, sunAngle: 0 });
  const lookAt = useRef(new THREE.Vector3());
  const scratch = useMemo(
    () => ({ target: new THREE.Vector3(), position: new THREE.Vector3() }),
    [],
  );
  const firstFrame = useRef(true);

  useEffect(() => {
    centreLineRef.current?.computeLineDistances();
  }, []);

  const asSolid = (o: THREE.Object3D | null) => {
    if (o) solids.current.add(o);
  };
  const asOutline = (o: THREE.Object3D | null) => {
    if (o) outlines.current.add(o);
  };
  const asBlueprintOnly = (o: THREE.Object3D | null) => {
    if (o) blueprintOnly.current.add(o);
  };

  /* eslint-disable react-hooks/immutability --
     R3F's frame loop mutates three.js objects by design, outside React render.
     The React Compiler (which these rules protect) is not enabled here. */
  useFrame((state, rawDelta) => {
    const s = useGearboxStore.getState();
    const c = current.current;
    const dt = Math.min(rawDelta, 1 / 20);
    const instant = reducedMotion || firstFrame.current;

    // Targets. Under reduced motion the gears never spin.
    const rpmTarget = reducedMotion ? 0 : s.rpm;
    const blueTarget = s.mode === "blueprint" ? 1 : 0;
    if (instant) {
      c.rpm = rpmTarget;
      c.explode = s.explode;
      c.blueprint = blueTarget;
    } else {
      damp(c, "rpm", rpmTarget, 0.6, dt);
      damp(c, "explode", s.explode, 0.4, dt);
      damp(c, "blueprint", blueTarget, 0.25, dt);
    }

    // Kinematics with the ring fixed: carrier ω/3, planets −ω (absolute).
    c.sunAngle += ((c.rpm * TAU) / 60) * dt;
    const carrierAngle = c.sunAngle / 3;
    if (sunSpin.current) sunSpin.current.rotation.z = c.sunAngle;
    if (carrierAssembly.current) carrierAssembly.current.rotation.z = carrierAngle;
    for (const spin of planetSpins.current) {
      // Children of the carrier, so local spin = −ω·t − carrier angle.
      if (spin) spin.rotation.z = -c.sunAngle - carrierAngle;
    }

    // Explode along the axis.
    const e = c.explode;
    if (sunGroup.current) sunGroup.current.position.z = e * EXPLODE_TRAVEL.sun;
    if (plateGroup.current) plateGroup.current.position.z = PLATE_Z + e * EXPLODE_TRAVEL.carrier;
    for (const group of planetGroups.current) {
      if (group) group.position.z = e * EXPLODE_TRAVEL.planets;
    }

    // Machined ↔ blueprint.
    const showSolids = c.blueprint < 0.5;
    solids.current.forEach((o) => (o.visible = showSolids));
    blueprintOnly.current.forEach((o) => (o.visible = !showSolids));
    outlines.current.forEach((o) => (o.visible = c.blueprint > 0.02));
    materials.line.opacity = c.blueprint;
    materials.centreLine.opacity = c.blueprint * 0.7;

    // Project segment inlays.
    inlays.forEach((m, i) => {
      const on = s.highlightProject === PROJECT_IDS[i] ? 1 : 0;
      if (instant) m.opacity = on;
      else damp(m, "opacity", on, 0.2, dt);
      m.emissiveIntensity = m.opacity * 1.4;
    });

    // Camera: preset direction from the focused part, distance fitted to the viewport.
    const camera = state.camera as THREE.PerspectiveCamera;
    const preset = CAMERA_PRESETS[s.focus];
    const { target, position } = scratch;
    if (s.focus === "sun" && sunGroup.current) sunGroup.current.getWorldPosition(target);
    else if (isPlanet(s.focus)) {
      const group = planetGroups.current[PLANET_INDEX[s.focus]];
      if (group) group.getWorldPosition(target);
    } else target.set(0, 0, 0);
    const overall = s.focus === "overview" || s.focus === "ring";
    const radius = ASSEMBLY_RADIUS * (overall ? Math.hypot(1, e * 0.6) : 1);
    position.copy(preset.direction);
    if (s.focus === "overview") position.lerp(EXPLODED_DIRECTION, e).normalize();
    position.multiplyScalar(fitDistance(radius, camera) * preset.zoom * 1.06).add(target);
    if (instant) {
      camera.position.copy(position);
      lookAt.current.copy(target);
    } else {
      damp3(camera.position, position, 0.55, dt);
      damp3(lookAt.current, target, 0.4, dt);
    }
    camera.lookAt(lookAt.current);
    firstFrame.current = false;
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group scale={SCALE}>
      {/* Ring gear: fixed. Carries the 7 project segments. */}
      <group>
        <mesh ref={asSolid} geometry={geometries.ring} material={materials.ring} />
        <lineSegments ref={asOutline} geometry={geometries.ringEdges} material={materials.line} />
        {indexLines.map((line, i) => (
          <mesh
            key={i}
            geometry={geometries.indexLine}
            material={materials.indexLine}
            position={line.position}
            rotation={[0, 0, line.rotation]}
          />
        ))}
        {geometries.segments.map((geometry, i) => (
          <mesh
            key={PROJECT_IDS[i]}
            geometry={geometry}
            material={inlays[i]}
            position={[0, 0, FRONT + 0.02]}
          />
        ))}
        {segmentLabels.map((label) => (
          <Text
            key={label.id}
            font={FONT}
            characters={GLYPHS}
            fontSize={1.15}
            color="#9a9fa5"
            anchorX="center"
            anchorY="middle"
            position={label.position}
            rotation={[0, 0, label.rotation]}
          >
            {label.n}
          </Text>
        ))}
        {focus === "ring" ? (
          <Callout position={[0, 26.4, FRONT]} label={`Ring · The work · ${PROJECT_IDS.length} projects`} />
        ) : null}
      </group>

      {/* Carrier assembly: turns at ω/3 and holds the four planets. */}
      <group ref={carrierAssembly}>
        <group ref={plateGroup} position={[0, 0, PLATE_Z]}>
          <mesh ref={asSolid} geometry={geometries.carrier} material={materials.carrier} />
          <mesh ref={asSolid} geometry={geometries.knurl} material={materials.knurl} />
          <lineSegments ref={asOutline} geometry={geometries.carrierEdges} material={materials.line} />
          {BOLT_ANGLES.map((a) => (
            <mesh
              key={a}
              ref={asSolid}
              geometry={geometries.bolt}
              material={materials.bolt}
              position={[19.2 * Math.cos(a), 19.2 * Math.sin(a), G.CARRIER_THICKNESS / 2]}
              rotation={[0, 0, a]}
            />
          ))}
          {planetPositions.map(([x, y]) => (
            <mesh
              key={`pin-${x}-${y}`}
              ref={asSolid}
              geometry={geometries.pin}
              material={materials.bolt}
              position={[x, y, -PLATE_Z + 0.05]}
            />
          ))}
        </group>

        {planetPositions.map(([x, y], i) => (
          <group
            key={PLANETS[i]}
            ref={(g) => {
              planetGroups.current[i] = g;
            }}
            position={[x, y, 0]}
          >
            <group
              ref={(g) => {
                planetSpins.current[i] = g;
              }}
            >
              <mesh ref={asSolid} geometry={geometries.planet} material={materials.steel} />
              <lineSegments ref={asOutline} geometry={geometries.planetEdges} material={materials.line} />
            </group>
            <mesh ref={asSolid} geometry={geometries.pinNut} material={materials.bolt} position={[0, 0, FRONT]} />
            {focus === PLANETS[i] ? <Callout position={[0, 0, FRONT + 0.5]} label={partLabel(PLANETS[i])} /> : null}
          </group>
        ))}
      </group>

      {/* Sun gear: brass, engraved EPH 2:8. Faith at the centre. */}
      <group ref={sunGroup}>
        <group ref={sunSpin}>
          <mesh ref={asSolid} geometry={geometries.sun} material={materials.brass} />
          <lineSegments ref={asOutline} geometry={geometries.sunEdges} material={materials.line} />
          <Text
            font={FONT}
            characters={GLYPHS}
            fontSize={1.35}
            letterSpacing={0.06}
            color="#8c6b32"
            anchorX="center"
            anchorY="middle"
            position={[0, -4.6, FRONT + 0.03]}
          >
            EPH 2:8
          </Text>
        </group>
        {focus === "sun" ? <Callout position={[0, 0, FRONT + 0.5]} label={partLabel("sun")} /> : null}
      </group>

      {/* Blueprint extras: dash-dot centre lines and two dimension callouts. */}
      <lineSegments ref={centreLineRef} geometry={geometries.centreLines} material={materials.centreLine} />
      <lineSegments ref={asOutline} geometry={geometries.dims} material={materials.line} />
      <group ref={asBlueprintOnly} visible={false}>
        <Text font={FONT} characters={GLYPHS} fontSize={1.5} color="#c9a35e" anchorX="center" anchorY="bottom" position={[0, 30.6, FRONT + 0.4]}>
          Ø48
        </Text>
        <Text font={FONT} characters={GLYPHS} fontSize={1.4} color="#c9a35e" anchorX="left" anchorY="middle" position={[17, 13.2, FRONT + 0.4]}>
          Z=24
        </Text>
      </group>
    </group>
  );
}

/** Callout text comes from the About "How the parts fit" list (one source of truth). */
function partLabel(part: Exclude<FocusTarget, "overview" | "ring">): string {
  const row = about.parts.find((p) => p.part === part);
  return row ? `${row.code} · ${row.name}` : part;
}
