import { z } from "zod";
import { PROJECT_IDS } from "@/content/projects";
import { SECTION_IDS } from "@/content/site";
import { THEMES } from "@/lib/themeConfig";

// No JIT-compiled validators: zod probes for that with `Function("")`, which
// the site's CSP (no 'unsafe-eval') reports as a violation.
z.config({ jitless: true });

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

/**
 * The chat panel's humour slider: 0 to 100 in steps of 5. Up to 25 the bot
 * answers exactly as it always has; above that it adds dry one-liners.
 */
export const HUMOUR_DEFAULT = 25;
export const HUMOUR_PLAIN_MAX = 25;
export const HUMOUR_STEP = 5;
export const Humour = z.number().int().min(0).max(100).multipleOf(HUMOUR_STEP);

export const ChatRequest = z.object({
  sessionId: z.uuid(),
  message: z.string().trim().min(1).max(MESSAGE_MAX),
  /** Optional, so older open tabs keep working; they get the default. */
  humour: Humour.default(HUMOUR_DEFAULT),
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
  // Lighting and weather on the page (not the gearbox, but the same action list).
  z.object({ type: z.literal("lights"), on: z.boolean() }),
  z.object({ type: z.literal("rain"), on: z.boolean() }),
  // Older single-theme form, still accepted: dark = both off, light = lights only, rain = rain only.
  z.object({ type: z.literal("theme"), value: z.enum(THEMES) }),
]);
export type GearboxAction = z.infer<typeof GearboxAction>;

export const ChatResponse = z.object({
  reply: z.string().max(REPLY_MAX),
  actions: z.array(GearboxAction).max(MAX_ACTIONS).default([]),
  suggestions: z.array(z.string().max(SUGGESTION_MAX)).max(MAX_SUGGESTIONS).default([]),
  /**
   * The humour setting the reply was written at. Normally the one the visitor
   * sent; different when they asked the bot to change it ("be funnier", "set
   * humour to 80"), and then the slider follows.
   */
  humour: Humour.optional(),
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

  // Snap any number to the slider's 5% steps and 0-100 range; drop anything else.
  const humour =
    typeof data.humour === "number" && Number.isFinite(data.humour)
      ? clamp(Math.round(data.humour / HUMOUR_STEP) * HUMOUR_STEP, 0, 100)
      : undefined;

  return {
    reply: data.reply.slice(0, REPLY_MAX),
    actions,
    suggestions,
    ...(humour === undefined ? {} : { humour }),
  };
}
