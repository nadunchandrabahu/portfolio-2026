import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_TARGETS, sanitize, useGearboxStore } from "@/three/gearboxStore";

const state = () => useGearboxStore.getState();

describe("gearbox store", () => {
  beforeEach(() => state().reset());

  it("starts at the documented defaults under scroll control", () => {
    expect(state()).toMatchObject({ ...DEFAULT_TARGETS, controlledBy: "scroll" });
  });

  it("clamps explode to 0..1 and rpm to 0..60", () => {
    expect(sanitize({ explode: 3, rpm: 500 })).toEqual({ explode: 1, rpm: 60 });
    expect(sanitize({ explode: -1, rpm: -5 })).toEqual({ explode: 0, rpm: 0 });
  });

  it("drops unknown callout modes", () => {
    expect(sanitize({ callouts: "parts" })).toEqual({ callouts: "parts" });
    expect(sanitize({ callouts: "everything" as never })).toEqual({});
  });

  it("drops non-finite numbers", () => {
    expect(sanitize({ explode: Number.NaN, rpm: Number.POSITIVE_INFINITY })).toEqual({});
  });

  it("applies scroll updates while scroll is in control", () => {
    state().apply({ focus: "ring", explode: 0.7 }, "scroll");
    expect(state()).toMatchObject({ focus: "ring", explode: 0.7 });
  });

  it("ignores scroll while the chat is in control, until released", () => {
    state().apply({ focus: "ai", rpm: 30 }, "chat");
    expect(state().controlledBy).toBe("chat");

    state().apply({ focus: "overview", rpm: 6 }, "scroll");
    expect(state()).toMatchObject({ focus: "ai", rpm: 30 });

    state().releaseToScroll();
    state().apply({ focus: "overview" }, "scroll");
    expect(state()).toMatchObject({ focus: "overview", controlledBy: "scroll" });
  });

  it("reset restores defaults and hands control back to scroll", () => {
    state().apply({ focus: "sun", mode: "blueprint", explode: 1, rpm: 60, highlightProject: "grow365" }, "chat");
    state().reset();
    expect(state()).toMatchObject({ ...DEFAULT_TARGETS, controlledBy: "scroll" });
  });
});
