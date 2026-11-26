"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether the chat panel is open, shared by every "Ask AI Nadun" button
 * and the lazily loaded panel. A tiny external store rather than zustand, so
 * the launch buttons add next to nothing to the initial bundle.
 */

let open = false;
let opener: HTMLElement | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

/**
 * Phones only open the keyboard for focus that happens inside the tap itself
 * (iOS is strict about this), but the panel mounts a moment later, after its
 * code has loaded. So focus a stand-in text field during the tap; the
 * keyboard comes up, and stays up when the panel's own text box takes focus.
 */
function summonKeyboard() {
  if (!window.matchMedia("(max-width: 1023.98px) and (pointer: coarse)").matches) return;
  const proxy = document.createElement("input");
  proxy.type = "text";
  proxy.tabIndex = -1;
  proxy.setAttribute("aria-label", "Chat message");
  // 16px so iOS doesn't zoom; parked in view (off-screen fields can be ignored).
  proxy.style.cssText =
    "position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0;font-size:16px;border:0;padding:0;pointer-events:none";
  document.body.append(proxy);
  proxy.addEventListener("blur", () => proxy.remove(), { once: true });
  proxy.focus({ preventScroll: true });
  // If the panel never takes over (it failed to load), let the keyboard go.
  window.setTimeout(() => proxy.isConnected && proxy.blur(), 10_000);
}

export function openChat(from?: HTMLElement | null) {
  opener = from ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  if (open) return;
  summonKeyboard();
  open = true;
  emit();
}

export function closeChat() {
  if (!open) return;
  open = false;
  emit();
  // Return focus to whatever opened it, once the panel has gone and the
  // opener is visible again.
  const target = opener;
  requestAnimationFrame(() => target?.isConnected && target.focus({ preventScroll: true }));
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useChatOpen = () =>
  useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  );
