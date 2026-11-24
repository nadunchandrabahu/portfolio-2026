import { create } from "zustand";
import type { ProjectId } from "@/content/projects";

/**
 * Single source of truth for the gearbox (CLAUDE.md 7.8). Scroll choreography
 * (phase 4) and the chat executor (phase 5) only *write* target state here;
 * the scene damps toward it every frame.
 */

export type FocusTarget = "overview" | "sun" | "engineering" | "data" | "ai" | "build" | "ring";
export type GearboxMode = "machined" | "blueprint";
export type ControlSource = "scroll" | "chat";
/**
 * Part labels: "focus" labels only the focused part; "parts" adds numbered
 * balloons (P-01...) to every part, as on an assembly drawing; "none" hides them.
 */
export type CalloutMode = "focus" | "parts" | "none";
const CALLOUT_MODES: readonly CalloutMode[] = ["focus", "parts", "none"];

export const IDLE_RPM = 6;
export const MAX_RPM = 60;

export type GearboxTargets = {
  focus: FocusTarget;
  /** 0 = assembled, 1 = fully exploded along the axis. */
  explode: number;
  mode: GearboxMode;
  /** Sun-gear speed. The carrier and planets follow from the gear ratios. */
  rpm: number;
  highlightProject: ProjectId | null;
  callouts: CalloutMode;
};

export type GearboxState = GearboxTargets & {
  controlledBy: ControlSource;
  apply(partial: Partial<GearboxTargets>, source: ControlSource): void;
  releaseToScroll(): void;
  reset(): void;
};

export const DEFAULT_TARGETS: GearboxTargets = {
  focus: "overview",
  explode: 0,
  mode: "machined",
  rpm: IDLE_RPM,
  highlightProject: null,
  callouts: "focus",
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Clamp numbers and drop undefined keys so callers can't push the scene out of range. */
export function sanitize(partial: Partial<GearboxTargets>): Partial<GearboxTargets> {
  const out: Partial<GearboxTargets> = {};
  if (partial.focus !== undefined) out.focus = partial.focus;
  if (partial.mode !== undefined) out.mode = partial.mode;
  if (partial.highlightProject !== undefined) out.highlightProject = partial.highlightProject;
  if (partial.callouts !== undefined && CALLOUT_MODES.includes(partial.callouts)) {
    out.callouts = partial.callouts;
  }
  if (partial.explode !== undefined && Number.isFinite(partial.explode)) {
    out.explode = clamp(partial.explode, 0, 1);
  }
  if (partial.rpm !== undefined && Number.isFinite(partial.rpm)) {
    out.rpm = clamp(partial.rpm, 0, MAX_RPM);
  }
  return out;
}

export const useGearboxStore = create<GearboxState>()((set, get) => ({
  ...DEFAULT_TARGETS,
  controlledBy: "scroll",

  apply(partial, source) {
    // While the chat is driving, scroll updates are ignored until released.
    if (source === "scroll" && get().controlledBy === "chat") return;
    set({ ...sanitize(partial), controlledBy: source });
  },

  releaseToScroll() {
    set({ controlledBy: "scroll" });
  },

  reset() {
    set({ ...DEFAULT_TARGETS, controlledBy: "scroll" });
  },
}));
