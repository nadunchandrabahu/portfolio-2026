/**
 * The chain drive down the right edge of the screen: scrolling moves the
 * chain, and the chain turns the gear docked in the header and the wheel at
 * the bottom (the chat button on phones, a small sprocket on desktop).
 * Shared by ChainDrive (the 2D parts) and the 3D gearbox when it's docked.
 */

/** Desktop sections where the gearbox docks in the header (between its section moments). */
export const DOCK_SECTIONS = ["skills", "experience", "education"] as const;

/** Chain travel per pixel scrolled. Below 1 so it reads as a drive, not a scrollbar. */
export const CHAIN_RATIO = 0.5;

/** How far the chain has run, in px, for the current scroll position. */
export const chainTravel = (): number => window.scrollY * CHAIN_RATIO;

/** Wheel rotation (radians, clockwise on screen) for a wheel of this radius in px. */
export const wheelAngle = (radiusPx: number): number => chainTravel() / radiusPx;

/** Size of the header dock on desktop, in px (the 3D gearbox fits this box). */
export const DOCK_SIZE_PX = 44;

/** True while the desktop scroll stage has the gearbox docked in the header. */
export const isDocked = (): boolean =>
  (DOCK_SECTIONS as readonly string[]).includes(document.documentElement.dataset.gearboxStage ?? "");
