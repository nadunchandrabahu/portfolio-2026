import { expect, test } from "@playwright/test";

test("home page loads with title, one h1 and no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/Nadun Chandrabahu/);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("main#main")).toBeVisible();
  expect(errors).toEqual([]);
});
