/**
 * Theme names and the pre-paint script, kept out of the "use client" theme
 * store so the layout (server) and the chat schema can import them too.
 */

export const THEMES = ["dark", "light", "rain"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "nc-theme";

/** Browser UI colour per theme (the page background). */
export const THEME_COLORS: Record<Theme, string> = {
  dark: "#0f1011",
  light: "#f3f0e9",
  rain: "#1b2025",
};

/**
 * Runs in <head> before first paint: applies a saved theme so a light or
 * rain visitor never sees a dark flash. Static text, no user input.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="rain"){document.documentElement.dataset.theme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.content=${JSON.stringify(THEME_COLORS)}[t]}}catch(e){}`;
