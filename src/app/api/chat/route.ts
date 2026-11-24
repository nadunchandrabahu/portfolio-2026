import { checkBotId } from "botid/server";
import { handleChat, MESSAGES } from "@/lib/chat/handler";
import { getServerEnv } from "@/lib/env";
import { getLimiter } from "@/lib/ratelimit";

/**
 * The browser's only way to the chat assistant (CLAUDE.md 8.4, 9). The n8n
 * URL, its secret and the Upstash token stay on the server. Only POST is
 * exported, so Next.js answers every other method with 405.
 *
 * Runs on the Node.js runtime, the default. (CLAUDE.md asks for an explicit
 * `export const runtime = "nodejs"`, but Next.js 16 rejects that segment
 * config when Cache Components is on.)
 */

export async function POST(request: Request): Promise<Response> {
  let env;
  try {
    env = getServerEnv();
  } catch (error) {
    // The message names the bad variables, never their values.
    console.error("[chat] env", error instanceof Error ? error.message : "invalid");
    return Response.json(
      { reply: MESSAGES.offline, actions: [], suggestions: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return handleChat(request, {
    env,
    // BotID only works on Vercel (it needs the deployment's OIDC token). Off
    // Vercel (local dev, `next start` for tests) the other checks still apply.
    isBot: async () => (process.env.VERCEL ? (await checkBotId()).isBot : false),
    limiter: getLimiter(env),
    fetch,
    log: (event, detail) => console.error(`[chat] ${event}`, detail ?? ""),
  });
}
