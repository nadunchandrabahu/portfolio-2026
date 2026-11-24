"use client";

import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";

/**
 * Assembly-drawing part callout (CLAUDE.md 2.6D): a small anchor circle, a
 * leader line and a mono label. Real DOM text via drei <Html>; the canvas
 * wrapper is aria-hidden because the same information is in the page text.
 */
export function Callout({
  position,
  label,
  balloon = false,
}: {
  position: readonly [number, number, number];
  label: string;
  /** Short leader and just the part number, for labelling every part at once. */
  balloon?: boolean;
}) {
  // Mount beside the canvas. By default drei uses the event source, which on
  // the scroll stage is <body>: the label would be placed in document
  // coordinates and fall outside the aria-hidden canvas layer.
  const gl = useThree((state) => state.gl);
  const portal = useMemo(() => ({ current: gl.domElement.parentElement ?? document.body }), [gl]);
  return (
    <Html
      position={position as [number, number, number]}
      portal={portal}
      zIndexRange={[20, 0]}
      style={{ pointerEvents: "none" }}
    >
      <div className={balloon ? "gearbox-callout gearbox-callout--balloon" : "gearbox-callout"}>
        <span className="gearbox-callout__anchor" />
        <span className="gearbox-callout__leader" />
        <span className="gearbox-callout__label">{label}</span>
      </div>
    </Html>
  );
}
