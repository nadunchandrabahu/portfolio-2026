"use client";

import { useSyncExternalStore } from "react";

/**
 * Site theme: dark (the default), light ("drafting paper") or rain (a
 * lighter, gloomier dark). Lives on <html data-theme>, so CSS tokens switch
 * without touching components; the choice is remembered per browser.
 * THEME_INIT_SCRIPT (in layout) applies a saved choice before first paint.
 * Shared by the header selector, the 3D lighting and the chat's
 * `theme` action.
 */

import { THEME_COLORS, THEME_STORAGE_KEY, THEMES, type Theme } from "./themeConfig";

export { THEMES, type Theme };

const isTheme = (value: unknown): value is Theme => THEMES.includes(value as Theme);

const listeners = new Set<() => void>();

function current(): Theme {
  const value = document.documentElement.dataset.theme;
  return isTheme(value) ? value : "dark";
}

export function setTheme(theme: Theme) {
  if (!isTheme(theme)) return;
  const root = document.documentElement;
  if (theme === "dark") delete root.dataset.theme;
  else root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode or blocked storage: the theme still applies for this visit.
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** The live theme. The server render assumes dark (the init script corrects it before paint). */
export const useTheme = (): Theme => useSyncExternalStore(subscribe, current, () => "dark");
