import "server-only";
import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { ServerEnv } from "./env";

/**
 * Chat rate limits (CLAUDE.md 8.4): a sliding window of 8 requests a minute
 * and 60 a day, per visitor. Visitors are keyed by a hash of their IP, so
 * Redis never holds a raw address.
 *
 * With Upstash configured (required for the live chat path, see env.ts) the
 * limits are shared across all serverless instances. Without it (local dev,
 * mock mode) an in-memory limiter applies the same windows per process.
 */

export const LIMITS = { perMinute: 8, perDay: 60 } as const;
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export type Limiter = { check(ip: string): Promise<{ ok: boolean }> };

export function hashIp(ip: string): string {
  return createHash("sha256").update(`portfolio-chat:${ip}`).digest("hex").slice(0, 32);
}

/** Best-effort client IP from the proxy headers Vercel sets. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}

export function memoryLimiter(now: () => number = Date.now): Limiter {
  const hits = new Map<string, number[]>();
  return {
    async check(ip) {
      const key = hashIp(ip);
      const t = now();
      const recent = (hits.get(key) ?? []).filter((at) => t - at < DAY);
      const lastMinute = recent.filter((at) => t - at < MINUTE).length;
      if (lastMinute >= LIMITS.perMinute || recent.length >= LIMITS.perDay) {
        hits.set(key, recent);
        return { ok: false };
      }
      recent.push(t);
      hits.set(key, recent);
      // Keep the map from growing without bound on a long-lived dev server.
      if (hits.size > 5000) hits.clear();
      return { ok: true };
    },
  };
}

function upstashLimiter(url: string, token: string): Limiter {
  const redis = new Redis({ url, token });
  const minute = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(LIMITS.perMinute, "1 m"),
    prefix: "chat:minute",
  });
  const day = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(LIMITS.perDay, "1 d"),
    prefix: "chat:day",
  });
  return {
    async check(ip) {
      const key = hashIp(ip);
      const [m, d] = await Promise.all([minute.limit(key), day.limit(key)]);
      return { ok: m.success && d.success };
    },
  };
}

let limiter: Limiter | undefined;

export function getLimiter(env: ServerEnv): Limiter {
  limiter ??=
    env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
      ? upstashLimiter(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN)
      : memoryLimiter();
  return limiter;
}
