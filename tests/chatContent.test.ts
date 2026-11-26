import { describe, expect, it } from "vitest";
import { linkify, toParagraphs } from "@/lib/chat/linkify";
import { mockReply } from "@/lib/chat/mock";
import { ChatResponse, OPENING_SUGGESTIONS } from "@/lib/chat/schema";
import { buildKnowledge } from "@/lib/knowledge";
import { hashIp, LIMITS, memoryLimiter } from "@/lib/ratelimit";

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
    ["Switch to light mode", "light"],
    ["Make it rain", "rain"],
    ["dark theme please", "dark"],
  ])("switches the theme: %s", (message, value) => {
    expect(mockReply(message).actions).toEqual([{ type: "theme", value }]);
  });

  it("doesn't mistake other questions for theme requests", () => {
    for (const message of ["Show it as a drawing", "What tools does he use?", "Highlight the NASA project"]) {
      expect(mockReply(message).actions.some((a) => a.type === "theme")).toBe(false);
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

  it("caps a visitor at 60 a day", async () => {
    let now = 0;
    const limiter = memoryLimiter(() => now);
    for (let i = 0; i < LIMITS.perDay; i++) {
      expect((await limiter.check("1.2.3.4")).ok).toBe(true);
      now += 61_000 / LIMITS.perMinute + 1_000;
    }
    expect((await limiter.check("1.2.3.4")).ok).toBe(false);
  });

  it("keys visitors by a hash, never the raw IP", () => {
    expect(hashIp("1.2.3.4")).not.toContain("1.2.3.4");
    expect(hashIp("1.2.3.4")).toHaveLength(32);
  });
});
