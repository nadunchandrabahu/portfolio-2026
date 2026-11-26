import type { ProjectId } from "@/content/projects";
import { scrollIntoViewAccurately } from "./accurateScroll";

/**
 * Scroll a project card in Selected work into view and pulse a brass outline
 * around it for 2s (globals.css .project-pulse). Shared by the chat's
 * highlightProject action and clicking a ring segment on the gearbox.
 * Returns false if the card isn't on the page. The scroll re-centres until
 * the card really lands in the middle (see accurateScroll).
 */
export function revealProjectCard(id: ProjectId, reducedMotion: boolean): boolean {
  const card = document.querySelector<HTMLElement>(`[data-project-id="${id}"]`);
  if (!card) return false;
  scrollIntoViewAccurately(card, { block: "center", reducedMotion });

  card.classList.remove("project-pulse");
  // Restart the animation if the same card is shown twice in a row.
  void card.offsetWidth;
  card.classList.add("project-pulse");
  window.setTimeout(() => card.classList.remove("project-pulse"), 2000);
  return true;
}
