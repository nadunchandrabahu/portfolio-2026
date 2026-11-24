"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { PROJECT_IDS, type ProjectId } from "@/content/projects";
import { useGearboxStore, type FocusTarget } from "@/three/gearboxStore";
import { useGearboxUi } from "@/three/gearboxUi";

/**
 * Development-only controls for the gearbox store, so the scene can be
 * checked before scroll choreography (phase 4) and the chat (phase 5) exist.
 * Never bundled in production (see HeroGearbox). Starts minimised to a small
 * tab so it doesn't cover the gearbox; the choice is remembered.
 */
const FOCUS: FocusTarget[] = ["overview", "sun", "engineering", "data", "ai", "build", "ring"];
const STORAGE_KEY = "dev-gearbox-panel-open";

function readOpen(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export default function GearboxDevPanel() {
  const s = useGearboxStore();
  const resetView = useGearboxUi((u) => u.resetView);
  const [open, setOpen] = useState(readOpen);
  const set = (partial: Parameters<typeof s.apply>[0]) => s.apply(partial, "chat");
  const field = "flex items-center justify-between gap-3";

  const toggle = () => {
    setOpen(!open);
    try {
      window.localStorage.setItem(STORAGE_KEY, open ? "0" : "1");
    } catch {
      // Storage blocked: the panel just won't remember.
    }
  };

  return (
    <div className="fixed top-32 right-4 z-[80] w-64 lg:top-20 rounded-machined border border-dashed border-brass/60 bg-cast/95 font-mono text-[11px] text-concrete">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="gearbox-dev-panel"
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-brass"
      >
        DEV · GEARBOX STORE
        {open ? <ChevronUp aria-hidden size={14} /> : <ChevronDown aria-hidden size={14} />}
        <span className="sr-only">{open ? "Minimise" : "Expand"}</span>
      </button>
      {open ? (
        <div id="gearbox-dev-panel" className="space-y-2 px-3 pb-3">
          <label className={field}>
            focus
            <select className="bg-machined text-bone" value={s.focus} onChange={(e) => set({ focus: e.target.value as FocusTarget })}>
              {FOCUS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className={field}>
            mode
            <select
              className="bg-machined text-bone"
              value={s.mode}
              onChange={(e) => set({ mode: e.target.value as "machined" | "blueprint" })}
            >
              <option>machined</option>
              <option>blueprint</option>
            </select>
          </label>
          <label className={field}>
            explode {s.explode.toFixed(2)}
            <input type="range" min={0} max={1} step={0.05} value={s.explode} onChange={(e) => set({ explode: +e.target.value })} />
          </label>
          <label className={field}>
            rpm {s.rpm}
            <input type="range" min={0} max={60} step={1} value={s.rpm} onChange={(e) => set({ rpm: +e.target.value })} />
          </label>
          <label className={field}>
            project
            <select
              className="bg-machined text-bone"
              value={s.highlightProject ?? ""}
              onChange={(e) => set({ highlightProject: (e.target.value || null) as ProjectId | null })}
            >
              <option value="">none</option>
              {PROJECT_IDS.map((id) => (
                <option key={id}>{id}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="text-brass underline"
            onClick={() => {
              s.reset();
              resetView();
            }}
          >
            reset
          </button>
        </div>
      ) : null}
    </div>
  );
}
