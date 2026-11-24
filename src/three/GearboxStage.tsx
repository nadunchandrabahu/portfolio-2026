"use client";

import GearboxCanvas, { type GearboxCanvasProps } from "./GearboxCanvas";
import StageDirector from "./StageDirector";

/**
 * Desktop scroll stage: the gearbox canvas fixed over the page, driven by the
 * StageDirector. Its own entry point so GSAP only loads where it's used, and
 * the director is there from the first frame.
 */
export default function GearboxStage(props: Omit<GearboxCanvasProps, "stage">) {
  return (
    <GearboxCanvas {...props} stage>
      <StageDirector />
    </GearboxCanvas>
  );
}
