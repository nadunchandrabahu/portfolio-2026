import { describe, expect, it } from "vitest";
import { ChatRequest, ChatResponse, GearboxAction, parseChatResponse } from "@/lib/chat/schema";

const sessionId = "4f8e2b1a-3c5d-4e6f-8a9b-0c1d2e3f4a5b";

describe("ChatRequest", () => {
  it("accepts a uuid session and a trimmed message", () => {
    expect(ChatRequest.parse({ sessionId, message: "  hello  " })).toEqual({ sessionId, message: "hello" });
  });

  it.each([
    ["empty message", { sessionId, message: "   " }],
    ["message over 500 chars", { sessionId, message: "x".repeat(501) }],
    ["non-uuid session", { sessionId: "abc", message: "hi" }],
    ["missing message", { sessionId }],
    ["wrong types", { sessionId: 1, message: ["hi"] }],
  ])("rejects %s", (_, input) => {
    expect(ChatRequest.safeParse(input).success).toBe(false);
  });
});

describe("GearboxAction", () => {
  it("accepts every action type", () => {
    const valid = [
      { type: "focus", target: "ai" },
      { type: "explode", amount: 0.5 },
      { type: "mode", value: "blueprint" },
      { type: "spin", rpm: 30 },
      { type: "highlightProject", id: "field-shift" },
      { type: "scrollTo", section: "contact" },
      { type: "reset" },
    ];
    for (const action of valid) expect(GearboxAction.safeParse(action).success).toBe(true);
  });

  it.each([
    { type: "navigate", url: "https://evil.example" },
    { type: "focus", target: "kitchen" },
    { type: "highlightProject", id: "not-a-project" },
    { type: "scrollTo", section: "footer" },
    { type: "explode", amount: "1" },
    { target: "ai" },
    null,
  ])("rejects %j", (action) => {
    expect(GearboxAction.safeParse(action).success).toBe(false);
  });
});

describe("parseChatResponse", () => {
  it("passes a valid reply through", () => {
    const reply = { reply: "Hi", actions: [{ type: "focus", target: "sun" }], suggestions: ["More?"] };
    expect(parseChatResponse(reply)).toEqual(reply);
    expect(ChatResponse.safeParse(parseChatResponse(reply)).success).toBe(true);
  });

  it("clamps numbers before validating", () => {
    const parsed = parseChatResponse({
      reply: "ok",
      actions: [
        { type: "explode", amount: 7 },
        { type: "spin", rpm: -40 },
      ],
    });
    expect(parsed?.actions).toEqual([
      { type: "explode", amount: 1 },
      { type: "spin", rpm: 0 },
    ]);
  });

  it("drops invalid actions one by one instead of failing the reply", () => {
    const parsed = parseChatResponse({
      reply: "ok",
      actions: [
        { type: "navigate", url: "https://evil.example" },
        { type: "focus", target: "ai" },
        { type: "spin", rpm: Number.NaN },
        "run code",
        { type: "scrollTo", section: "contact" },
      ],
    });
    expect(parsed?.actions).toEqual([
      { type: "focus", target: "ai" },
      { type: "scrollTo", section: "contact" },
    ]);
  });

  it("caps actions at 4 and suggestions at 3, and trims long text", () => {
    const parsed = parseChatResponse({
      reply: "r".repeat(2000),
      actions: Array.from({ length: 6 }, () => ({ type: "reset" })),
      suggestions: ["a", "b", "c", "d", "s".repeat(120), 42],
    });
    expect(parsed?.reply).toHaveLength(1500);
    expect(parsed?.actions).toHaveLength(4);
    expect(parsed?.suggestions).toEqual(["a", "b", "c"]);
    expect(ChatResponse.safeParse(parsed).success).toBe(true);
  });

  it("defaults missing arrays", () => {
    expect(parseChatResponse({ reply: "ok" })).toEqual({ reply: "ok", actions: [], suggestions: [] });
  });

  it.each([null, "text", 42, {}, { reply: "" }, { reply: 5 }, { actions: [] }])(
    "returns null without a usable reply: %j",
    (input) => {
      expect(parseChatResponse(input)).toBeNull();
    },
  );
});
