"use client";

import type { ProjectId } from "@/content/projects";
import type { SectionId } from "@/content/site";
import { revealProjectCard } from "@/lib/revealProject";
import { useGearboxStore } from "@/three/gearboxStore";
import { STEP_MS, type ExecutorDeps } from "./executor";
import { setEffects } from "@/lib/theme";

/**
 * The browser side of the executor: store writes, scrolling and the card
 * pulse. Scrolls made here are marked, so the "visitor scrolled away, hand
 * control back" rule (ChatRoot) ignores them.
 */

let programmaticUntil = 0;
const markScroll = (ms = 1500) => {
  programmaticUntil = performance.now() + ms;
};
export const isProgrammaticScroll = () => performance.now() < programmaticUntil;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const inViewport = (el: Element | null) => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.bottom > 80 && r.top < window.innerHeight - 80 && r.width > 0;
};

/** On desktop the gearbox joins the chat in its own viewer (GearboxViewer). */
export const hasChatViewer = () =>
  document.documentElement.hasAttribute("data-gearbox-stage") && window.matchMedia("(min-width: 1024px)").matches;

export function domDeps(reducedMotion: boolean): ExecutorDeps {
  const behavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";
  const store = useGearboxStore.getState;

  return {
    reducedMotion,
    apply: (partial) => store().apply(partial, "chat"),
    reset: () => store().reset(),
    async showGearbox() {
      if (hasChatViewer()) return;
      // Phones and hero-only layouts: the gearbox lives in the hero.
      const hero = document.querySelector('[data-gearbox-slot="hero"]');
      if (!hero || inViewport(hero)) return;
      markScroll();
      document.getElementById("hero")?.scrollIntoView({ behavior, block: "start" });
      if (!reducedMotion) await sleep(STEP_MS);
    },
    scrollToSection(id: SectionId) {
      markScroll();
      document.getElementById(id)?.scrollIntoView({ behavior, block: "start" });
    },
    showProject(id: ProjectId) {
      // Longer than a plain scroll: revealProjectCard may re-centre once or twice.
      markScroll(4000);
      revealProjectCard(id, reducedMotion);
    },
    setEffects,
    sleep,
  };
}
