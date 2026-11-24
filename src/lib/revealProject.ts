import type { ProjectId } from "@/content/projects";

/** How far the card's centre may sit from the viewport's centre once settled. */
const TOLERANCE_PX = 48;
const MAX_CORRECTIONS = 3;
/** Fallback for browsers without `scrollend`, and for scrolls that don't move. */
const SETTLE_FALLBACK_MS = 1200;

/**
 * Scroll a project card in Selected work into view and pulse a brass outline
 * around it for 2s (globals.css .project-pulse). Shared by the chat's
 * highlightProject action and clicking a ring segment on the gearbox.
 * Returns false if the card isn't on the page.
 *
 * Sections below the fold use `content-visibility: auto`, so their real
 * heights only arrive as they render during the scroll and the first scroll
 * lands short. Once it settles, re-centre (a few times at most), unless the
 * visitor has started scrolling themselves.
 */
export function revealProjectCard(id: ProjectId, reducedMotion: boolean): boolean {
  const card = document.querySelector<HTMLElement>(`[data-project-id="${id}"]`);
  if (!card) return false;
  const behavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";

  let cancelled = false;
  const cancel = () => {
    cancelled = true;
  };
  const userInput = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
  userInput.forEach((type) => window.addEventListener(type, cancel, { once: true, passive: true }));
  const cleanup = () => userInput.forEach((type) => window.removeEventListener(type, cancel));

  const scroll = (attempt: number) => {
    card.scrollIntoView({ behavior, block: "center" });
    let settled = false;
    const onSettled = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener("scrollend", onSettled);
      window.clearTimeout(fallback);
      if (cancelled) return cleanup();
      const r = card.getBoundingClientRect();
      const off = Math.abs((r.top + r.bottom) / 2 - window.innerHeight / 2);
      if (off > TOLERANCE_PX && attempt < MAX_CORRECTIONS) scroll(attempt + 1);
      else cleanup();
    };
    window.addEventListener("scrollend", onSettled);
    const fallback = window.setTimeout(onSettled, SETTLE_FALLBACK_MS);
  };
  scroll(0);

  card.classList.remove("project-pulse");
  // Restart the animation if the same card is shown twice in a row.
  void card.offsetWidth;
  card.classList.add("project-pulse");
  window.setTimeout(() => card.classList.remove("project-pulse"), 2000);
  return true;
}
