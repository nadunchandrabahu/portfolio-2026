"use client";

import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { damp } from "maath/easing";
import { useEffect, useRef } from "react";
import type { PerspectiveCamera } from "three";
import type { GearPartId } from "@/content/about";
import type { ProjectId } from "@/content/projects";
import { SECTION_IDS, type SectionId } from "@/content/site";
import { IDLE_RPM, useGearboxStore, type GearboxTargets } from "./gearboxStore";
import { useGearboxUi } from "./gearboxUi";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll choreography (CLAUDE.md 7.5), desktop only. One fixed, full-viewport
 * canvas sits over the page with pointer-events off. ScrollTrigger works out
 * which section is active and only *writes* target state to the gearbox
 * store; the scene damps toward it every frame.
 *
 * Where the gearbox appears comes from empty "slots" in the page markup
 * (`data-gearbox-slot`). Each frame the director measures the active slot,
 * fits the camera to it with a view offset (so the gearbox frames exactly as
 * if the canvas were that box), and draws only inside it, with soft masked
 * edges. Between sections it flies from where it was to the new slot.
 * Sections without a slot fade it out, so the reading sections stay clear.
 */

type Stage = { slot: SectionId | null; targets: Partial<GearboxTargets> };

const HIDDEN: Stage = { slot: null, targets: { highlightProject: null } };

const STAGES: Record<SectionId, Stage> = {
  hero: {
    slot: "hero",
    targets: { focus: "overview", explode: 0, mode: "machined", rpm: IDLE_RPM, highlightProject: null, callouts: "focus" },
  },
  // Face-on to the ring, so the project segment for the card in view can light up.
  work: { slot: "work", targets: { focus: "ring", explode: 0, mode: "machined", rpm: 3, callouts: "none" } },
  about: {
    slot: "about",
    targets: { focus: "overview", explode: 0.7, mode: "machined", rpm: 2, highlightProject: null, callouts: "parts" },
  },
  "hands-on": {
    slot: "hands-on",
    targets: { focus: "overview", explode: 0, mode: "blueprint", rpm: 0, highlightProject: null, callouts: "none" },
  },
  skills: HIDDEN,
  experience: HIDDEN,
  education: HIDDEN,
  // Beside the footer verse, close on the sun so EPH 2:8 reads.
  contact: {
    slot: "contact",
    targets: { focus: "sun", explode: 0, mode: "machined", rpm: 2, highlightProject: null, callouts: "none" },
  },
};

/** Flight time between slots. */
const FLIGHT_MS = 900;
/** The drawn area extends this far past the slot (as a fraction of its size), fading out. */
const MASK_BLEED = 0.12;

type Rect = { x: number; y: number; w: number; h: number };

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
});

/** The slot's box in viewport px, or null if it isn't laid out at this breakpoint. */
/** Section slots, plus "chat": the desktop viewer while the chat has control. */
function measureSlot(name: SectionId | "chat"): Rect | null {
  const el = document.querySelector(`[data-gearbox-slot="${name}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 16 || r.height < 16) return null;
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

export default function StageDirector() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  const setEvents = useThree((s) => s.setEvents);

  // Mutable director state, read by the frame loop.
  const director = useRef({
    stage: null as SectionId | null,
    /** Where the last flight started, in document coordinates (so it scrolls with the page). */
    from: null as Rect | null,
    startedAt: 0,
    /** What is on screen now (viewport px), and its opacity. */
    shown: null as Rect | null,
    opacity: 0,
    interactive: false,
    sleeping: false,
    /** Which slot the gearbox is heading for; a change starts a flight. */
    slotKey: null as SectionId | "chat" | null,
  });

  useEffect(() => {
    const d = director.current;
    const store = useGearboxStore.getState;
    document.documentElement.dataset.gearboxStage = "";

    const wake = () => {
      if (!d.sleeping) return;
      d.sleeping = false;
      setFrameloop("always");
    };

    const enter = (id: SectionId) => {
      if (d.stage === id) return;
      d.stage = id;
      document.documentElement.dataset.gearboxStage = id;
      store().apply(STAGES[id].targets, "scroll");
      useGearboxUi.getState().resetView();
      updateHighlight();
      wake();
    };

    // Card ↔ ring: the card in view (or under the pointer) lights its segment.
    let cardInView: ProjectId | null = null;
    let cardHovered: ProjectId | null = null;
    const updateHighlight = () => {
      if (d.stage !== "work") return;
      store().apply({ highlightProject: cardHovered ?? cardInView }, "scroll");
    };

    // About "How the parts fit": hovering or focusing a row focuses that part.
    const focusPart = (part: GearPartId | null) => {
      if (d.stage !== "about") return;
      store().apply({ focus: part ?? "overview" }, "scroll");
    };

    // The chat taking or releasing control moves the gearbox to or from its
    // viewer. On release, the active section's state applies again.
    const unsubscribe = useGearboxStore.subscribe((s, prev) => {
      if (s.controlledBy === prev.controlledBy) return;
      wake();
      if (s.controlledBy === "scroll" && d.stage) {
        store().apply(STAGES[d.stage].targets, "scroll");
        updateHighlight();
      }
    });

    const ctx = gsap.context(() => {
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        ScrollTrigger.create({
          trigger: el,
          start: "top 55%",
          end: id === "contact" ? "max" : "bottom 55%",
          onToggle: (self) => {
            if (self.isActive) enter(id);
          },
        });
      }
      for (const card of document.querySelectorAll<HTMLElement>("[data-project-id]")) {
        const id = card.dataset.projectId as ProjectId;
        ScrollTrigger.create({
          trigger: card,
          start: "top 65%",
          end: "bottom 35%",
          onToggle: (self) => {
            if (self.isActive) cardInView = id;
            else if (cardInView === id) cardInView = null;
            updateHighlight();
          },
        });
      }
    });

    const listeners: [Element, string, EventListener][] = [];
    const on = (el: Element, type: string, fn: EventListener) => {
      el.addEventListener(type, fn);
      listeners.push([el, type, fn]);
    };
    for (const card of document.querySelectorAll<HTMLElement>("[data-project-id]")) {
      const id = card.dataset.projectId as ProjectId;
      on(card, "mouseenter", () => {
        cardHovered = id;
        updateHighlight();
      });
      on(card, "mouseleave", () => {
        if (cardHovered === id) cardHovered = null;
        updateHighlight();
      });
    }
    for (const row of document.querySelectorAll<HTMLElement>("button[data-part]")) {
      const part = row.dataset.part as GearPartId;
      on(row, "mouseenter", () => focusPart(part));
      on(row, "focus", () => focusPart(part));
      on(row, "click", () => focusPart(part));
      on(row, "mouseleave", () => focusPart(null));
      on(row, "blur", () => focusPart(null));
    }

    // Sections render lazily (content-visibility), so their real heights arrive
    // as you scroll. Re-measure the triggers whenever the page height changes,
    // but never mid-scroll: a refresh resets the scroll position for a moment,
    // which cancels a smooth scroll (a nav link would stop short). Wait until
    // the page has been still for a moment.
    let raf = 0;
    let idle = 0;
    let scrolling = false;
    let refreshPending = false;
    const refresh = () => {
      refreshPending = false;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    const onScroll = () => {
      scrolling = true;
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        scrolling = false;
        if (refreshPending) refresh();
      }, 200);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const resize = new ResizeObserver(() => {
      if (scrolling) refreshPending = true;
      else refresh();
    });
    resize.observe(document.body);

    // Start on whichever section is active now.
    const active = ScrollTrigger.getAll().find((t) => t.isActive && t.trigger?.tagName === "SECTION");
    const startId = SECTION_IDS.find((id) => id === active?.trigger?.id) ?? "hero";
    enter(startId);

    return () => {
      unsubscribe();
      ctx.revert();
      resize.disconnect();
      cancelAnimationFrame(raf);
      window.clearTimeout(idle);
      window.removeEventListener("scroll", onScroll);
      listeners.forEach(([el, type, fn]) => el.removeEventListener(type, fn));
      delete document.documentElement.dataset.gearboxStage;
    };
  }, [setFrameloop]);

  // Before the scene updates: place the gearbox's "virtual canvas" over the slot.
  useFrame((state, rawDelta) => {
    const d = director.current;
    if (!d.stage) return;
    const dt = Math.min(rawDelta, 1 / 20);
    const { camera, size, gl } = state;
    const stage = STAGES[d.stage];
    const chatSlot = useGearboxStore.getState().controlledBy === "chat" ? measureSlot("chat") : null;
    const slotKey = chatSlot ? "chat" : stage.slot;
    if (slotKey !== d.slotKey) {
      // Fly from where it is now, unless it was faded out (then appear in place).
      const shown = d.shown;
      d.from = shown && d.opacity > 0.05 ? { ...shown, y: shown.y + window.scrollY } : null;
      d.startedAt = performance.now();
      d.slotKey = slotKey;
    }
    const target = chatSlot ?? (stage.slot ? measureSlot(stage.slot) : null);

    if (target) {
      const t = d.from ? Math.min(1, (performance.now() - d.startedAt) / FLIGHT_MS) : 1;
      if (d.from && t < 1) {
        const from = { ...d.from, y: d.from.y - window.scrollY };
        d.shown = lerpRect(from, target, easeInOut(t));
      } else {
        d.from = null;
        d.shown = target;
      }
    }
    damp(d, "opacity", target ? 1 : 0, 0.18, dt);

    const wrapper = gl.domElement.closest<HTMLElement>(".gearbox-stage");
    if (wrapper) wrapper.style.opacity = d.opacity.toFixed(3);

    // Only take pointer events (hover, drag) while it's visible.
    const interactive = d.opacity > 0.5;
    if (interactive !== d.interactive) {
      d.interactive = interactive;
      setEvents({ enabled: interactive });
      if (!interactive) useGearboxUi.getState().setInspect(null);
    }

    // Faded out with nowhere to be: stop rendering until a section wants it back.
    if (!target && d.opacity < 0.003) {
      if (wrapper) wrapper.style.opacity = "0";
      d.sleeping = true;
      setFrameloop("never");
      return;
    }

    const r = d.shown;
    if (!r) return;
    const cam = camera as PerspectiveCamera;
    cam.aspect = r.w / r.h;
    cam.setViewOffset(r.w, r.h, -r.x, -r.y, size.width, size.height);
    cam.updateProjectionMatrix();

    const bx = r.w * MASK_BLEED;
    const by = r.h * MASK_BLEED;
    const style = gl.domElement.style;
    style.maskSize = `${r.w + 2 * bx}px ${r.h + 2 * by}px`;
    style.maskPosition = `${r.x - bx}px ${r.y - by}px`;
  }, -1);

  // Render only the slot's area (plus its fading bleed). Priority 1 takes over
  // rendering from R3F, so this is the one render per frame.
  useFrame((state) => {
    const { gl, scene, camera, size } = state;
    const r = director.current.shown;
    gl.setScissorTest(false);
    gl.clear();
    if (!r || director.current.opacity < 0.003) return;
    const bx = r.w * MASK_BLEED;
    const by = r.h * MASK_BLEED;
    const x0 = Math.max(0, Math.floor(r.x - bx));
    const y0 = Math.max(0, Math.floor(r.y - by));
    const x1 = Math.min(size.width, Math.ceil(r.x + r.w + bx));
    const y1 = Math.min(size.height, Math.ceil(r.y + r.h + by));
    if (x1 <= x0 || y1 <= y0) return; // slot is off-screen
    gl.setScissorTest(true);
    gl.setScissor(x0, size.height - y1, x1 - x0, y1 - y0);
    gl.render(scene, camera);
    gl.setScissorTest(false);
  }, 1);

  return null;
}
