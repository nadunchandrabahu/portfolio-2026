import { z } from "zod";
import { PROJECT_IDS } from "@/content/projects";
import { SECTION_IDS } from "@/content/site";

/**
 * The chat contract (CLAUDE.md 8.3), shared by the /api/chat route and the
 * browser. Ids come from the content files, so they can't drift.
 */

export const ProjectId = z.enum(PROJECT_IDS);
export const SectionId = z.enum(SECTION_IDS);

/** The chips a visitor sees when the panel first opens (CLAUDE.md 8.5). */
export const OPENING_SUGGESTIONS = [
  "How does a mechanical engineer end up in AI?",
  "Show me the NASA project",
  "Take the gearbox apart",
  "What's at the centre?",
] as const;

export const MESSAGE_MAX = 500;
export const REPLY_MAX = 1500;
export const MAX_ACTIONS = 4;
export const MAX_SUGGESTIONS = 3;
export const SUGGESTION_MAX = 80;

export const ChatRequest = z.object({
  sessionId: z.uuid(),
  message: z.string().trim().min(1).max(MESSAGE_MAX),
});
export type ChatRequest = z.infer<typeof ChatRequest>;

export const FocusTarget = z.enum(["overview", "sun", "engineering", "data", "ai", "build", "ring"]);

export const GearboxAction = z.discriminatedUnion("type", [
  z.object({ type: z.literal("focus"), target: FocusTarget }),
  z.object({ type: z.literal("explode"), amount: z.number().min(0).max(1) }),
  z.object({ type: z.literal("mode"), value: z.enum(["machined", "blueprint"]) }),
  z.object({ type: z.literal("spin"), rpm: z.number().min(0).max(60) }),
  z.object({ type: z.literal("highlightProject"), id: ProjectId }),
  z.object({ type: z.literal("scrollTo"), section: SectionId }),
  z.object({ type: z.literal("reset") }),
]);
export type GearboxAction = z.infer<typeof GearboxAction>;

export const ChatResponse = z.object({
  reply: z.string().max(REPLY_MAX),
  actions: z.array(GearboxAction).max(MAX_ACTIONS).default([]),
  suggestions: z.array(z.string().max(SUGGESTION_MAX)).max(MAX_SUGGESTIONS).default([]),
});
export type ChatResponse = z.infer<typeof ChatResponse>;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Clamp the numeric fields of an action-shaped object before validation. */
function clampAction(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const action = { ...(raw as Record<string, unknown>) };
  if (action.type === "explode" && typeof action.amount === "number" && Number.isFinite(action.amount)) {
    action.amount = clamp(action.amount, 0, 1);
  }
  if (action.type === "spin" && typeof action.rpm === "number" && Number.isFinite(action.rpm)) {
    action.rpm = clamp(action.rpm, 0, 60);
  }
  return action;
}

/**
 * Parse an untrusted reply (from n8n, or the route as seen by the browser).
 * Numbers are clamped first; each action is validated on its own and invalid
 * ones are dropped rather than failing the whole reply. Over-long text is
 * cut to fit. Returns null only when there's no usable reply text.
 */
export function parseChatResponse(raw: unknown): ChatResponse | null {
  if (typeof raw !== "object" || raw === null) return null;
  const data = raw as Record<string, unknown>;
  if (typeof data.reply !== "string" || data.reply.trim() === "") return null;

  const actions = (Array.isArray(data.actions) ? data.actions : [])
    .map((a) => GearboxAction.safeParse(clampAction(a)))
    .flatMap((r) => (r.success ? [r.data] : []))
    .slice(0, MAX_ACTIONS);

  const suggestions = (Array.isArray(data.suggestions) ? data.suggestions : [])
    .filter((s): s is string => typeof s === "string" && s.trim() !== "")
    .map((s) => s.trim().slice(0, SUGGESTION_MAX))
    .slice(0, MAX_SUGGESTIONS);

  return { reply: data.reply.slice(0, REPLY_MAX), actions, suggestions };
}
