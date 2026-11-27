import { describe, expect, it } from "vitest";
import { linkify, toParagraphs } from "@/lib/chat/linkify";
import { mockReply, QUIPS, requestedHumour } from "@/lib/chat/mock";
import { ChatResponse, OPENING_SUGGESTIONS } from "@/lib/chat/schema";
import { buildKnowledge } from "@/lib/knowledge";
import { hashIp, LIMITS, memoryLimiter, twoWindowLimiter } from "@/lib/ratelimit";

describe("mock replies: humour slider", () => {
  const questions = ["Show me the NASA project", "What tools does he use?", "How do I contact him?", "What has he built?"];
  const text = (r: ReturnType<typeof mockReply>) => ({ reply: r.reply, actions: r.actions, suggestions: r.suggestions });
  const squash = (s: string) => s.replace(/\s+/g, " ").trim();
  const allQuips: string[] = [...QUIPS.light, ...QUIPS.bold];

  it("answers exactly the same at 0% and 25% as with no setting, and says which setting it used", () => {
    for (const q of questions) {
      expect(text(mockReply(q, 0))).toEqual(text(mockReply(q)));
      expect(text(mockReply(q, 25))).toEqual(text(mockReply(q)));
      expect(mockReply(q, 0).humour).toBe(0);
      expect(mockReply(q).humour).toBe(25);
    }
  });

  it("at 100% weaves in one short line somewhere, keeping the answer and the actions", () => {
    const slots = new Set<string>();
    for (const q of [...questions, "Tell me about PICKL HQ", "What's Grow365?", "Show me the mortgage project"]) {
      const plain = mockReply(q, 25);
      const funny = mockReply(q, 100);
      expect(funny.actions).toEqual(plain.actions);
      const quip = allQuips.find((line) => funny.reply.includes(line));
      expect(quip).toBeDefined();
      expect(squash(funny.reply.replace(quip!, ""))).toBe(squash(plain.reply));
      expect(quip!.split(/\s+/).length).toBeLessThanOrEqual(12);
      expect(quip).not.toMatch(/!/);
      const at = funny.reply.indexOf(quip!);
      slots.add(at === 0 ? "start" : at + quip!.length >= funny.reply.length ? "end" : "middle");
    }
    // Not always tacked on at the end.
    expect(slots.size).toBeGreaterThan(1);
  });

  it("keeps faith answers sincere at any setting", () => {
    expect(text(mockReply(OPENING_SUGGESTIONS[3], 100))).toEqual(text(mockReply(OPENING_SUGGESTIONS[3], 25)));
  });

  it.each([
    ["set humour to 80%", 50, 80],
    ["Humour 100 please", 25, 100],
    ["make it 37% funny", 25, 35],
    ["be funnier", 25, 50],
    ["Can you be funnier?", 90, 100],
    ["less funny please", 50, 25],
    ["no jokes", 75, 0],
    ["be serious for a moment", 60, 0],
    ["max humour", 25, 100],
  ])("typed request %j at %d%% sets humour to %d%%", (message, current, expected) => {
    expect(requestedHumour(message, current)).toBe(expected);
    const reply = mockReply(message, current);
    expect(reply.humour).toBe(expected);
    expect(reply.actions).toEqual([]);
  });

  it.each(["Show me 3 projects", "Is he serious about AI?", "What's at the centre?", "Turn the lights on"])(
    "leaves the setting alone for %j",
    (message) => {
      expect(requestedHumour(message, 40)).toBeNull();
      expect(mockReply(message, 40).humour).toBe(40);
    },
  );
});

describe("mock replies", () => {
  it("every opening chip gets a sensible reply that moves the gearbox", () => {
    for (const chip of OPENING_SUGGESTIONS) {
      const reply = ChatResponse.parse(mockReply(chip));
      expect(reply.reply.length).toBeGreaterThan(40);
      expect(reply.actions.length).toBeGreaterThan(0);
    }
  });

  it("maps each chip to the right moves", () => {
    expect(mockReply(OPENING_SUGGESTIONS[0]).actions.map((a) => a.type)).toEqual(["focus", "spin", "focus"]);
    expect(mockReply(OPENING_SUGGESTIONS[1]).actions).toContainEqual({ type: "highlightProject", id: "field-shift" });
    expect(mockReply(OPENING_SUGGESTIONS[2]).actions).toContainEqual({ type: "explode", amount: 1 });
    expect(mockReply(OPENING_SUGGESTIONS[3]).actions).toContainEqual({ type: "focus", target: "sun" });
  });

  it.each([
    ["Turn the lights on", [{ type: "lights", on: true }]],
    ["lights off please", [{ type: "lights", on: false }]],
    ["Make it rain", [{ type: "rain", on: true }]],
    ["Stop the rain", [{ type: "rain", on: false }]],
    ["Turn on the lights and make it rain", [{ type: "lights", on: true }, { type: "rain", on: true }]],
    ["dark mode please", [{ type: "lights", on: false }, { type: "rain", on: false }]],
  ])("switches lights and rain: %s", (message, actions) => {
    expect(mockReply(message).actions).toEqual(actions);
  });

  it("doesn't mistake other questions for lights or rain", () => {
    for (const message of ["Show it as a drawing", "What tools does he use?", "Highlight the NASA project", "Show me the NASA project"]) {
      expect(mockReply(message).actions.some((a) => a.type === "lights" || a.type === "rain")).toBe(false);
    }
  });

  it.each(["hello", "Put it back together", "What tools does he use?", "How do I contact him?", "zzz"])(
    "always returns a valid response: %s",
    (message) => {
      const reply = mockReply(message);
      expect(ChatResponse.safeParse(reply).success).toBe(true);
      expect(reply.reply).not.toMatch(/TODO/);
    },
  );
});

describe("knowledge file", () => {
  const md = buildKnowledge();

  it("covers the site's main content", () => {
    for (const text of ["Field Shift", "Master of Data Science", "Ephesians 2:8", "Hatch", "SolidWorks"]) {
      expect(md).toContain(text);
    }
  });

  it("includes the downloads, degree certificates and each certification's date, skills and link", () => {
    expect(md).toContain("/research/Empowering-Medical-Data-Analytics-with-AI.pdf");
    expect(md).toContain("/research/Metal-Oxide-Nanoparticles-Thesis.pdf");
    expect(md).toContain("/resume/Nadun-Chandrabahu-Resume.pdf");
    expect(md).toMatch(/Degree certificate \(My eQuals\): https:\/\/www\.myequals\.net\//);
    expect(md).toContain(
      "LLMOps, DeepLearning.AI, Sep 2026. Skills: fine-tuning, evaluation and monitoring, data processing. Verify: https://www.deeplearning.ai/",
    );
  });

  it("includes his interests and personality", () => {
    for (const text of ["## Outside work", "e-bike mechanic for Lime", "won't choose between them", "Vinland Saga", "INFJ"]) {
      expect(md).toContain(text);
    }
  });

  it("leaves out placeholders, TODOs and unpublished certificate slots", () => {
    expect(md).not.toMatch(/TODO|pending|Certificate slot|\[employer\]/i);
  });

  it("never contains a phone number", () => {
    expect(md).not.toMatch(/(\+?61|\b0)4\d{2}[\s-]?\d{3}[\s-]?\d{3}/);
    expect(md).not.toMatch(/\b\d{3}[\s-]\d{3}[\s-]\d{3,4}\b/);
  });
});

describe("linkify", () => {
  const host = "nadun.dev";

  it("links only this site, GitHub and LinkedIn", () => {
    const segments = linkify(
      "See https://github.com/nadunchandrabahu, https://nadun.dev/#work and https://evil.example/x.",
      host,
    );
    expect(segments.filter((s) => s.href)).toEqual([
      { text: "https://github.com/nadunchandrabahu", href: "https://github.com/nadunchandrabahu", external: true },
      { text: "https://nadun.dev/#work", href: "/#work" },
    ]);
    expect(segments.map((s) => s.text).join("")).toContain("https://evil.example/x.");
  });

  it("never links non-https external URLs or script URLs", () => {
    expect(linkify("http://github.com/x javascript:alert(1)", host).some((s) => s.href)).toBe(false);
  });

  it("splits paragraphs on blank lines", () => {
    expect(toParagraphs("One\n\nTwo\n \nThree")).toEqual(["One", "Two", "Three"]);
  });
});

describe("rate limiter (in-memory fallback)", () => {
  it("allows 8 a minute, then refuses until the window slides", async () => {
    let now = 0;
    const limiter = memoryLimiter(() => now);
    for (let i = 0; i < LIMITS.perMinute; i++) expect((await limiter.check("1.2.3.4")).ok).toBe(true);
    expect((await limiter.check("1.2.3.4")).ok).toBe(false);
    expect((await limiter.check("5.6.7.8")).ok).toBe(true);
    now += 61_000;
    expect((await limiter.check("1.2.3.4")).ok).toBe(true);
  });

  it("caps a visitor at 100 a day, and says which limit it was", async () => {
    let now = 0;
    const limiter = memoryLimiter(() => now);
    for (let i = 0; i < LIMITS.perDay; i++) {
      expect((await limiter.check("1.2.3.4")).ok).toBe(true);
      now += 61_000 / LIMITS.perMinute + 1_000;
    }
    expect(await limiter.check("1.2.3.4")).toEqual({ ok: false, limit: "day" });
  });

  it("names the minute limit when that's the one hit", async () => {
    const limiter = memoryLimiter(() => 0);
    for (let i = 0; i < LIMITS.perMinute; i++) await limiter.check("1.2.3.4");
    expect(await limiter.check("1.2.3.4")).toEqual({ ok: false, limit: "minute" });
  });

  it("(Upstash path) doesn't count messages the minute limit refused against the day", async () => {
    const dayCalls: string[] = [];
    let minuteOk = false;
    const limiter = twoWindowLimiter(
      { limit: async () => ({ success: minuteOk }) },
      { limit: async (key) => (dayCalls.push(key), { success: true }) },
    );
    for (let i = 0; i < 5; i++) expect(await limiter.check("1.2.3.4")).toEqual({ ok: false, limit: "minute" });
    expect(dayCalls).toHaveLength(0);
    minuteOk = true;
    expect(await limiter.check("1.2.3.4")).toEqual({ ok: true });
    expect(dayCalls).toHaveLength(1);
  });

  it("(Upstash path) reports the day limit once the minute allows it", async () => {
    const limiter = twoWindowLimiter({ limit: async () => ({ success: true }) }, { limit: async () => ({ success: false }) });
    expect(await limiter.check("1.2.3.4")).toEqual({ ok: false, limit: "day" });
  });

  it("keys visitors by a hash, never the raw IP", () => {
    expect(hashIp("1.2.3.4")).not.toContain("1.2.3.4");
    expect(hashIp("1.2.3.4")).toHaveLength(32);
  });
});
