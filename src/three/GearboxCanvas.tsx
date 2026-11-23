"use client";

import {
  AdaptiveDpr,
  ContactShadows,
  Environment,
  Lightformer,
  PerformanceMonitor,
} from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ASSEMBLY_RADIUS, Gearbox } from "./Gearbox";
import { useGearboxStore } from "./gearboxStore";

/** Postprocessing lives in its own chunk; low-power devices never fetch it. */
const Effects = lazy(() => import("./Effects"));

export type GearboxCanvasProps = {
  /** Phones and low-power devices: lower DPR cap, no postprocessing. */
  lowPower: boolean;
  reducedMotion: boolean;
  /** Called once the first frame with the gearbox has rendered. */
  onReady: () => void;
};

/** Studio lighting from Lightformers: no HDR download, no CDN (CLAUDE.md 7.3). */
function Studio() {
  return (
    <Environment resolution={256} frames={1}>
      {/* Soft front panels, high and low: flat metal faces mirror what is in front of
          them, so two dim bands give a brushed gradient instead of a flat white face. */}
      <Lightformer form="rect" intensity={0.9} color="#efe8dc" position={[-2, 5, 8]} scale={[14, 3, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={0.35} color="#c8ccd2" position={[2, -3, 8]} scale={[14, 4, 1]} target={[0, 0, 0]} />
      {/* Warm key strip, upper right. */}
      <Lightformer form="rect" intensity={5} color="#ffd6a0" position={[6, 4, 5]} scale={[11, 1.6, 1]} target={[0, 0, 0]} />
      {/* Cool rim from behind left. */}
      <Lightformer form="rect" intensity={3} color="#a9c8ff" position={[-7, 1, -2]} scale={[1.6, 11, 1]} target={[0, 0, 0]} />
      {/* Soft top fill. */}
      <Lightformer form="circle" intensity={1.6} color="#ffffff" position={[0, 8, 2]} scale={8} target={[0, 0, 0]} />
      {/* Faint warm bounce from below so lower faces aren't black. */}
      <Lightformer form="rect" intensity={0.6} color="#c9a35e" position={[0, -6, 4]} scale={[12, 2, 1]} target={[0, 0, 0]} />
    </Environment>
  );
}

/** Fires onReady after the first real frame, so the poster can fade out. */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
    const id = requestAnimationFrame(() => requestAnimationFrame(onReady));
    return () => cancelAnimationFrame(id);
  }, [invalidate, onReady]);
  return null;
}

/**
 * Compile every shader program off the main thread (KHR_parallel_shader_compile)
 * before the first frame. Without this, the first render blocks while each
 * program links: ~1s on a throttled phone.
 */
function Warmup({ onWarm }: { onWarm: () => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let cancelled = false;
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) onWarm();
      });
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera, onWarm]);
  return null;
}

/** In demand mode (reduced motion), redraw whenever the store changes. */
function InvalidateOnStore() {
  const { invalidate } = useThree();
  useEffect(() => useGearboxStore.subscribe(() => invalidate()), [invalidate]);
  return null;
}

export default function GearboxCanvas({ lowPower, reducedMotion, onReady }: GearboxCanvasProps) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [effects, setEffects] = useState(!lowPower);
  const [warm, setWarm] = useState(false);
  const onWarm = useCallback(() => setWarm(true), []);
  const maxDpr = lowPower ? 1.5 : 2;

  // Stop rendering entirely while the canvas is off-screen.
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? true));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Nothing renders until shaders are compiled, and nothing while off-screen.
  const frameloop = !warm || !visible ? "never" : reducedMotion ? "demand" : "always";

  return (
    <div ref={container} className="absolute inset-0">
      <Canvas
        frameloop={frameloop}
        dpr={[1, maxDpr]}
        gl={{ antialias: !effects, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: 30, near: 0.1, far: 60, position: [3, 2, 6] }}
        style={{ background: "transparent" }}
        onCreated={({ gl }) => {
          // getProgramParameter(LINK_STATUS) stalls until each shader links.
          gl.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
        }}
      >
        <PerformanceMonitor onDecline={() => setEffects(false)} />
        <AdaptiveDpr />
        {reducedMotion ? <InvalidateOnStore /> : null}
        <Suspense fallback={null}>
          <Studio />
          <Gearbox reducedMotion={reducedMotion} />
          <ContactShadows
            position={[0, -ASSEMBLY_RADIUS - 0.08, 0]}
            scale={ASSEMBLY_RADIUS * 4}
            opacity={0.55}
            blur={2.6}
            far={1.2}
            resolution={256}
            frames={lowPower || reducedMotion ? 1 : Infinity}
            color="#000000"
          />
          {warm ? <ReadySignal onReady={onReady} /> : <Warmup onWarm={onWarm} />}
        </Suspense>
        {effects && warm ? (
          <Suspense fallback={null}>
            <Effects />
          </Suspense>
        ) : null}
      </Canvas>
    </div>
  );
}
