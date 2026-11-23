"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useGearboxUi } from "./gearboxUi";

/** Radians of turn per pixel dragged. */
const SPEED = 0.009;
/** Pixels of travel before a press counts as a drag (not a click or tap). */
const DRAG_THRESHOLD = 4;
/** How quickly a flick's spin dies away (per second). */
const FRICTION = 3.2;

const UP = new THREE.Vector3();
const RIGHT = new THREE.Vector3();
const Q = new THREE.Quaternion();
const IDENTITY = new THREE.Quaternion();

/** Rotate a group by a screen-space pointer delta, about the camera's up and right axes. */
function turn(group: THREE.Object3D, camera: THREE.Camera, dx: number, dy: number) {
  UP.set(0, 1, 0).applyQuaternion(camera.quaternion);
  RIGHT.set(1, 0, 0).applyQuaternion(camera.quaternion);
  group.quaternion.premultiply(Q.setFromAxisAngle(UP, dx * SPEED));
  group.quaternion.premultiply(Q.setFromAxisAngle(RIGHT, dy * SPEED));
  group.quaternion.normalize();
}

/**
 * Trackball-style drag rotation for the whole gearbox: turn it any way, a full
 * 360° about any axis. Drags rotate about the camera's own up and right axes,
 * so the model always follows the pointer. A flick keeps spinning briefly
 * (not under reduced motion); double-click, or gearboxUi.resetView(), swings
 * it back to the default view.
 *
 * Touch uses `touch-action: pan-y`: a vertical swipe still scrolls the page,
 * a sideways (or diagonal) swipe turns the gearbox.
 */
export function useDragRotate(rotor: RefObject<THREE.Group | null>, reducedMotion: boolean) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const dragging = useRef(false);
  const motion = useRef({ vx: 0, vy: 0, resetting: false });
  useEffect(() => {
    // touch-action, cursor and user-select are set on the Canvas wrapper (GearboxCanvas).
    const el = gl.domElement;
    const m = motion.current;
    let pointer: number | null = null;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;

    const onDown = (e: PointerEvent) => {
      if (pointer !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
      pointer = e.pointerId;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
      lastT = e.timeStamp;
      m.vx = m.vy = 0;
      m.resetting = false;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      if (!dragging.current) {
        if (Math.hypot(e.clientX - startX, e.clientY - startY) < DRAG_THRESHOLD) return;
        dragging.current = true;
        const canvas = e.currentTarget as HTMLElement;
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = "grabbing";
        useGearboxUi.getState().setInspect(null);
      }
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dt = Math.max(1, e.timeStamp - lastT) / 1000;
      if (rotor.current) turn(rotor.current, camera, dx, dy);
      // Smoothed velocity in px/s for the flick.
      m.vx = m.vx * 0.5 + (dx / dt) * 0.5;
      m.vy = m.vy * 0.5 + (dy / dt) * 0.5;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = e.timeStamp;
      invalidate();
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      pointer = null;
      const canvas = e.currentTarget as HTMLElement;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      canvas.style.cursor = "";
      // A pause before letting go means no flick.
      if (reducedMotion || e.type === "pointercancel" || e.timeStamp - lastT > 80) m.vx = m.vy = 0;
      // Let R3F see this pointerup (and skip its click) before clearing the flag.
      requestAnimationFrame(() => {
        dragging.current = false;
      });
      invalidate();
    };
    const onDoubleClick = () => useGearboxUi.getState().resetView();

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("dblclick", onDoubleClick);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("dblclick", onDoubleClick);
    };
  }, [gl, camera, rotor, invalidate, reducedMotion]);

  // Reset requests (double-click, dev panel).
  useEffect(
    () =>
      useGearboxUi.subscribe((s, prev) => {
        if (s.viewReset === prev.viewReset) return;
        motion.current = { vx: 0, vy: 0, resetting: true };
        invalidate();
      }),
    [invalidate],
  );

  useFrame((_, rawDelta) => {
    const group = rotor.current;
    if (!group) return;
    const dt = Math.min(rawDelta, 1 / 20);
    const m = motion.current;

    if (m.resetting) {
      if (reducedMotion) group.quaternion.identity();
      else group.quaternion.slerp(IDENTITY, 1 - Math.exp(-6 * dt));
      if (group.quaternion.angleTo(IDENTITY) < 0.002) {
        group.quaternion.identity();
        m.resetting = false;
      } else invalidate();
      return;
    }

    // Flick: keep turning at the release velocity, decaying to rest.
    if (!dragging.current && (Math.abs(m.vx) > 1 || Math.abs(m.vy) > 1)) {
      turn(group, camera, m.vx * dt, m.vy * dt);
      const decay = Math.exp(-FRICTION * dt);
      m.vx *= decay;
      m.vy *= decay;
      invalidate();
    }
  });

  return dragging;
}
