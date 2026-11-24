"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "@/lib/motion";
import { hasWebGL, isLowPower } from "@/three/webgl";

// The 3D chunk (three, R3F, drei, postprocessing) loads only on the client,
// after first paint (CLAUDE.md 7.7).
const GearboxCanvas = dynamic(() => import("@/three/GearboxCanvas"), { ssr: false });
// Desktop scroll stage: the same canvas fixed over the page plus the GSAP director.
const GearboxStage = dynamic(() => import("@/three/GearboxStage"), { ssr: false });
const GearboxInspectCard = dynamic(() => import("./GearboxInspectCard"), { ssr: false });
const GearboxDevPanel =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("./GearboxDevPanel"), { ssr: false })
    : null;

/** If anything in the 3D tree throws, keep the poster. */
class CanvasBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch() {
    this.props.onError();
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

type Capability = { webgl: boolean; lowPower: boolean } | null;

/** If nobody interacts, start on our own after this much idle time post-load. */
const IDLE_START_MS = 6000;
const INTERACTIONS = ["pointermove", "pointerdown", "touchstart", "wheel", "keydown"] as const;

/**
 * Facade pattern: the poster stands in for the 3D until there's a first sign
 * of a person (pointer, touch, wheel or key), or the page has sat idle for a
 * while. Either way the hero must be on screen. Evaluating the 3D chunk and
 * setting up its shaders costs real main-thread time (well over a second on
 * a throttled phone), so this keeps it out of first paint and initial load.
 */
function useGearboxGate(target: RefObject<HTMLElement | null>): Capability {
  const [capability, setCapability] = useState<Capability>(null);

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    let started = false;
    let loaded = document.readyState === "complete";
    let wanted = false;
    let inView = false;
    let timer: number | undefined;

    const idle = (cb: () => void) =>
      window.requestIdleCallback
        ? window.requestIdleCallback(cb, { timeout: 1000 })
        : window.setTimeout(cb, 50);

    const cleanup = () => {
      observer.disconnect();
      window.clearTimeout(timer);
      window.removeEventListener("load", onLoad);
      INTERACTIONS.forEach((type) => window.removeEventListener(type, onInteract));
    };
    const start = () => {
      if (started) return;
      started = true;
      cleanup();
      setCapability({ webgl: hasWebGL(), lowPower: isLowPower() });
    };
    const evaluate = () => {
      if (!started && loaded && wanted && inView) idle(start);
    };
    function onInteract() {
      wanted = true;
      evaluate();
    }
    function onLoad() {
      loaded = true;
      timer = window.setTimeout(onInteract, IDLE_START_MS);
      evaluate();
    }

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? false;
      evaluate();
    });
    observer.observe(el);
    INTERACTIONS.forEach((type) => window.addEventListener(type, onInteract, { passive: true }));
    if (loaded) onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return cleanup;
  }, [target]);

  return capability;
}

/** Wide enough for the scroll stage: the layouts only reserve gearbox slots from lg up. */
const STAGE_QUERY = "(min-width: 1024px)";
function subscribeWide(onChange: () => void) {
  const mql = window.matchMedia(STAGE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}
const useWide = () =>
  useSyncExternalStore(subscribeWide, () => window.matchMedia(STAGE_QUERY).matches, () => false);

type Mode = "stage" | "hero";

export function HeroGearbox({ poster }: { poster: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const wide = useWide();
  const posterRef = useRef<HTMLDivElement>(null);
  const capability = useGearboxGate(posterRef);
  const [readyIn, setReadyIn] = useState<Mode | null>(null);
  const [failed, setFailed] = useState(false);

  const show3d = capability?.webgl === true && !failed;
  // Scroll choreography on desktop only (CLAUDE.md 7.5). Phones, low-power
  // devices and reduced motion keep the gearbox in the hero, without it.
  const mode: Mode = wide && !capability?.lowPower && !reducedMotion ? "stage" : "hero";
  const canvasReady = readyIn === mode;
  const onStageReady = useCallback(() => setReadyIn("stage"), []);
  const onHeroReady = useCallback(() => setReadyIn("hero"), []);
  const onError = useCallback(() => setFailed(true), []);

  return (
    <>
      <div
        ref={posterRef}
        className={`h-full transition-opacity duration-700 ${canvasReady && show3d ? "opacity-0" : "opacity-100"}`}
      >
        {poster}
      </div>
      {show3d && mode === "hero" ? (
        <div
          aria-hidden="true"
          className={`gearbox-canvas-fade absolute inset-0 transition-opacity duration-700 ${canvasReady ? "opacity-100" : "opacity-0"}`}
        >
          <CanvasBoundary onError={onError}>
            <GearboxCanvas lowPower={capability.lowPower} reducedMotion={reducedMotion} onReady={onHeroReady} />
          </CanvasBoundary>
          {canvasReady ? <GearboxInspectCard /> : null}
        </div>
      ) : null}
      {show3d && mode === "stage"
        ? createPortal(
            // Opacity is driven by the StageDirector as the gearbox moves between sections.
            <div aria-hidden="true" className="gearbox-stage pointer-events-none fixed inset-0 z-10" style={{ opacity: 0 }}>
              <CanvasBoundary onError={onError}>
                <GearboxStage lowPower={capability.lowPower} reducedMotion={reducedMotion} onReady={onStageReady} />
              </CanvasBoundary>
              {canvasReady ? <GearboxInspectCard /> : null}
            </div>,
            document.body,
          )
        : null}
      {show3d && canvasReady ? (
        <p
          aria-hidden="true"
          className="gearbox-hint pointer-events-none absolute inset-x-0 bottom-1 z-20 text-center font-mono text-[11px] tracking-[0.08em] text-concrete/80 uppercase lg:bottom-4"
        >
          <span className="pointer-coarse:hidden">Drag to rotate · Hover a gear · Double-click to reset</span>
          <span className="hidden pointer-coarse:inline">Swipe to rotate · Tap a gear</span>
        </p>
      ) : null}
      {GearboxDevPanel && show3d ? <GearboxDevPanel /> : null}
    </>
  );
}
