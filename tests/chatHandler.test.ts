import { describe, expect, it, vi } from "vitest";
import { handleChat, MAX_BODY_BYTES, MESSAGES, secretFingerprint, type ChatDeps } from "@/lib/chat/handler";
import { ChatResponse } from "@/lib/chat/schema";
import { parseServerEnv } from "@/lib/env";
import type { Limiter } from "@/lib/ratelimit";

const sessionId = "4f8e2b1a-3c5d-4e6f-8a9b-0c1d2e3f4a5b";
const SECRET = "s".repeat(64);
const WEBHOOK = "https://n8n.example.com/webhook/portfolio";

const allow: Limiter = { check: async () => ({ ok: true }) };

function makeDeps(overrides: Partial<ChatDeps> & { envVars?: Record<string, string> } = {}) {
  const { envVars, ...rest } = overrides;
  const log = vi.fn();
  const deps: ChatDeps = {
    env: parseServerEnv(envVars ?? { CHAT_ENABLED: "true", CHAT_MOCK: "true" }),
    isBot: async () => false,
    limiter: allow,
    fetch: vi.fn(async () => Response.json({ reply: "from n8n" })),
    log,
    ...rest,
  };
  return { deps, log };
}

const LIVE_ENV = {
  CHAT_ENABLED: "true",
  CHAT_MOCK: "false",
  N8N_WEBHOOK_URL: WEBHOOK,
  N8N_WEBHOOK_SECRET: SECRET,
  UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "token",
};

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://nadun.dev/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json", host: "nadun.dev", origin: "https://nadun.dev", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const valid = { sessionId, message: "Show me the NASA project" };

async function read(res: Response) {
  return { status: res.status, body: ChatResponse.parse(await res.json()), cache: res.headers.get("cache-control") };
}

describe("handleChat", () => {
  it("blocks bots with 403", async () => {
    const { deps } = makeDeps({ isBot: async () => true });
    const res = await read(await handleChat(request(valid), deps));
    expect(res).toMatchObject({ status: 403, body: { reply: MESSAGES.forbidden } });
  });

  it.each([
    ["missing", { origin: "" }],
    ["another site", { origin: "https://evil.example" }],
    ["malformed", { origin: "not a url" }],
  ])("rejects a %s Origin with 403", async (_, headers) => {
    const { deps } = makeDeps();
    const req = request(valid, headers);
    if (headers.origin === "") req.headers.delete("origin");
    expect((await handleChat(req, deps)).status).toBe(403);
  });

  it("says when the daily limit is the one that's been reached", async () => {
    const { deps } = makeDeps({ limiter: { check: async () => ({ ok: false, limit: "day" }) } });
    const res = await read(await handleChat(request(valid), deps));
    expect(res).toMatchObject({ status: 429, body: { reply: MESSAGES.dailyLimit } });
    expect(MESSAGES.dailyLimit).not.toMatch(/minute/);
  });

  it("rate limits with 429 and a friendly reply", async () => {
    const { deps } = makeDeps({ limiter: { check: async () => ({ ok: false, limit: "minute" }) } });
    const res = await read(await handleChat(request(valid), deps));
    expect(res).toMatchObject({ status: 429, body: { reply: MESSAGES.rateLimited } });
  });

  it.each([
    ["oversized body", "x".repeat(MAX_BODY_BYTES + 1)],
    ["invalid JSON", "{nope"],
    ["schema mismatch", { sessionId: "nope", message: "hi" }],
    ["empty message", { sessionId, message: "  " }],
    ["over-long message", { sessionId, message: "x".repeat(501) }],
  ])("rejects %s with 400", async (_, body) => {
    const { deps } = makeDeps();
    const res = await read(await handleChat(request(body), deps));
    expect(res).toMatchObject({ status: 400, body: { reply: MESSAGES.badRequest } });
  });

  it("answers with the offline reply when the kill switch is off", async () => {
    const { deps } = makeDeps({ envVars: { CHAT_ENABLED: "false" } });
    const res = await read(await handleChat(request(valid), deps));
    expect(res).toMatchObject({ status: 200, body: { reply: MESSAGES.offline, actions: [] } });
    expect(deps.fetch).not.toHaveBeenCalled();
  });

  it("serves mock replies without calling n8n", async () => {
    const { deps } = makeDeps();
    const res = await read(await handleChat(request(valid), deps));
    expect(res.status).toBe(200);
    expect(res.body.actions).toContainEqual({ type: "highlightProject", id: "field-shift" });
    expect(res.cache).toBe("no-store");
    expect(deps.fetch).not.toHaveBeenCalled();
  });

  describe("live (n8n)", () => {
    it("forwards only sessionId, message and humour, with the secret header", async () => {
      const fetchMock = vi.fn(async () =>
        Response.json({ reply: "Hello", actions: [{ type: "focus", target: "ai" }, { type: "hack" }] }),
      );
      const { deps } = makeDeps({ envVars: LIVE_ENV, fetch: fetchMock });
      const res = await read(await handleChat(request({ ...valid, extra: "ignored" }), deps));

      expect(res.body).toEqual({ reply: "Hello", actions: [{ type: "focus", target: "ai" }], suggestions: [] });
      const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
      expect(url).toBe(WEBHOOK);
      expect(init.method).toBe("POST");
      expect((init.headers as Record<string, string>)["X-Portfolio-Secret"]).toBe(SECRET);
      expect(JSON.parse(init.body as string)).toEqual({ ...valid, humour: 25 });
      expect(init.signal).toBeInstanceOf(AbortSignal);
    });

    it("passes the visitor's humour setting on to n8n", async () => {
      const fetchMock = vi.fn(async () => Response.json({ reply: "Hello" }));
      const { deps } = makeDeps({ envVars: LIVE_ENV, fetch: fetchMock });
      await handleChat(request({ ...valid, humour: 80 }), deps);
      const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
      expect(JSON.parse(init.body as string)).toEqual({ ...valid, humour: 80 });
    });

    it.each([
      ["an error status", async () => new Response("internal details", { status: 500 })],
      ["an invalid body", async () => Response.json({ nope: true })],
      ["a network error", async () => Promise.reject(new TypeError("fetch failed"))],
      ["a timeout", async () => Promise.reject(new DOMException("timed out", "TimeoutError"))],
    ])("falls back politely on %s, without leaking it", async (_, impl) => {
      const { deps, log } = makeDeps({ envVars: LIVE_ENV, fetch: vi.fn(impl) as unknown as typeof fetch });
      const res = await read(await handleChat(request(valid), deps));
      expect(res).toMatchObject({ status: 200, body: { reply: MESSAGES.upstream, actions: [] } });
      expect(JSON.stringify(res.body)).not.toContain("internal details");
      // Logged, but never with the visitor's message.
      expect(log).toHaveBeenCalled();
      expect(JSON.stringify(log.mock.calls)).not.toContain(valid.message);
    });

    const good = { reply: "Field Shift…", actions: [{ type: "highlightProject", id: "field-shift" }] };
    it.each([
      ["a one-item array", [good]],
      ["the AI Agent's { output }", { output: good }],
      ["a JSON string", JSON.stringify(good)],
      ["a fenced JSON string in { output }", { output: "```json\n" + JSON.stringify(good) + "\n```" }],
      ["an array of { output }", [{ output: good }]],
    ])("accepts n8n's reply as %s", async (_, payload) => {
      const fetchMock = vi.fn(async () => Response.json(payload));
      const { deps } = makeDeps({ envVars: LIVE_ENV, fetch: fetchMock });
      const res = await read(await handleChat(request(valid), deps));
      expect(res.body).toEqual({ ...good, suggestions: [] });
    });

    it("logs the shape (keys, not values) of an unusable reply", async () => {
      const fetchMock = vi.fn(async () => Response.json([{ text: "secret-ish value" }, {}]));
      const { deps, log } = makeDeps({ envVars: LIVE_ENV, fetch: fetchMock });
      await handleChat(request(valid), deps);
      expect(log).toHaveBeenCalledWith("upstream_invalid", { shape: "array(2) of object{text}" });
      expect(JSON.stringify(log.mock.calls)).not.toContain("secret-ish value");
    });

    it("logs auth failures with the secret's fingerprint, never the secret", async () => {
      const fetchMock = vi.fn(async () => new Response("Authorization data is wrong!", { status: 403 }));
      const { deps, log } = makeDeps({ envVars: LIVE_ENV, fetch: fetchMock });
      await handleChat(request(valid), deps);
      expect(log).toHaveBeenCalledWith("upstream_status", {
        status: 403,
        host: "n8n.example.com",
        secretFingerprint: secretFingerprint(SECRET),
        secretLength: 64,
        body: "Authorization data is wrong!",
      });
      expect(secretFingerprint(SECRET)).toMatch(/^[0-9a-f]{8}$/);
      expect(JSON.stringify(log.mock.calls)).not.toContain(SECRET);
    });

    it("logs a non-JSON reply by content type and length only", async () => {
      const fetchMock = vi.fn(async () => new Response("Workflow was started", { headers: { "content-type": "text/html" } }));
      const { deps, log } = makeDeps({ envVars: LIVE_ENV, fetch: fetchMock });
      const res = await read(await handleChat(request(valid), deps));
      expect(res.body.reply).toBe(MESSAGES.upstream);
      expect(log).toHaveBeenCalledWith("upstream_not_json", { contentType: "text/html", length: 20 });
    });
  });
});
