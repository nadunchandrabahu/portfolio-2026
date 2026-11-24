import { create } from "zustand";
import type { GearPartId } from "@/content/about";
import type { ProjectId } from "@/content/projects";

/**
 * Visitor interaction with the hero gearbox: which part is being inspected
 * (hover on a mouse, tap on touch) and requests to reset the drag rotation.
 * Kept apart from gearboxStore, which scroll and chat drive.
 */

export type InspectTarget = { kind: "part"; part: GearPartId } | { kind: "project"; id: ProjectId };

export type Inspect = {
  target: InspectTarget;
  /** Pointer position in px, relative to the canvas, when the part was picked. */
  x: number;
  y: number;
  /** The gearbox's on-screen box (viewport px), so the card can sit beside it, not on it. */
  bounds: { left: number; top: number; right: number; bottom: number };
};

type GearboxUiState = {
  inspect: Inspect | null;
  /** Bumped to ask the scene to rotate back to the default view. */
  viewReset: number;
  setInspect(inspect: Inspect | null): void;
  resetView(): void;
};

export function sameTarget(a: InspectTarget | null | undefined, b: InspectTarget | null | undefined) {
  if (!a || !b) return !a && !b;
  if (a.kind === "part" && b.kind === "part") return a.part === b.part;
  if (a.kind === "project" && b.kind === "project") return a.id === b.id;
  return false;
}

export const useGearboxUi = create<GearboxUiState>()((set) => ({
  inspect: null,
  viewReset: 0,
  setInspect(inspect) {
    set({ inspect });
  },
  resetView() {
    set((s) => ({ viewReset: s.viewReset + 1, inspect: null }));
  },
}));
