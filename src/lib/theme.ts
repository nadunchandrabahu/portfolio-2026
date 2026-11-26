"use client";

/**
 * Lighting and weather on the dark workshop: "lights" (a bright LED
 * overhead) and "rain", each on or off, together or apart. They live on
 * <html data-light="on" data-rain="on">, so CSS tokens switch without
 * touching components, and the choice is remembered per browser.
 * THEME_INIT_SCRIPT (in layout) applies a saved choice before first paint.
 * Shared by the header toggles, the 3D lighting and the chat's actions.
 */

import { useSyncExternalStore } from "react";
import {
  EFFECTS_STORAGE_KEY,
  effectsKey,
  parseEffects,
  THEME_COLORS,
  type Effects,
  type EffectsKey,
} from "./themeConfig";

export type { Effects, EffectsKey };

const listeners = new Set<() => void>();

function read(): Effects {
  const { light, rain } = document.documentElement.dataset;
  return { light: light === "on", rain: rain === "on" };
}

/** Turn lights and/or rain on or off; fields left out stay as they are. */
export function setEffects(change: Partial<Effects>) {
  const next = { ...read(), ...change };
  const root = document.documentElement;
  if (next.light) root.dataset.light = "on";
  else delete root.dataset.light;
  if (next.rain) root.dataset.rain = "on";
  else delete root.dataset.rain;
  const key = effectsKey(next);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[key]);
  try {
    localStorage.setItem(EFFECTS_STORAGE_KEY, key);
  } catch {
    // Private mode or blocked storage: the change still applies for this visit.
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** The live combination as a stable string ("dark", "light", "rain", "light rain"). Server render: dark. */
export const useEffectsKey = (): EffectsKey =>
  useSyncExternalStore(subscribe, () => effectsKey(read()), () => "dark");

/** The live effects as flags. */
export const useEffects = (): Effects => parseEffects(useEffectsKey());
