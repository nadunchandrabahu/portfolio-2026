import "server-only";
import { z } from "zod";

/** Treat empty strings (e.g. `FOO=` in a .env file) as unset. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const flag = z.preprocess(
  (value) => (value === "" || value === undefined ? "false" : value),
  z.enum(["true", "false"]).transform((value) => value === "true"),
);

export const ServerEnvSchema = z
  .object({
    CHAT_ENABLED: flag,
    CHAT_MOCK: flag,
    N8N_WEBHOOK_URL: optional(z.url({ protocol: /^https?$/ })),
    // `openssl rand -hex 32` gives 64 characters (CHATBOT_SETUP.md step 3.2).
    N8N_WEBHOOK_SECRET: optional(z.string().min(32)),
    UPSTASH_REDIS_REST_URL: optional(z.url({ protocol: /^https$/ })),
    UPSTASH_REDIS_REST_TOKEN: optional(z.string().min(1)),
  })
  .superRefine((env, ctx) => {
    // The live chat path needs the upstream webhook and the rate limiter.
    if (!env.CHAT_ENABLED || env.CHAT_MOCK) return;
    const required = [
      "N8N_WEBHOOK_URL",
      "N8N_WEBHOOK_SECRET",
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
    ] as const;
    for (const key of required) {
      if (env[key] === undefined) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "required when CHAT_ENABLED=true and CHAT_MOCK=false",
        });
      }
    }
  });

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

/**
 * Parse an env source. Errors name the variables only and never include
 * their values, so they are safe to log.
 */
export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = ServerEnvSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server environment: ${problems}`);
  }
  return result.data;
}

let cached: ServerEnv | undefined;

/** Read and validate server env once, on first use (not at import time). */
export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}
