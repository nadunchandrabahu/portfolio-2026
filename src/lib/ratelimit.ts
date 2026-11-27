import "server-only";
import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { ServerEnv } from "./env";

/**
 * Chat rate limits (CLAUDE.md 8.4): a sliding window of 8 requests a minute
 * and 100 a day, per visitor (raised from 60 on 2026-11-27).
 * The minute window is checked first, and a message only counts towards the
 * day once it gets through, so a quick burst can't burn the daily allowance. Visitors are keyed by a hash of their IP, so
 * Redis never holds a raw address.
 *
 * With Upstash configured (required for the live chat path, see env.ts) the
 * limits are shared across all serverless instances. Without it (local dev,
 * mock mode) an in-memory limiter applies the same windows per process.
 */

export const LIMITS = { perMinute: 8, perDay: 100 } as const;
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Which limit refused the message, so the visitor gets the right explanation. */
export type LimitResult = { ok: true } | { ok: false; limit: "minute" | "day" };
export type Limiter = { check(ip: string): Promise<LimitResult> };

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
        return { ok: false, limit: lastMinute >= LIMITS.perMinute ? "minute" : "day" };
      }
      recent.push(t);
      hits.set(key, recent);
      // Keep the map from growing without bound on a long-lived dev server.
      if (hits.size > 5000) hits.clear();
      return { ok: true };
    },
  };
}

type Window = { limit(key: string): Promise<{ success: boolean }> };

/**
 * Two windows, checked in order: the minute first, and the day only for
 * messages the minute lets through. (Checking both at once counted refused
 * messages against the daily total.)
 */
export function twoWindowLimiter(minute: Window, day: Window): Limiter {
  return {
    async check(ip) {
      const key = hashIp(ip);
      if (!(await minute.limit(key)).success) return { ok: false, limit: "minute" };
      if (!(await day.limit(key)).success) return { ok: false, limit: "day" };
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
  return twoWindowLimiter(minute, day);
}

let limiter: Limiter | undefined;

export function getLimiter(env: ServerEnv): Limiter {
  limiter ??=
    env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
      ? upstashLimiter(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN)
      : memoryLimiter();
  return limiter;
}
