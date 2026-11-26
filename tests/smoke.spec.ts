import { expect, test, type Page } from "@playwright/test";

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

    // Hero-only canvas on phones; on desktop the same canvas is fixed over the page (scroll stage).
    const canvas = page.locator("#hero canvas:not(.digital-rain), .gearbox-stage canvas");
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(canvas).toHaveCount(0); // poster only until interaction
    await page.mouse.move(200, 200);
    await page.mouse.move(400, 300);

    // Either the canvas appears, or (no WebGL in this browser) the poster stays.
    await canvas.waitFor({ state: "attached", timeout: 15_000 }).catch(() => undefined);
    await page.waitForTimeout(3000);
    await expect(page.locator('#hero img[src*="gearbox-poster"]')).toHaveCount(1);
    expect(external).toEqual([]);
  });
});

test.describe("scroll stage", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "phones keep the gearbox in the hero");

  /** Scroll a section to the top, re-trying while lazily rendered sections settle their heights. */
  async function scrollToSection(page: Page, id: string) {
    for (let i = 0; i < 4; i++) {
      await page.evaluate((target) => {
        const el = document.getElementById(target);
        if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 40);
      }, id);
      await page.waitForTimeout(250);
    }
  }

  test("moves the gearbox between section slots and fades it out for reading", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.mouse.move(200, 200);
    await page.mouse.move(400, 300);
    const stage = page.locator(".gearbox-stage canvas");
    const started = await stage
      .waitFor({ state: "attached", timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    test.skip(!started, "no WebGL in this browser");

    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-gearbox-stage", "hero");

    await scrollToSection(page, "about");
    await expect(html).toHaveAttribute("data-gearbox-stage", "about");
    // Part balloons on the exploded view, and the 2D fallback drawing hidden.
    await expect(page.locator(".gearbox-callout--balloon")).toHaveCount(5);
    await expect(page.locator('[data-gearbox-slot="about"] .gearbox-slot-fallback')).toBeHidden();

    // A part row focuses that part: its full label replaces the balloons.
    await page.locator('button[data-part="ai"]').focus();
    await expect(page.locator(".gearbox-callout__label")).toHaveText(["P-03 · Machine learning and AI"]);

    await scrollToSection(page, "experience");
    await expect(html).toHaveAttribute("data-gearbox-stage", "experience");
    await expect
      .poll(() => page.locator(".gearbox-stage").evaluate((el) => Number(getComputedStyle(el).opacity)))
      .toBeLessThan(0.05);
  });
});

test.describe("security and SEO", () => {
  test("sends the security headers", async ({ request }) => {
    const headers = (await request.get("/")).headers();
    const csp = headers["content-security-policy"] ?? "";
    for (const directive of [
      "default-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "connect-src 'self'",
    ]) {
      expect(csp).toContain(directive);
    }
    expect(csp).not.toContain("unsafe-eval");
    expect(headers["strict-transport-security"]).toContain("max-age=63072000");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("robots keeps crawlers off the API, and the sitemap lists the page", async ({ request }) => {
    expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /api/");
    expect(await (await request.get("/sitemap.xml")).text()).toContain("<loc>");
  });

  test("has a share image and Person structured data", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
    expect(ld).toMatchObject({ "@type": "Person", name: "Nadun Chandrabahu" });
  });
});

test.describe("chat", () => {
  test("the route only takes same-origin POSTs", async ({ request }) => {
    expect((await request.get("/api/chat")).status()).toBe(405);
    const noOrigin = await request.post("/api/chat", {
      data: { sessionId: "4f8e2b1a-3c5d-4e6f-8a9b-0c1d2e3f4a5b", message: "hi" },
    });
    expect(noOrigin.status()).toBe(403);
  });

  test("the knowledge file is public site content only", async ({ request }) => {
    const res = await request.get("/knowledge.md");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/markdown");
    const text = await res.text();
    expect(text).toContain("Field Shift");
    expect(text).not.toMatch(/TODO|Certificate slot/);
  });

  test("a suggestion chip gets a mock reply that moves the gearbox", async ({ page, isMobile }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const ask = isMobile
      ? page.getByRole("button", { name: "Digital twin" }).last()
      : page.getByRole("navigation", { name: "Primary" }).getByRole("button", { name: "Digital twin" });
    await ask.click();

    const dialog = page.getByRole("dialog", { name: "Digital Nadun" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Your question")).toBeFocused();

    await dialog.getByRole("button", { name: "Take the gearbox apart" }).click();
    // The reply (not the screen-reader announcement, which repeats it).
    await expect(dialog.locator("p", { hasText: "Here it is in exploded view." }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(dialog.getByText("→ focus: overview · explode: 1 · spin: 8 rpm")).toBeVisible();
    // The chat now drives the gearbox, and says so.
    await expect(page.getByRole("button", { name: "Release" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(ask).toBeFocused();
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("keeps the gearbox static in the hero, shows content at once, animates nothing", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.mouse.move(200, 200);
    await page.mouse.move(400, 300);
    await page.waitForTimeout(3000);

    // No scroll choreography: never the fixed stage.
    await expect(page.locator(".gearbox-stage")).toHaveCount(0);
    await expect(page.locator("html")).not.toHaveAttribute("data-gearbox-stage", /.*/);

    // Walk the page: every revealed block is fully visible, no fade-in.
    for (let y = 0; y < 14000; y += 900) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
    }
    const hidden = await page
      .locator("[data-reveal]")
      .evaluateAll((els) => els.filter((el) => Number(getComputedStyle(el).opacity) < 1).length);
    expect(hidden).toBe(0);

    // Nothing left running (breathing lamp, ticks, reveals, sheens).
    await page.waitForTimeout(300);
    const running = await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === "running").length,
    );
    expect(running).toBe(0);
  });
});

test.describe("in-page navigation", () => {
  // Sections below the fold render lazily (content-visibility), and on desktop
  // the gearbox stage re-measures as they do; links used to stop short.
  test("nav links land exactly on their section", async ({ page, viewport }) => {
    const phone = (viewport?.width ?? 0) < 1024;
    await page.goto("/", { waitUntil: "networkidle" });
    const padding = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop));
    for (const id of ["contact", "experience", "about", "education"]) {
      if (phone) {
        await page.getByRole("button", { name: "Open menu" }).click();
        await page.locator("#site-menu").locator(`a[href="#${id}"]`).click();
      } else {
        await page.getByRole("navigation", { name: "Primary" }).locator(`a[href="#${id}"]`).first().click();
      }
      const onTarget = () =>
        page.evaluate(
          ([i, pad]) => Math.abs(document.getElementById(i)!.getBoundingClientRect().top - pad) <= 4,
          [id, padding] as const,
        );
      await expect.poll(onTarget, { timeout: 10_000 }).toBe(true);
      // ...and it stays there once everything has settled.
      await page.waitForTimeout(1200);
      expect(await onTarget()).toBe(true);
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
    }
  });
});

test.describe("lights and rain", () => {
  test("toggle independently from the header and are remembered", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const lights = page.getByRole("button", { name: "Lights", exact: true });
    const rain = page.getByRole("button", { name: "Rain", exact: true });
    await expect(lights).toHaveAttribute("aria-pressed", "false");
    await lights.click();
    await rain.click();
    await expect(html).toHaveAttribute("data-light", "on");
    await expect(html).toHaveAttribute("data-rain", "on");
    await page.reload();
    await expect(html).toHaveAttribute("data-light", "on");
    await expect(html).toHaveAttribute("data-rain", "on");
    await expect(lights).toHaveAttribute("aria-pressed", "true");
    await lights.click();
    await expect(html).not.toHaveAttribute("data-light");
    await expect(html).toHaveAttribute("data-rain", "on");
    await rain.click();
    await expect(html).not.toHaveAttribute("data-rain");
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
