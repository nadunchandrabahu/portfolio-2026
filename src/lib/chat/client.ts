"use client";

import { parseChatResponse, type ChatResponse } from "./schema";

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

export const NETWORK_ERROR =
  "The message didn't get through. Check your connection and try again, or email Nadun directly.";

/**
 * Send a message to this site's own /api/chat (the only endpoint the browser
 * talks to). Every route response, errors included, carries a `reply`, which
 * is shown as-is. The reply is re-validated here: the server already did, but
 * the actions it carries are about to move things on the page.
 */
export async function sendMessage(message: string, signal?: AbortSignal): Promise<ChatResponse> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: getSessionId(), message }),
      signal,
    });
    const data = parseChatResponse(await res.json().catch(() => null));
    return data ?? { reply: NETWORK_ERROR, actions: [], suggestions: [] };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return { reply: NETWORK_ERROR, actions: [], suggestions: [] };
  }
}
