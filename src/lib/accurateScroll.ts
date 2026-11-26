/**
 * Smooth-scroll an element into place and make sure it actually lands there.
 *
 * Sections below the fold use `content-visibility: auto`, so until they
 * render they're laid out at a placeholder height. The browser aims a smooth
 * scroll at where the target is *before* the sections it passes have their
 * real heights, so the first scroll lands off. Once it settles, measure and
 * scroll again (a few times at most) until the target is where it should be,
 * unless the visitor starts scrolling themselves.
 *
 * Shared by in-page links (nav, menu, "View work", "Back to top"), the
 * chat's scrollTo action and the project-card reveal.
 */

type Block = "start" | "center";

/** Close enough, in px, for "start" (against the scroll padding) and "center". */
const TOLERANCE: Record<Block, number> = { start: 2, center: 48 };
const MAX_CORRECTIONS = 4;
/** Fallback for browsers without `scrollend`, and for scrolls that don't move. */
const SETTLE_FALLBACK_MS = 1500;

let cancelCurrent: (() => void) | null = null;

/** How far the element is from where it should settle (positive: still below). */
function offset(el: HTMLElement, block: Block): number {
  const r = el.getBoundingClientRect();
  if (block === "center") return (r.top + r.bottom) / 2 - window.innerHeight / 2;
  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  return r.top - padding - margin;
}

/** True if the page can still move in the direction that would close the gap. */
function canMove(gap: number): boolean {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return gap > 0 ? window.scrollY < max - 1 : window.scrollY > 1;
}

export function scrollIntoViewAccurately(
  el: HTMLElement,
  { block = "start", reducedMotion = false }: { block?: Block; reducedMotion?: boolean } = {},
): void {
  cancelCurrent?.();
  const behavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";

  let cancelled = false;
  const userInput = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
  const cleanup = () => {
    userInput.forEach((type) => window.removeEventListener(type, cancel));
    if (cancelCurrent === cancel) cancelCurrent = null;
  };
  const cancel = () => {
    cancelled = true;
    cleanup();
  };
  cancelCurrent = cancel;
  // Listen from the next frame, so the click or keypress that started this doesn't cancel it.
  requestAnimationFrame(() => {
    if (!cancelled) userInput.forEach((type) => window.addEventListener(type, cancel, { once: true, passive: true }));
  });

  const scroll = (attempt: number) => {
    el.scrollIntoView({ behavior, block });
    let settled = false;
    const onSettled = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener("scrollend", onSettled);
      window.clearTimeout(fallback);
      if (cancelled) return;
      const gap = offset(el, block);
      if (Math.abs(gap) > TOLERANCE[block] && canMove(gap) && attempt < MAX_CORRECTIONS) scroll(attempt + 1);
      else cleanup();
    };
    window.addEventListener("scrollend", onSettled);
    const fallback = window.setTimeout(onSettled, SETTLE_FALLBACK_MS);
  };
  scroll(0);
}
