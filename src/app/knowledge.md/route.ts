import { buildKnowledge } from "@/lib/knowledge";

/**
 * /knowledge.md: the assistant's fact sheet (CLAUDE.md 8.7). The n8n workflow
 * fetches this, so the bot always matches the live site. It reads no request
 * data, so with Cache Components it is prerendered at build time.
 */
export async function GET(): Promise<Response> {
  return new Response(buildKnowledge(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
