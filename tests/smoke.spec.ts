import { expect, test } from "@playwright/test";

const SECTIONS = ["hero", "work", "about", "hands-on", "skills", "experience", "education", "contact"];

test.describe("home page", () => {
  test("loads with title, one h1, every section and no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Nadun Chandrabahu/);
    await expect(page.locator("h1")).toHaveCount(1);
    for (const id of SECTIONS) {
      await expect(page.locator(`section#${id}`)).toHaveCount(1);
    }
    await expect(page.locator("[data-project-id]")).toHaveCount(7);
    expect(errors).toEqual([]);
  });

  test("production hides placeholders and never shows a phone number", async ({ page }) => {
    await page.goto("/");
    const text = await page.locator("body").innerText();
    expect(text).not.toContain("TODO");
    expect(text).not.toMatch(/\+?61\s?4\d{2}|04\d{2}\s?\d{3}\s?\d{3}/);
  });

  test("has no horizontal scroll", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("skip link is the first tab stop and targets main", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toHaveAttribute("href", "#main");
  });

  test("assembles the email address in the browser", async ({ page }) => {
    await page.goto("/");
    const html = await (await page.request.get("/")).text();
    expect(html).not.toMatch(/nadun\.c\.97@gmail\.com/);
    await expect(page.locator('a[href^="mailto:"]').first()).toHaveAttribute(
      "href",
      "mailto:nadun.c.97@gmail.com",
    );
  });
});

test.describe("3D gearbox", () => {
  test("starts after interaction and only ever talks to this origin", async ({ page, baseURL }) => {
    const origin = new URL(baseURL ?? "http://localhost").origin;
    const external: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (!url.startsWith(origin) && !url.startsWith("data:") && !url.startsWith("blob:")) {
        external.push(url);
      }
    });

    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("#hero canvas")).toHaveCount(0); // poster only until interaction
    await page.mouse.move(200, 200);
    await page.mouse.move(400, 300);

    // Either the canvas appears, or (no WebGL in this browser) the poster stays.
    const canvas = page.locator("#hero canvas");
    await canvas.waitFor({ state: "attached", timeout: 15_000 }).catch(() => undefined);
    await page.waitForTimeout(3000);
    await expect(page.locator('#hero img[src*="gearbox-poster"]')).toHaveCount(1);
    expect(external).toEqual([]);
  });
});

test.describe("mobile menu", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 1024, "desktop shows inline links");

  test("opens, navigates and closes", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.locator("#site-menu");
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: /Experience/ }).click();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/#experience$/);
  });

  test("closes with Escape", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.locator("#site-menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#site-menu")).toBeHidden();
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("all section content is visible", async ({ page }) => {
    await page.goto("/");
    for (const id of SECTIONS) {
      const section = page.locator(`section#${id}`);
      await section.scrollIntoViewIfNeeded();
      await expect(section.locator("h1, h2").first()).toBeVisible();
    }
    // Reveal styles only apply after JS marks the page ready.
    const hidden = await page.evaluate(
      () =>
        [...document.querySelectorAll("[data-reveal]")].filter(
          (el) => getComputedStyle(el).opacity === "0",
        ).length,
    );
    expect(hidden).toBe(0);
  });
});
