"use client";

import { Html } from "@react-three/drei";

/**
 * Assembly-drawing part callout (CLAUDE.md 2.6D): a small anchor circle, a
 * leader line and a mono label. Real DOM text via drei <Html>; the canvas
 * wrapper is aria-hidden because the same information is in the page text.
 */
export function Callout({
  position,
  label,
}: {
  position: readonly [number, number, number];
  label: string;
}) {
  return (
    <Html position={position as [number, number, number]} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div className="gearbox-callout">
        <span className="gearbox-callout__anchor" />
        <span className="gearbox-callout__leader" />
        <span className="gearbox-callout__label">{label}</span>
      </div>
    </Html>
  );
}
