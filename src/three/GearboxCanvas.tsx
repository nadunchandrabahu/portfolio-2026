"use client";

import {
  AdaptiveDpr,
  ContactShadows,
  Environment,
  Lightformer,
  PerformanceMonitor,
} from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ASSEMBLY_RADIUS, Gearbox } from "./Gearbox";
import { useGearboxStore } from "./gearboxStore";
import { useGearboxUi } from "./gearboxUi";
import { useTheme, type Theme } from "@/lib/theme";

/** Postprocessing lives in its own chunk; low-power devices never fetch it. */
const Effects = lazy(() => import("./Effects"));

export type GearboxCanvasProps = {
  /** Phones and low-power devices: lower DPR cap, no postprocessing. */
  lowPower: boolean;
  reducedMotion: boolean;
  /** Called once the first frame with the gearbox has rendered. */
  onReady: () => void;
  /**
   * Desktop scroll stage: the canvas is fixed over the whole page with
   * pointer-events off, so events come from the page body, the director
   * (children) owns the camera aspect, and there is no postprocessing.
   */
  stage?: boolean;
  children?: ReactNode;
};

/** Lighting per site theme: rain is dimmer and cooler (overcast); light lifts the front fill so the steel doesn't read black on paper. */
const LIGHTS: Record<
  Theme,
  {
    front: number;
    low: number;
    key: number;
    keyColor: string;
    rim: number;
    rimColor: string;
    top: number;
    topColor: string;
    bounce: number;
    bounceColor: string;
  }
> = {
  dark: {
    front: 0.9,
    low: 0.35,
    key: 5,
    keyColor: "#ffd6a0",
    rim: 3,
    rimColor: "#a9c8ff",
    top: 1.6,
    topColor: "#ffffff",
    bounce: 0.6,
    bounceColor: "#c9a35e",
  },
  light: {
    front: 1.3,
    low: 0.6,
    key: 5,
    keyColor: "#ffd6a0",
    rim: 2.4,
    rimColor: "#a9c8ff",
    top: 2,
    topColor: "#ffffff",
    bounce: 0.6,
    bounceColor: "#c9a35e",
  },
  rain: {
    front: 0.6,
    low: 0.3,
    key: 1.8,
    keyColor: "#cdd8e4",
    rim: 3.4,
    rimColor: "#8fa9cc",
    top: 0.9,
    topColor: "#b9c5d1",
    bounce: 0.35,
    bounceColor: "#7f8b96",
  },
};

/** Studio lighting from Lightformers: no HDR download, no CDN (CLAUDE.md 7.3). */
function Studio() {
  const theme = useTheme();
  const invalidate = useThree((s) => s.invalidate);
  const l = LIGHTS[theme];
  // The environment renders once (frames=1); a new theme rebuilds it, then redraw.
  useEffect(() => invalidate(), [theme, invalidate]);
  return (
    <Environment key={theme} resolution={256} frames={1}>
      {/* Soft front panels, high and low: flat metal faces mirror what is in front of
          them, so two dim bands give a brushed gradient instead of a flat white face. */}
      <Lightformer
        form="rect"
        intensity={l.front}
        color="#efe8dc"
        position={[-2, 5, 8]}
        scale={[14, 3, 1]}
        target={[0, 0, 0]}
      />
      <Lightformer
        form="rect"
        intensity={l.low}
        color="#c8ccd2"
        position={[2, -3, 8]}
        scale={[14, 4, 1]}
        target={[0, 0, 0]}
      />
      {/* Key strip, upper right (warm; cool and weak in the rain). */}
      <Lightformer
        form="rect"
        intensity={l.key}
        color={l.keyColor}
        position={[6, 4, 5]}
        scale={[11, 1.6, 1]}
        target={[0, 0, 0]}
      />
      {/* Cool rim from behind left. */}
      <Lightformer
        form="rect"
        intensity={l.rim}
        color={l.rimColor}
        position={[-7, 1, -2]}
        scale={[1.6, 11, 1]}
        target={[0, 0, 0]}
      />
      {/* Soft top fill. */}
      <Lightformer
        form="circle"
        intensity={l.top}
        color={l.topColor}
        position={[0, 8, 2]}
        scale={8}
        target={[0, 0, 0]}
      />
      {/* Faint bounce from below so lower faces aren't black. */}
      <Lightformer
        form="rect"
        intensity={l.bounce}
        color={l.bounceColor}
        position={[0, -6, 4]}
        scale={[12, 2, 1]}
        target={[0, 0, 0]}
      />
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
    // Dev only: React Strict Mode mounts the canvas twice, and three's
    // compileAsync keeps polling the discarded first renderer's programs,
    // flooding the console. It is a production speed-up, so skip it in dev.
    if (process.env.NODE_ENV !== "production") {
      onWarm();
      return;
    }
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

export default function GearboxCanvas({
  lowPower,
  reducedMotion,
  onReady,
  stage = false,
  children,
}: GearboxCanvasProps) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  // Postprocessing passes are full-canvas; on the full-viewport stage they'd cost too much.
  const [effects, setEffects] = useState(!lowPower && !stage);
  const [warm, setWarm] = useState(false);
  const onWarm = useCallback(() => setWarm(true), []);
  const maxDpr = lowPower ? 1.5 : 2;

  // Stop rendering entirely while the canvas is off-screen.
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry?.isIntersecting ?? true),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Nothing renders until shaders are compiled, and nothing while off-screen.
  const frameloop =
    !warm || !visible ? "never" : reducedMotion ? "demand" : "always";

  return (
    <div ref={container} className="absolute inset-0">
      <Canvas
        frameloop={frameloop}
        dpr={[1, maxDpr]}
        gl={{
          antialias: !effects,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{
          fov: 30,
          near: 0.1,
          far: 60,
          position: [3, 2, 6],
          manual: stage,
        }}
        eventSource={stage ? document.body : undefined}
        eventPrefix={stage ? "client" : "offset"}
        // Hero-only mode: drag to rotate (useDragRotate); pan-y keeps vertical swipes scrolling the page.
        style={
          stage
            ? { background: "transparent" }
            : {
                background: "transparent",
                touchAction: "pan-y",
                userSelect: "none",
              }
        }
        onCreated={({ gl }) => {
          // getProgramParameter(LINK_STATUS) stalls until each shader links.
          gl.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
        }}
        // A tap or click on empty space closes the part details card.
        onPointerMissed={() => useGearboxUi.getState().setInspect(null)}
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
          {warm ? (
            <ReadySignal onReady={onReady} />
          ) : (
            <Warmup onWarm={onWarm} />
          )}
        </Suspense>
        {children}
        {effects && warm ? (
          <Suspense fallback={null}>
            <Effects />
          </Suspense>
        ) : null}
      </Canvas>
    </div>
  );
}
