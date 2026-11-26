import { describe, expect, it, vi } from "vitest";
import { formatReceipt, runActions, STEP_MS, type ExecutorDeps } from "@/lib/chat/executor";
import type { GearboxAction } from "@/lib/chat/schema";

function fakeDeps(reducedMotion = false) {
  const calls: string[] = [];
  const deps: ExecutorDeps = {
    reducedMotion,
    apply: vi.fn((partial) => calls.push(`apply ${JSON.stringify(partial)}`)),
    reset: vi.fn(() => calls.push("reset")),
    showGearbox: vi.fn(async () => {
      calls.push("showGearbox");
    }),
    scrollToSection: vi.fn((id) => calls.push(`scroll ${id}`)),
    showProject: vi.fn((id) => calls.push(`project ${id}`)),
    setEffects: vi.fn((change) => calls.push(`effects ${JSON.stringify(change)}`)),
    sleep: vi.fn(async (ms) => {
      calls.push(`sleep ${ms}`);
    }),
  };
  return { deps, calls };
}

describe("runActions", () => {
  it("plays actions in order, ~900ms apart, after bringing the gearbox into view", async () => {
    const { deps, calls } = fakeDeps();
    const actions: GearboxAction[] = [
      { type: "focus", target: "engineering" },
      { type: "spin", rpm: 30 },
      { type: "focus", target: "ai" },
    ];
    await runActions(actions, deps);
    expect(calls).toEqual([
      "showGearbox",
      'apply {"focus":"engineering","callouts":"focus"}',
      `sleep ${STEP_MS}`,
      'apply {"rpm":30}',
      `sleep ${STEP_MS}`,
      'apply {"focus":"ai","callouts":"focus"}',
    ]);
  });

  it("highlights a project in the store and scrolls its card into view", async () => {
    const { deps, calls } = fakeDeps();
    await runActions([{ type: "highlightProject", id: "field-shift" }], deps);
    expect(calls).toEqual(["showGearbox", 'apply {"highlightProject":"field-shift"}', "project field-shift"]);
  });

  it("doesn't bring the gearbox into view for scroll-only or reset-only replies", async () => {
    const { deps, calls } = fakeDeps();
    await runActions([{ type: "scrollTo", section: "contact" }], deps);
    await runActions([{ type: "reset" }], deps);
    expect(calls).toEqual(["scroll contact", "reset"]);
  });

  it("does nothing for an empty action list", async () => {
    const { deps, calls } = fakeDeps();
    await runActions([], deps);
    expect(calls).toEqual([]);
  });

  it("stops when aborted (a newer reply arrived)", async () => {
    const { deps, calls } = fakeDeps();
    const controller = new AbortController();
    deps.sleep = vi.fn(async () => controller.abort());
    await runActions(
      [
        { type: "focus", target: "sun" },
        { type: "explode", amount: 1 },
      ],
      deps,
      controller.signal,
    );
    expect(calls).toEqual(["showGearbox", 'apply {"focus":"sun","callouts":"focus"}']);
  });

  describe("reduced motion", () => {
    it("applies the final state at once and skips spins", async () => {
      const { deps, calls } = fakeDeps(true);
      await runActions(
        [
          { type: "focus", target: "engineering" },
          { type: "spin", rpm: 30 },
          { type: "focus", target: "ai" },
          { type: "explode", amount: 0.5 },
        ],
        deps,
      );
      expect(calls).toEqual(["showGearbox", 'apply {"focus":"ai","callouts":"focus","explode":0.5}']);
      expect(deps.sleep).not.toHaveBeenCalled();
    });

    it("resets first, then applies anything after the reset, then scrolls once", async () => {
      const { deps, calls } = fakeDeps(true);
      await runActions(
        [
          { type: "explode", amount: 1 },
          { type: "reset" },
          { type: "mode", value: "blueprint" },
          { type: "scrollTo", section: "work" },
          { type: "highlightProject", id: "grow365" },
        ],
        deps,
      );
      expect(calls).toEqual([
        "showGearbox",
        "reset",
        'apply {"mode":"blueprint","highlightProject":"grow365"}',
        "project grow365",
      ]);
    });
  });
});

describe("lights and rain actions", () => {
  it("switch the page effects without scrolling to the gearbox", async () => {
    const { deps, calls } = fakeDeps();
    await runActions(
      [
        { type: "lights", on: true },
        { type: "rain", on: true },
      ],
      deps,
    );
    expect(calls).toEqual(['effects {"light":true}', `sleep ${STEP_MS}`, 'effects {"rain":true}']);
  });

  it("accepts the older theme form", async () => {
    const { deps, calls } = fakeDeps();
    await runActions([{ type: "theme", value: "dark" }], deps);
    expect(calls).toEqual(['effects {"light":false,"rain":false}']);
  });

  it("fold into one change under reduced motion", async () => {
    const { deps, calls } = fakeDeps(true);
    await runActions(
      [
        { type: "lights", on: true },
        { type: "explode", amount: 1 },
        { type: "rain", on: true },
        { type: "lights", on: false },
      ],
      deps,
    );
    expect(calls).toEqual(["showGearbox", 'effects {"light":false,"rain":true}', 'apply {"explode":1}']);
  });

  it("show in the receipt", () => {
    expect(
      formatReceipt([
        { type: "lights", on: true },
        { type: "rain", on: false },
      ]),
    ).toBe("→ lights: on · rain: off");
  });
});

describe("formatReceipt", () => {
  it("summarises the moves in one line", () => {
    expect(
      formatReceipt([
        { type: "focus", target: "ai" },
        { type: "spin", rpm: 30 },
      ]),
    ).toBe("→ focus: ai · spin: 30 rpm");
    expect(formatReceipt([{ type: "highlightProject", id: "pickl-hq" }, { type: "reset" }])).toBe(
      "→ project: pickl-hq · reset",
    );
  });

  it("is null when nothing moved", () => {
    expect(formatReceipt([])).toBeNull();
  });
});
