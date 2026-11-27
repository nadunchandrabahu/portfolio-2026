import "server-only";
import { createHash } from "node:crypto";
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
    "Digital Nadun is offline right now. You can email Nadun directly: the address is in the Contact section.",
  upstream:
    "Digital Nadun is having a moment. You can email Nadun directly: the address is in the Contact section.",
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

/**
 * n8n's reply shape depends on how the workflow's last nodes are set up: a
 * one-item array ("All Incoming Items"), the AI Agent's raw `{ output: … }`
 * (no Sanitise node), or the JSON as a string, sometimes in a code fence.
 * Unwrap those to the plain reply object. The result is still validated
 * by parseChatResponse.
 */
export function unwrapUpstream(raw: unknown, depth = 0): unknown {
  if (depth > 4) return raw;
  if (typeof raw === "string") {
    const text = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
    try {
      return unwrapUpstream(JSON.parse(text), depth + 1);
    } catch {
      return raw;
    }
  }
  if (Array.isArray(raw)) return raw.length === 1 ? unwrapUpstream(raw[0], depth + 1) : raw;
  if (typeof raw === "object" && raw !== null && !("reply" in raw)) {
    const wrapped = raw as Record<string, unknown>;
    for (const key of ["output", "json"]) {
      if (key in wrapped) return unwrapUpstream(wrapped[key], depth + 1);
    }
  }
  return raw;
}

/**
 * A short, one-way fingerprint of the secret, so the logs can show whether
 * the deployed value matches yours without revealing it. Compare with
 * `printf %s "$SECRET" | sha256sum | cut -c1-8` in your own terminal.
 */
export function secretFingerprint(secret: string): string {
  return createHash("sha256").update(secret).digest("hex").slice(0, 8);
}

/**
 * Extra log detail for auth and routing failures (401/403/404) only: which
 * host was called, the secret's fingerprint and length, and the start of
 * n8n's error text. Those responses come before the workflow runs, so they
 * can't contain the visitor's message.
 */
async function authDiagnostics(
  upstream: Response,
  url: string,
  secret: string,
): Promise<Record<string, string | number>> {
  if (![401, 403, 404].includes(upstream.status)) return {};
  const body = (await upstream.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 120);
  return {
    host: new URL(url).host,
    secretFingerprint: secretFingerprint(secret),
    secretLength: secret.length,
    body,
  };
}

/** The outline of an unusable reply, for the logs: types and key names, never values. */
export function describeShape(raw: unknown): string {
  if (raw === null) return "null";
  if (Array.isArray(raw)) return `array(${raw.length})${raw.length ? ` of ${describeShape(raw[0])}` : ""}`;
  if (typeof raw === "object") {
    const keys = Object.keys(raw)
      .slice(0, 8)
      .map((key) => key.replace(/[^\w-]/g, "").slice(0, 32));
    return `object{${keys.join(",")}}`;
  }
  return typeof raw;
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
  if (deps.env.CHAT_MOCK) return respond(mockReply(parsed.data.message, parsed.data.humour));

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
      body: JSON.stringify({
        sessionId: parsed.data.sessionId,
        message: parsed.data.message,
        humour: parsed.data.humour,
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!upstream.ok) {
      deps.log("upstream_status", { status: upstream.status, ...(await authDiagnostics(upstream, url, secret)) });
      return respond(textReply(MESSAGES.upstream));
    }
    const text = await upstream.text();
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      deps.log("upstream_not_json", {
        contentType: (upstream.headers.get("content-type") ?? "none").slice(0, 60),
        length: text.length,
      });
      return respond(textReply(MESSAGES.upstream));
    }
    const reply = parseChatResponse(unwrapUpstream(raw));
    if (!reply) {
      deps.log("upstream_invalid", { shape: describeShape(raw) });
      return respond(textReply(MESSAGES.upstream));
    }
    return respond(reply);
  } catch (error) {
    deps.log("upstream_error", { kind: error instanceof Error ? error.name : "unknown" });
    return respond(textReply(MESSAGES.upstream));
  }
}
