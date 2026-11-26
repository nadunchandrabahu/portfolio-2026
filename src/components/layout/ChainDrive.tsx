"use client";

import { useEffect, useRef, useState } from "react";
import { useChatOpen } from "@/lib/chat/open";
import { DOCK_SECTIONS, wheelAngle } from "@/lib/chainDrive";
import { gearPath } from "@/lib/gearOutline";

const SPROCKET = gearPath({ teeth: 12, module: 2 });
/** On-screen radii (px) of the wheels the chain turns, so teeth and chain keep pace. */
const DOCK_RADIUS = { phone: 12, desktop: 22 };
const SPROCKET_RADIUS = 18;
const FAB_RADIUS = 28;

function Sprocket({ className }: { className?: string }) {
  return (
    <svg viewBox="-15 -15 30 30" className={className} aria-hidden="true">
      <path d={SPROCKET} className="fill-concrete/70" />
      <circle r="5" className="fill-brass/80" />
      <circle r="2" className="fill-graphite" />
    </svg>
  );
}

/**
 * A quiet chain drive down the right edge, shown once you're past the hero.
 * Scrolling runs the chain (down on the right strand when you scroll down,
 * up when you scroll up) and turns the gear in the header and the wheel at
 * the bottom. On desktop the 3D gearbox itself docks in the header between
 * its section moments (StageDirector); elsewhere a small 2D gear stands in.
 * Purely decorative (aria-hidden, no pointer events); static under reduced motion.
 */
export function ChainDrive() {
  const root = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [pastHero, setPastHero] = useState(false);
  const chatOpen = useChatOpen();

  // Which section the desktop scroll stage is on (absent when the stage isn't running).
  useEffect(() => {
    const html = document.documentElement;
    const read = () => setStage(html.dataset.gearboxStage ?? null);
    read();
    const observer = new MutationObserver(read);
    observer.observe(html, { attributes: true, attributeFilter: ["data-gearbox-stage"] });
    return () => observer.disconnect();
  }, []);

  // Past the hero once its bottom edge has gone under the header.
  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setPastHero(!(entry?.isIntersecting ?? true)), {
      rootMargin: "-72px 0px 0px 0px",
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  // Scroll drives the chain: strands slide, wheels turn. Direct style writes on a
  // handful of elements, once per frame at most.
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const down = el.querySelector<HTMLElement>(".chain-strand-down");
    const up = el.querySelector<HTMLElement>(".chain-strand-up");
    const dockGear = el.querySelector<SVGElement>(".chain-dock-gear");
    const sprocket = el.querySelector<SVGElement>(".chain-sprocket");
    const desktop = window.matchMedia("(min-width: 64rem)");
    let raf = 0;
    const update = () => {
      raf = 0;
      const travel = wheelAngle(1); // = chain travel in px
      if (down) down.style.maskPosition = `0 ${travel.toFixed(1)}px`;
      if (up) up.style.maskPosition = `0 ${(-travel).toFixed(1)}px`;
      const dockR = desktop.matches ? DOCK_RADIUS.desktop : DOCK_RADIUS.phone;
      if (dockGear) dockGear.style.rotate = `${wheelAngle(dockR).toFixed(4)}rad`;
      if (sprocket) sprocket.style.rotate = `${wheelAngle(SPROCKET_RADIUS).toFixed(4)}rad`;
      const fabIcon = document.querySelector<SVGElement>(".chain-fab svg");
      if (fabIcon) fabIcon.style.rotate = `${wheelAngle(FAB_RADIUS).toFixed(4)}rad`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const stageRunning = stage !== null;
  const docked = stageRunning ? (DOCK_SECTIONS as readonly string[]).includes(stage) : pastHero;

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="chain-drive"
      data-on={docked || undefined}
      data-chat-open={chatOpen || undefined}
      data-stage={stageRunning || undefined}
    >
      {/* The desktop scroll stage flies the 3D gearbox into this box. */}
      <div className="chain-dock" data-gearbox-slot="header">
        <Sprocket className="chain-dock-gear" />
      </div>
      <div className="chain-strands">
        <i className="chain-strand-down" />
        <i className="chain-strand-up" />
      </div>
      <Sprocket className="chain-sprocket" />
    </div>
  );
}
