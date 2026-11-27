"use client";

import { useSyncExternalStore } from "react";
import { HUMOUR_DEFAULT, Humour, parseChatResponse, type ChatResponse } from "./schema";

/** Browser side of the chat: a per-tab session id and the one request it makes. */

const SESSION_KEY = "workshop-chat-session";
let fallbackSession: string | null = null;

/** One id per browser tab (sessionStorage, no cookies). In-memory if storage is blocked. */
export function getSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    fallbackSession ??= crypto.randomUUID();
    return fallbackSession;
  }
}

const HUMOUR_KEY = "nc-chat-humour";
let humourSetting: number | null = null;
const humourListeners = new Set<() => void>();

/** The humour slider's setting, remembered in this browser (default 25%). */
export function getHumour(): number {
  if (humourSetting === null) {
    let stored: unknown = null;
    try {
      const raw = window.localStorage.getItem(HUMOUR_KEY);
      stored = raw === null ? null : Number(raw);
    } catch {
      // Storage blocked: fall back to the default.
    }
    const parsed = Humour.safeParse(stored);
    humourSetting = parsed.success ? parsed.data : HUMOUR_DEFAULT;
  }
  return humourSetting;
}

/** Set from the slider, or from a reply when the visitor asked the bot to change it. */
export function setHumour(value: number): void {
  const parsed = Humour.safeParse(value);
  if (!parsed.success || parsed.data === humourSetting) return;
  humourSetting = parsed.data;
  try {
    window.localStorage.setItem(HUMOUR_KEY, String(parsed.data));
  } catch {
    // Storage blocked: the setting lasts for this page only.
  }
  humourListeners.forEach((listener) => listener());
}

/** The current humour setting, kept in step wherever it changes. */
export function useHumour(): number {
  return useSyncExternalStore(
    (onChange) => {
      humourListeners.add(onChange);
      return () => humourListeners.delete(onChange);
    },
    getHumour,
    () => HUMOUR_DEFAULT,
  );
}

export const NETWORK_ERROR =
  "The message didn't get through. Check your connection and try again, or email Nadun directly.";

/**
 * Send a message to this site's own /api/chat (the only endpoint the browser
 * talks to). Every route response, errors included, carries a `reply`, which
 * is shown as-is. The reply is re-validated here: the server already did, but
 * the actions it carries are about to move things on the page.
 */
export async function sendMessage(message: string, humour: number, signal?: AbortSignal): Promise<ChatResponse> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: getSessionId(), message, humour }),
      signal,
    });
    const data = parseChatResponse(await res.json().catch(() => null));
    return data ?? { reply: NETWORK_ERROR, actions: [], suggestions: [] };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return { reply: NETWORK_ERROR, actions: [], suggestions: [] };
  }
}
