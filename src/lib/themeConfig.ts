/**
 * Lighting and weather, kept out of the "use client" store so the layout
 * (server) and the chat schema can import them too.
 *
 * The site is always the dark workshop underneath; two independent effects
 * sit on top: "lights" (a bright LED overhead) and "rain". Any combination
 * works, including both. On <html> they're data-light="on" and
 * data-rain="on"; CSS tokens switch from those, so components never branch.
 */

export type Effects = { light: boolean; rain: boolean };
export type EffectsKey = "dark" | "light" | "rain" | "light rain";

/** Old single-theme names, still accepted from the chat's `theme` action. */
export const THEMES = ["dark", "light", "rain"] as const;
export type Theme = (typeof THEMES)[number];

/** Stored as "dark", "light", "rain" or "light rain" (older values parse the same way). */
export const EFFECTS_STORAGE_KEY = "nc-theme";

export const effectsKey = ({ light, rain }: Effects): EffectsKey =>
  light && rain ? "light rain" : light ? "light" : rain ? "rain" : "dark";

export const parseEffects = (value: string | null | undefined): Effects => ({
  light: /\blight\b/.test(value ?? ""),
  rain: /\brain\b/.test(value ?? ""),
});

/** Browser UI colour (the page background) for each combination. */
export const THEME_COLORS: Record<EffectsKey, string> = {
  dark: "#0f1011",
  light: "#d9dee3",
  rain: "#1b2025",
  "light rain": "#c5ccd3",
};

/**
 * Runs in <head> before first paint: applies the saved effects so a visitor
 * never sees a flash of the wrong lighting. Static text, no user input.
 */
export const THEME_INIT_SCRIPT = `try{var v=localStorage.getItem(${JSON.stringify(EFFECTS_STORAGE_KEY)})||"",d=document.documentElement,l=/\\blight\\b/.test(v),r=/\\brain\\b/.test(v);if(l)d.dataset.light="on";if(r)d.dataset.rain="on";var m=document.querySelector('meta[name="theme-color"]');if(m&&(l||r))m.content=${JSON.stringify(THEME_COLORS)}[l&&r?"light rain":l?"light":"rain"]}catch(e){}`;
