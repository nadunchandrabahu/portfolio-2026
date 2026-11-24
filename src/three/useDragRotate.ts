"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, type RefObject } from "react";
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

/** Page-wide cursor and selection state while dragging (see globals.css). */
function setDragging(on: boolean) {
  if (on) document.documentElement.dataset.gearboxDragging = "";
  else delete document.documentElement.dataset.gearboxDragging;
}

/**
 * Trackball-style drag rotation for the whole gearbox: turn it any way, a full
 * 360° about any axis. Drags rotate about the camera's own up and right axes,
 * so the model always follows the pointer. A flick keeps spinning briefly
 * (not under reduced motion); gearboxUi.resetView() swings it back.
 *
 * A drag starts from a gearbox mesh (call `beginDrag` from its onPointerDown)
 * and then follows the pointer on the window. That works whether the canvas
 * takes pointer events itself (hero-only mode) or sits over the page with
 * pointer-events off (the fixed scroll stage). On touch, the hero canvas has
 * `touch-action: pan-y`, so vertical swipes still scroll the page.
 */
export function useDragRotate(rotor: RefObject<THREE.Group | null>, reducedMotion: boolean) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const dragging = useRef(false);
  const motion = useRef({ vx: 0, vy: 0, resetting: false });
  const endSession = useRef<(() => void) | null>(null);

  const beginDrag = useCallback(
    (down: PointerEvent) => {
      if (down.pointerType === "mouse" && down.button !== 0) return;
      endSession.current?.();
      const m = motion.current;
      m.vx = m.vy = 0;
      m.resetting = false;
      let lastX = down.clientX;
      let lastY = down.clientY;
      let lastT = down.timeStamp;

      const onMove = (e: PointerEvent) => {
        if (e.pointerId !== down.pointerId) return;
        if (!dragging.current) {
          if (Math.hypot(e.clientX - down.clientX, e.clientY - down.clientY) < DRAG_THRESHOLD) return;
          dragging.current = true;
          setDragging(true);
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
        if (e.pointerId !== down.pointerId) return;
        // A pause before letting go means no flick.
        if (reducedMotion || e.type === "pointercancel" || e.timeStamp - lastT > 80) m.vx = m.vy = 0;
        cleanup();
        // Let R3F see this pointerup (and skip its click) before clearing the flag.
        requestAnimationFrame(() => {
          dragging.current = false;
        });
        invalidate();
      };
      // On the scroll stage the press lands on the page under the canvas (the
      // hero poster image, text): stop the browser starting an image drag or a
      // text selection, either of which would cancel the pointer stream.
      const block = (e: Event) => e.preventDefault();
      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        window.removeEventListener("dragstart", block, true);
        window.removeEventListener("selectstart", block, true);
        setDragging(false);
        endSession.current = null;
      };
      window.addEventListener("dragstart", block, true);
      window.addEventListener("selectstart", block, true);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      endSession.current = cleanup;
    },
    [rotor, camera, invalidate, reducedMotion],
  );

  useEffect(() => () => endSession.current?.(), []);

  // Reset requests (double-click, dev panel, stage changes).
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

  return { dragging, beginDrag };
}
