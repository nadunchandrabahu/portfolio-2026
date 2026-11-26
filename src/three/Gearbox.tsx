"use client";

import { Text } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { damp, damp3 } from "maath/easing";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { about, type GearPartId } from "@/content/about";
import { PROJECT_IDS } from "@/content/projects";
import { revealProjectCard } from "@/lib/revealProject";
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
import { sameTarget, useGearboxUi, type InspectTarget } from "./gearboxUi";
import { createMaterials } from "./materials";
import { useDragRotate } from "./useDragRotate";

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
/** The centre cross sits on the boss's front face. */
const CROSS_Z = G.CARRIER_THICKNESS / 2 + G.CROSS_DEPTH / 2;
/** Hover outlines sit just proud of the faces so they don't z-fight. */
const PROUD: [number, number, number] = [1, 1, 1.08];
/** Mouse leaving a part: wait this long before closing, so moving between parts doesn't flicker. */
const UNPICK_DELAY_MS = 140;
/** Hover intent: how long the pointer rests on a part before its card opens. */
const HOVER_DELAY_MS = 350;
const TAU = Math.PI * 2;

type Geometries = ReturnType<typeof buildGeometries>;

function buildGeometries() {
  const shapes = {
    sun: G.sunShape(),
    planet: G.planetShape(),
    ring: G.ringShape(),
    carrier: G.carrierShape(),
    crossDisc: G.crossDiscShape(),
    cross: G.crossShape(),
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
    crossDisc: G.extrude(shapes.crossDisc, G.CARRIER_THICKNESS, 0.2),
    cross: G.extrude(shapes.cross, G.CROSS_DEPTH, 0.1),
    sunEdges: G.outlineGeometry(shapes.sun, G.FACE_WIDTH),
    planetEdges: G.outlineGeometry(shapes.planet, G.FACE_WIDTH),
    ringEdges: G.outlineGeometry(shapes.ring, G.FACE_WIDTH),
    carrierEdges: G.outlineGeometry(shapes.carrier, G.CARRIER_THICKNESS),
    crossDiscEdges: G.outlineGeometry(shapes.crossDisc, G.CARRIER_THICKNESS),
    crossEdges: G.outlineGeometry(shapes.cross, G.CROSS_DEPTH),
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
/** Each planet's story part and its place on the carrier (PLANET_ANGLES order). */
const planets = PLANETS.map((part, i) => {
  const angle = G.PLANET_ANGLES[i] ?? 0;
  return { part, x: G.CENTRE_DISTANCE * Math.cos(angle), y: G.CENTRE_DISTANCE * Math.sin(angle) };
});

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

/** Which ring segment (project) a point on the ring face is in. Segment 00 starts at 12 o'clock, clockwise. */
function segmentAt(local: THREE.Vector3) {
  const span = TAU / PROJECT_IDS.length;
  const fromTop = (((Math.PI / 2 - Math.atan2(local.y, local.x)) % TAU) + TAU) % TAU;
  return PROJECT_IDS[Math.floor(fromTop / span)] ?? null;
}

const isMouse = (e: ThreeEvent<PointerEvent | MouseEvent>) =>
  !("pointerType" in e.nativeEvent) || e.nativeEvent.pointerType === "mouse";

/** Grab cursor while the pointer is over the gearbox, pointer over ring segments (see globals.css). */
function setHover(on: boolean, link = false) {
  if (on) document.documentElement.dataset.gearboxHover = link ? "link" : "";
  else delete document.documentElement.dataset.gearboxHover;
}

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
  const callouts = useGearboxStore((s) => s.callouts);
  // Full label on the focused part; numbered balloons on every part in "parts"
  // mode while nothing in particular is focused.
  const labelFor = (part: FocusTarget) => callouts !== "none" && focus === part;
  const balloons = callouts === "parts" && (focus === "overview" || focus === "ring");
  const inspect = useGearboxUi((s) => s.inspect);
  const picked = inspect?.target.kind === "part" ? inspect.target.part : null;

  const rotor = useRef<THREE.Group>(null);
  // Idle sway on the outer group: the whole assembly drifts gently side to
  // side, as if hanging in the air, around the visitor's drag rotation.
  const sway = useRef<THREE.Group>(null);
  const swayAmount = useRef(0);
  const crossGroup = useRef<THREE.Group>(null);
  const { dragging, beginDrag } = useDragRotate(rotor, reducedMotion);
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const unpickTimer = useRef<number | undefined>(undefined);
  useEffect(
    () => () => {
      window.clearTimeout(unpickTimer.current);
      setHover(false);
    },
    [],
  );

  // Hover (mouse) or tap (touch) a part to see its details (GearboxInspectCard).
  // A hover waits a moment before the card opens, so sweeping across the
  // gearbox (or reaching for it to drag) doesn't flash cards over it. Once a
  // card is open, moving to another part switches straight away.
  const pending = useRef<InspectTarget | null>(null);
  const pick = (target: InspectTarget, e: ThreeEvent<PointerEvent | MouseEvent>, delay = 0) => {
    const ui = useGearboxUi.getState();
    if (sameTarget(ui.inspect?.target, target)) {
      window.clearTimeout(unpickTimer.current);
      pending.current = null;
      return;
    }
    if (delay && sameTarget(pending.current, target)) return;
    window.clearTimeout(unpickTimer.current);
    const rect = gl.domElement.getBoundingClientRect();
    // On the scroll stage the gearbox fills its section's slot; otherwise the canvas.
    const stage = document.documentElement.dataset.gearboxStage;
    const slot = stage ? document.querySelector(`[data-gearbox-slot="${stage}"]`) : null;
    const b = (slot ?? gl.domElement).getBoundingClientRect();
    const show = () => {
      pending.current = null;
      useGearboxUi.getState().setInspect({
        target,
        x: e.nativeEvent.clientX - rect.left,
        y: e.nativeEvent.clientY - rect.top,
        bounds: { left: b.left, top: b.top, right: b.right, bottom: b.bottom },
      });
      invalidate();
    };
    if (!delay || ui.inspect) {
      show();
      return;
    }
    pending.current = target;
    unpickTimer.current = window.setTimeout(show, delay);
  };
  const unpick = (delay: number) => {
    window.clearTimeout(unpickTimer.current);
    pending.current = null;
    unpickTimer.current = window.setTimeout(() => {
      useGearboxUi.getState().setInspect(null);
      invalidate();
    }, delay);
  };
  const onTap = (target: InspectTarget | null, e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (isMouse(e) || dragging.current || e.delta > 8 || !target) return;
    if (sameTarget(useGearboxUi.getState().inspect?.target, target)) unpick(0);
    else pick(target, e);
  };
  // One set of handlers for every inspectable part; the part id rides on userData.
  const partOf = (e: ThreeEvent<PointerEvent | MouseEvent>): InspectTarget | null => {
    const part = (e.eventObject.userData as { part?: GearPartId }).part;
    return part ? { kind: "part", part } : null;
  };
  // Every solid part: grab cursor, drag to rotate, double-click to reset the view.
  const grip = {
    onPointerDown: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (isMouse(e)) unpick(0);
      beginDrag(e.nativeEvent);
    },
    onDoubleClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      useGearboxUi.getState().resetView();
    },
  };
  const onPartOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHover(true);
    const target = partOf(e);
    if (target && isMouse(e) && !dragging.current && e.buttons === 0) pick(target, e, HOVER_DELAY_MS);
  };
  const onPartOut = (e: ThreeEvent<PointerEvent>) => {
    setHover(false);
    if (isMouse(e)) unpick(UNPICK_DELAY_MS);
  };
  const onPartClick = (e: ThreeEvent<MouseEvent>) => onTap(partOf(e), e);
  const partEvents = { ...grip, onPointerOver: onPartOver, onPointerOut: onPartOut, onClick: onPartClick };
  // Solid parts with nothing to show still block the parts behind them.
  const blocker = {
    ...grip,
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHover(true);
    },
    onPointerOut: () => setHover(false),
    onClick: (e: ThreeEvent<MouseEvent>) => e.stopPropagation(),
  };
  const ringTarget = (e: ThreeEvent<PointerEvent | MouseEvent>): InspectTarget | null => {
    const id = segmentAt(e.object.worldToLocal(e.point.clone()));
    return id ? { kind: "project", id } : null;
  };
  const onRingHover = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHover(true, true);
    if (!isMouse(e) || dragging.current || e.buttons !== 0) return;
    const target = ringTarget(e);
    if (target) pick(target, e, HOVER_DELAY_MS);
  };
  // Each ring segment links to its project card in Selected work. A mouse
  // click goes straight there; on touch the first tap shows the details card
  // and a second tap on the same segment goes there. Hovering never scrolls
  // the page (no scroll-jacking): it only shows the card.
  const onRingClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (dragging.current || e.delta > 8) return;
    const target = ringTarget(e);
    if (target?.kind !== "project") return;
    if (isMouse(e) || sameTarget(useGearboxUi.getState().inspect?.target, target)) {
      unpick(0);
      revealProjectCard(target.id, reducedMotion);
    } else pick(target, e);
  };

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

    // Natural sway: a slow side-to-side yaw with a little nod, from out-of-step
    // sines so it never looks mechanical. Full in the overview, softer when a
    // part is in focus, none while dragging or under reduced motion.
    const swayTarget = reducedMotion || dragging.current ? 0 : s.focus === "overview" ? 1 : 0.4;
    if (instant) swayAmount.current = swayTarget;
    else damp(swayAmount, "current", swayTarget, 0.8, dt);
    if (sway.current) {
      const t = state.clock.elapsedTime;
      const a = swayAmount.current;
      sway.current.rotation.y = a * (0.11 * Math.sin(t * 0.5) + 0.035 * Math.sin(t * 1.27 + 1.3));
      sway.current.rotation.x = a * 0.04 * Math.sin(t * 0.37 + 0.6);
    }

    // Explode along the axis.
    const e = c.explode;
    if (sunGroup.current) sunGroup.current.position.z = e * EXPLODE_TRAVEL.sun;
    if (plateGroup.current) plateGroup.current.position.z = PLATE_Z + e * EXPLODE_TRAVEL.carrier;
    if (crossGroup.current) crossGroup.current.position.z = PLATE_Z + e * EXPLODE_TRAVEL.carrier;
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

    // Project segment inlays: lit by the store (scroll, chat) or by hovering the ring.
    const inspected = useGearboxUi.getState().inspect?.target;
    const hoveredProject = inspected?.kind === "project" ? inspected.id : null;
    inlays.forEach((m, i) => {
      const id = PROJECT_IDS[i];
      const on = s.highlightProject === id || hoveredProject === id ? 1 : 0;
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
    <group ref={sway} scale={SCALE}>
      {/* The rotor takes the visitor's drag rotation; everything turns with it. */}
      <group ref={rotor}>
        {/* Ring gear: fixed. Carries the 7 project segments. */}
        <group>
          <mesh
            ref={asSolid}
            geometry={geometries.ring}
            material={materials.ring}
            onPointerOver={onRingHover}
            onPointerMove={onRingHover}
            onPointerOut={onPartOut}
            onClick={onRingClick}
            {...grip}
          />
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
          {labelFor("ring") ? (
            <Callout position={[0, 26.4, FRONT]} label={`Ring · The work · ${PROJECT_IDS.length} projects`} />
          ) : null}
        </group>

        {/* Carrier assembly: turns at ω/3 and holds the four planets. */}
        <group ref={carrierAssembly}>
          <group ref={plateGroup} position={[0, 0, PLATE_Z]}>
            <mesh ref={asSolid} geometry={geometries.carrier} material={materials.carrier} {...blocker} />
            <mesh ref={asSolid} geometry={geometries.knurl} material={materials.knurl} {...blocker} />
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

          {planets.map(({ part, x, y }, i) => (
            <group
              key={part}
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
                <mesh
                  ref={asSolid}
                  geometry={geometries.planet}
                  material={picked === part ? materials.steelHover : materials.steel}
                  userData={{ part: part }}
                  {...partEvents}
                />
                <lineSegments ref={asOutline} geometry={geometries.planetEdges} material={materials.line} />
                {picked === part ? (
                  <lineSegments geometry={geometries.planetEdges} material={materials.hoverLine} scale={PROUD} />
                ) : null}
              </group>
              <mesh ref={asSolid} geometry={geometries.pinNut} material={materials.bolt} position={[0, 0, FRONT]} />
              {labelFor(part) ? (
                <Callout position={[0, 0, FRONT + 0.5]} label={partLabel(part)} />
              ) : balloons ? (
                <Callout position={[0, 0, FRONT + 0.5]} label={partCode(part)} balloon />
              ) : null}
            </group>
          ))}
        </group>

        {/* The cross: on a stationary centre boss behind the sun, so it stays upright
            while everything turns around it. Seen from the front through the sun bore. */}
        <group ref={crossGroup} position={[0, 0, PLATE_Z]}>
          <mesh ref={asSolid} geometry={geometries.crossDisc} material={materials.carrier} {...blocker} />
          <lineSegments ref={asOutline} geometry={geometries.crossDiscEdges} material={materials.line} />
          <group position={[0, 0, CROSS_Z]}>
            <mesh
              ref={asSolid}
              geometry={geometries.cross}
              material={picked === "sun" ? materials.brassHover : materials.brass}
              userData={{ part: "sun" }}
              {...partEvents}
            />
            <lineSegments ref={asOutline} geometry={geometries.crossEdges} material={materials.line} />
            {picked === "sun" ? (
              <lineSegments geometry={geometries.crossEdges} material={materials.hoverLine} scale={PROUD} />
            ) : null}
          </group>
        </group>

        {/* Sun gear: brass, engraved EPH 2:8. Faith at the centre. */}
        <group ref={sunGroup}>
          <group ref={sunSpin}>
            <mesh
              ref={asSolid}
              geometry={geometries.sun}
              material={picked === "sun" ? materials.brassHover : materials.brass}
              userData={{ part: "sun" }}
              {...partEvents}
            />
            <lineSegments ref={asOutline} geometry={geometries.sunEdges} material={materials.line} />
            {picked === "sun" ? (
              <lineSegments geometry={geometries.sunEdges} material={materials.hoverLine} scale={PROUD} />
            ) : null}
            <Text
              font={FONT}
              characters={GLYPHS}
              fontSize={1.1}
              letterSpacing={0.06}
              color="#8c6b32"
              anchorX="center"
              anchorY="middle"
              position={[0, -5.95, FRONT + 0.03]}
            >
              EPH 2:8
            </Text>
          </group>
          {labelFor("sun") ? (
            <Callout position={[0, 0, FRONT + 0.5]} label={partLabel("sun")} />
          ) : balloons ? (
            <Callout position={[0, 0, FRONT + 0.5]} label={partCode("sun")} balloon />
          ) : null}
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
    </group>
  );
}

/** Callout text comes from the About "How the parts fit" list (one source of truth). */
function partLabel(part: GearPartId): string {
  const row = about.parts.find((p) => p.part === part);
  return row ? `${row.code} · ${row.name}` : part;
}

/** Balloon text: just the part number, as on an assembly drawing. */
function partCode(part: GearPartId): string {
  return about.parts.find((p) => p.part === part)?.code ?? part;
}
