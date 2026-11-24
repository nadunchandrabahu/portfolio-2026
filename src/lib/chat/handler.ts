import "server-only";
import type { ServerEnv } from "@/lib/env";
import { clientIp, type Limiter } from "@/lib/ratelimit";
import { mockReply } from "./mock";
import { ChatRequest, parseChatResponse, type ChatResponse } from "./schema";

/**
 * POST /api/chat (CLAUDE.md 8.4), with its dependencies passed in so the
 * whole pipeline is unit-testable. Order: bot check, same-origin check, rate
 * limit, body size and schema, kill switch, then mock or the n8n upstream.
 *
 * Every response is the ChatResponse shape (so the browser can always show
 * `reply`), uncached, and never echoes upstream errors. Message text is
 * never logged.
 */

export type ChatDeps = {
  env: ServerEnv;
  isBot(): Promise<boolean>;
  limiter: Limiter;
  fetch: typeof fetch;
  log(event: string, detail?: Record<string, string | number>): void;
};

export const MAX_BODY_BYTES = 2048;
export const UPSTREAM_TIMEOUT_MS = 25_000;

export const MESSAGES = {
  forbidden: "This request couldn't be accepted.",
  rateLimited: "You're sending messages faster than the workshop can answer. Give it a minute and try again.",
  badRequest: "That message couldn't be read. Keep it to 500 characters of plain text.",
  offline:
    "The workshop assistant is offline right now. You can email Nadun directly: the address is in the Contact section.",
  upstream:
    "The workshop assistant is having a moment. You can email Nadun directly at the address below.",
} as const;

const textReply = (reply: string): ChatResponse => ({ reply, actions: [], suggestions: [] });

const respond = (body: ChatResponse, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Browsers send Origin on every cross-origin-capable POST; it must be this site. */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function handleChat(request: Request, deps: ChatDeps): Promise<Response> {
  if (await deps.isBot()) return respond(textReply(MESSAGES.forbidden), 403);
  if (!isSameOrigin(request)) return respond(textReply(MESSAGES.forbidden), 403);

  const { ok } = await deps.limiter.check(clientIp(request.headers));
  if (!ok) return respond(textReply(MESSAGES.rateLimited), 429);

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return respond(textReply(MESSAGES.badRequest), 400);
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return respond(textReply(MESSAGES.badRequest), 400);
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return respond(textReply(MESSAGES.badRequest), 400);
  }
  const parsed = ChatRequest.safeParse(body);
  if (!parsed.success) return respond(textReply(MESSAGES.badRequest), 400);

  // Kill switch.
  if (!deps.env.CHAT_ENABLED) return respond(textReply(MESSAGES.offline));
  if (deps.env.CHAT_MOCK) return respond(mockReply(parsed.data.message));

  const url = deps.env.N8N_WEBHOOK_URL;
  const secret = deps.env.N8N_WEBHOOK_SECRET;
  if (!url || !secret) {
    deps.log("misconfigured");
    return respond(textReply(MESSAGES.upstream));
  }

  try {
    const upstream = await deps.fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Portfolio-Secret": secret },
      body: JSON.stringify({ sessionId: parsed.data.sessionId, message: parsed.data.message }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!upstream.ok) {
      deps.log("upstream_status", { status: upstream.status });
      return respond(textReply(MESSAGES.upstream));
    }
    const reply = parseChatResponse(await upstream.json());
    if (!reply) {
      deps.log("upstream_invalid");
      return respond(textReply(MESSAGES.upstream));
    }
    return respond(reply);
  } catch (error) {
    deps.log("upstream_error", { kind: error instanceof Error ? error.name : "unknown" });
    return respond(textReply(MESSAGES.upstream));
  }
}
