"use client";

import { useGearboxStore } from "@/three/gearboxStore";

/**
 * Desktop: while the chat is driving the gearbox, it flies out of the page
 * into this framed viewer beside the panel, so you can watch what the reply
 * does wherever you are on the page (StageDirector measures the inner slot).
 * Releasing hands it back to its section.
 */
export function GearboxViewer({ beside }: { beside: boolean }) {
  const release = useGearboxStore((s) => s.releaseToScroll);
  const place = `chat-viewer fixed ${beside ? "chat-viewer--beside" : ""}`;
  return (
    <>
      {/* The frame sits under the gearbox canvas (z-10)... */}
      <div className={`${place} z-[9] rounded-machined border border-steel-line bg-cast shadow-machined`}>
        <div aria-hidden="true" className="blueprint-grid absolute inset-0 rounded-machined opacity-60" />
        {/* Inset so the slot plus the stage's soft bleed stays inside the frame. */}
        <div data-gearbox-slot="chat" className="absolute inset-[12%]" />
      </div>
      {/* ...and the chip sits over it, so the gears never cover it. */}
      <div className={`${place} pointer-events-none z-[11]`}>
        <ControlChip onRelease={release} className="pointer-events-auto absolute top-3 left-3" />
      </div>
    </>
  );
}

/** "GEARBOX · CHAT CONTROL · Release" (CLAUDE.md 7.8). */
export function ControlChip({ onRelease, className = "" }: { onRelease: () => void; className?: string }) {
  return (
    <div
      role="status"
      className={`flex items-center gap-2 rounded-sm border border-brass/50 bg-graphite/90 py-1 pr-1 pl-2.5 font-mono text-[11px] tracking-[0.08em] text-concrete uppercase ${className}`}
    >
      <span aria-hidden="true" className="status-lamp" />
      Gearbox · chat control ·
      <button
        type="button"
        onClick={onRelease}
        className="min-h-7 rounded-sm px-2 text-brass uppercase hover:bg-brass hover:text-graphite"
      >
        Release
      </button>
    </div>
  );
}
