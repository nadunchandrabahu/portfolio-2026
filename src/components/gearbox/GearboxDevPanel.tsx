"use client";

import { PROJECT_IDS, type ProjectId } from "@/content/projects";
import { useGearboxStore, type FocusTarget } from "@/three/gearboxStore";

/**
 * Development-only controls for the gearbox store, so the scene can be
 * checked before scroll choreography (phase 4) and the chat (phase 5) exist.
 * Never bundled in production (see HeroGearbox).
 */
const FOCUS: FocusTarget[] = ["overview", "sun", "engineering", "data", "ai", "build", "ring"];

export default function GearboxDevPanel() {
  const s = useGearboxStore();
  const set = (partial: Parameters<typeof s.apply>[0]) => s.apply(partial, "chat");
  const field = "flex items-center justify-between gap-3";

  return (
    <div className="fixed top-20 right-4 z-[80] w-64 space-y-2 rounded-machined border border-dashed border-brass/60 bg-cast/95 p-3 font-mono text-[11px] text-concrete">
      <p className="text-brass">DEV · GEARBOX STORE</p>
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
      <button type="button" className="text-brass underline" onClick={s.reset}>
        reset
      </button>
    </div>
  );
}
