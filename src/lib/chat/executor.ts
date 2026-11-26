import type { ProjectId } from "@/content/projects";
import type { SectionId } from "@/content/site";
import type { GearboxTargets } from "@/three/gearboxStore";
import type { Theme } from "@/lib/themeConfig";
import type { GearboxAction } from "./schema";

/**
 * Runs a reply's gearbox actions (CLAUDE.md 8.6). Actions play in order,
 * about 900ms apart, so the movement reads as a sequence. Under reduced
 * motion the final state is applied at once and spins are skipped.
 *
 * Everything with a side effect comes in through `deps`, so the sequencing
 * is unit-testable without a browser or a 3D scene.
 */

export const STEP_MS = 900;

export type ExecutorDeps = {
  reducedMotion: boolean;
  /** Write target state to the gearbox store as the chat. */
  apply(partial: Partial<GearboxTargets>): void;
  /** Defaults (overview, assembled, machined, idle rpm) and control back to scroll. */
  reset(): void;
  /** Make sure the gearbox is on screen before it moves (e.g. scroll to the hero on phones). */
  showGearbox(): Promise<void>;
  scrollToSection(id: SectionId): void;
  /** Scroll the project's card into view and pulse its outline. */
  showProject(id: ProjectId): void;
  /** Switch the site theme (dark / light / rain). */
  setTheme(theme: Theme): void;
  sleep(ms: number): Promise<void>;
};

/** Actions that move the model itself (rather than only the page). */
const movesGearbox = (a: GearboxAction) => a.type !== "scrollTo" && a.type !== "reset" && a.type !== "theme";

/** Store changes for one action; null for actions that only scroll. */
function toTargets(action: GearboxAction): Partial<GearboxTargets> | null {
  switch (action.type) {
    case "focus":
      // A focused part shows its callout label.
      return { focus: action.target, callouts: "focus" };
    case "explode":
      return { explode: action.amount };
    case "mode":
      return { mode: action.value };
    case "spin":
      return { rpm: action.rpm };
    case "highlightProject":
      return { highlightProject: action.id };
    default:
      return null;
  }
}

function runOne(action: GearboxAction, deps: ExecutorDeps) {
  if (action.type === "reset") return deps.reset();
  if (action.type === "scrollTo") return deps.scrollToSection(action.section);
  if (action.type === "theme") return deps.setTheme(action.value);
  const targets = toTargets(action);
  if (targets) deps.apply(targets);
  if (action.type === "highlightProject") deps.showProject(action.id);
}

/** Reduced motion: fold everything into one final state; no spin, instant scroll. */
function runReduced(actions: GearboxAction[], deps: ExecutorDeps) {
  let targets: Partial<GearboxTargets> = {};
  let didReset = false;
  let theme: Theme | null = null;
  let lastScroll: { kind: "section"; id: SectionId } | { kind: "project"; id: ProjectId } | null = null;
  for (const action of actions) {
    if (action.type === "reset") {
      didReset = true;
      targets = {};
    } else if (action.type === "scrollTo") {
      lastScroll = { kind: "section", id: action.section };
    } else if (action.type === "theme") {
      theme = action.value;
    } else if (action.type !== "spin") {
      Object.assign(targets, toTargets(action));
      if (action.type === "highlightProject") lastScroll = { kind: "project", id: action.id };
    }
  }
  if (didReset) deps.reset();
  if (theme) deps.setTheme(theme);
  if (Object.keys(targets).length > 0) deps.apply(targets);
  if (lastScroll?.kind === "project") deps.showProject(lastScroll.id);
  else if (lastScroll) deps.scrollToSection(lastScroll.id);
}

export async function runActions(actions: GearboxAction[], deps: ExecutorDeps, signal?: AbortSignal) {
  if (actions.length === 0) return;
  if (actions.some(movesGearbox)) await deps.showGearbox();
  if (signal?.aborted) return;

  if (deps.reducedMotion) {
    runReduced(actions, deps);
    return;
  }
  for (const [i, action] of actions.entries()) {
    if (signal?.aborted) return;
    runOne(action, deps);
    if (i < actions.length - 1) await deps.sleep(STEP_MS);
  }
}

/** One-line receipt under a reply, e.g. "→ focus: ai · spin: 30 rpm". */
export function formatReceipt(actions: GearboxAction[]): string | null {
  if (actions.length === 0) return null;
  const parts = actions.map((a) => {
    switch (a.type) {
      case "focus":
        return `focus: ${a.target}`;
      case "explode":
        return `explode: ${a.amount}`;
      case "mode":
        return `mode: ${a.value}`;
      case "spin":
        return `spin: ${a.rpm} rpm`;
      case "highlightProject":
        return `project: ${a.id}`;
      case "scrollTo":
        return `scroll: ${a.section}`;
      case "reset":
        return "reset";
      case "theme":
        return `theme: ${a.value}`;
    }
  });
  return `→ ${parts.join(" · ")}`;
}
