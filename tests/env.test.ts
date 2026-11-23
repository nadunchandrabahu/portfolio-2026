import { describe, expect, it } from "vitest";
import { parseServerEnv } from "@/lib/env";

const SECRET = "a".repeat(64);

describe("parseServerEnv", () => {
  it("defaults both flags to false when unset or empty", () => {
    expect(parseServerEnv({})).toMatchObject({ CHAT_ENABLED: false, CHAT_MOCK: false });
    expect(parseServerEnv({ CHAT_ENABLED: "", CHAT_MOCK: "" })).toMatchObject({
      CHAT_ENABLED: false,
      CHAT_MOCK: false,
    });
  });

  it("treats empty strings as unset", () => {
    expect(parseServerEnv({ N8N_WEBHOOK_URL: "" }).N8N_WEBHOOK_URL).toBeUndefined();
  });

  it("allows mock mode without upstream credentials", () => {
    const env = parseServerEnv({ CHAT_ENABLED: "true", CHAT_MOCK: "true" });
    expect(env).toMatchObject({ CHAT_ENABLED: true, CHAT_MOCK: true });
  });

  it("requires every upstream variable for live chat", () => {
    expect(() => parseServerEnv({ CHAT_ENABLED: "true", CHAT_MOCK: "false" })).toThrow(
      /N8N_WEBHOOK_URL.*N8N_WEBHOOK_SECRET.*UPSTASH_REDIS_REST_URL.*UPSTASH_REDIS_REST_TOKEN/,
    );
  });

  it("accepts a complete live config", () => {
    const env = parseServerEnv({
      CHAT_ENABLED: "true",
      CHAT_MOCK: "false",
      N8N_WEBHOOK_URL: "https://n8n.example.com/webhook/abc",
      N8N_WEBHOOK_SECRET: SECRET,
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "token",
    });
    expect(env.CHAT_ENABLED).toBe(true);
  });

  it("rejects flags that are not true/false", () => {
    expect(() => parseServerEnv({ CHAT_ENABLED: "yes" })).toThrow(/CHAT_ENABLED/);
  });

  it("rejects a short secret and a non-https Upstash URL", () => {
    expect(() => parseServerEnv({ N8N_WEBHOOK_SECRET: "short" })).toThrow(/N8N_WEBHOOK_SECRET/);
    expect(() => parseServerEnv({ UPSTASH_REDIS_REST_URL: "http://example.com" })).toThrow(
      /UPSTASH_REDIS_REST_URL/,
    );
  });

  it("never puts values in the error message", () => {
    const leaky = "super-secret-value";
    expect(() => parseServerEnv({ N8N_WEBHOOK_SECRET: leaky })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining(leaky) }),
    );
  });
});
