"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether the chat panel is open, shared by every "Ask the workshop" button
 * and the lazily loaded panel. A tiny external store rather than zustand, so
 * the launch buttons add next to nothing to the initial bundle.
 */

let open = false;
let opener: HTMLElement | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export function openChat(from?: HTMLElement | null) {
  opener = from ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  if (open) return;
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
