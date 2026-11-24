"use client";

import { useLayoutEffect, useRef } from "react";
import { gearPartDetails, projectDetail, type GearDetail } from "@/content/gearbox";
import { useGearboxUi, type InspectTarget } from "@/three/gearboxUi";

/** Gap between the pointer and the card, and the minimum margin to the viewport edge. */
const GAP = 18;
const EDGE = 8;

function detailFor(target: InspectTarget): GearDetail | null {
  return target.kind === "part" ? gearPartDetails[target.part] : projectDetail(target.id);
}

/**
 * Pops out the details of the gearbox part being hovered (or tapped): the
 * skills that planet stands for, the verse for the sun and cross, or the
 * project for a ring segment. Positioned beside the gearbox (or the pointer
 * when there's no room), at the pointer's height, and kept inside the
 * viewport. Decorative: the same content is in the About and Toolbox
 * sections, so it sits inside the aria-hidden canvas wrapper and takes no
 * pointer events.
 */
export default function GearboxInspectCard() {
  const inspect = useGearboxUi((s) => s.inspect);
  const card = useRef<HTMLDivElement>(null);

  // Place it before paint: measure, then pick a side and clamp.
  useLayoutEffect(() => {
    const el = card.current;
    const parent = el?.offsetParent;
    if (!el || !parent || !inspect) return;
    const box = parent.getBoundingClientRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = document.documentElement.clientWidth;

    // Sit beside the gearbox, not on it, so it never covers what you're about
    // to grab: left of it if there's room (it's on the right of the page on
    // desktop), else right. With no room either side (phones), sit beside
    // the pointer on whichever side has more space.
    const b = inspect.bounds;
    const pointerX = box.left + inspect.x;
    let left: number;
    if (b.left - GAP - w >= EDGE) left = b.left - GAP - w;
    else if (b.right + GAP + w <= vw - EDGE) left = b.right + GAP;
    else left = pointerX > vw / 2 ? pointerX - GAP - w : pointerX + GAP;
    const clampedLeft = Math.min(Math.max(left, EDGE), vw - EDGE - w);
    const top = Math.min(Math.max(inspect.y - h / 2, EDGE), Math.max(EDGE, box.height - h - EDGE));

    el.style.left = `${clampedLeft - box.left}px`;
    el.style.top = `${top}px`;
    el.style.visibility = "visible";
  }, [inspect]);

  const detail = inspect ? detailFor(inspect.target) : null;
  if (!inspect || !detail) return null;

  return (
    <div
      ref={card}
      // Re-mount per part so the entrance animation plays each time.
      key={inspect.target.kind === "part" ? inspect.target.part : inspect.target.id}
      className="gearbox-inspect pointer-events-none absolute z-30 w-[min(20rem,calc(100vw-1rem))] rounded-machined border border-steel-line bg-cast/95 p-4 shadow-machined backdrop-blur-sm"
      style={{ visibility: "hidden", left: 0, top: 0 }}
    >
      <div className="border-l-2 border-brass pl-3">
        <p className="eyebrow text-brass">{detail.code}</p>
        <p className="mt-1 font-display text-[1.05rem] leading-snug font-semibold text-bone">{detail.name}</p>
        <p className="mt-1 text-small text-concrete">{detail.line}</p>
      </div>

      {detail.quote ? (
        <figure className="mt-3">
          <blockquote className="font-sans-italic text-small text-bone italic">
            &ldquo;{detail.quote.text}&rdquo;
          </blockquote>
          <figcaption className="mt-1 font-mono text-[11px] tracking-[0.08em] text-concrete uppercase">
            {detail.quote.reference}
          </figcaption>
        </figure>
      ) : null}

      {detail.groups.map((group) => (
        <div key={group.label} className="mt-3">
          <p className="font-mono text-[11px] tracking-[0.08em] text-concrete uppercase">{group.label}</p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {group.items.map((item) => (
              <li
                key={item}
                className="rounded-sm border border-steel-line px-1.5 py-0.5 font-mono text-[11px] leading-snug text-bone"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {inspect.target.kind === "project" ? (
        // The segment is a link to the project card (Gearbox onRingClick).
        <p className="mt-3 font-mono text-[11px] tracking-[0.08em] text-brass uppercase">
          <span className="[@media(hover:none)]:hidden">Click to view the project ↓</span>
          <span className="hidden [@media(hover:none)]:inline">Tap again to view the project ↓</span>
        </p>
      ) : null}
    </div>
  );
}
