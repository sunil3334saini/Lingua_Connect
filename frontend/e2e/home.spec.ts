import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("renders hero section with CTA buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /browse teachers/i })).toBeVisible();
  });

  test("navbar logo links to home", async ({ page }) => {
    await page.goto("/teachers");
    await page.getByRole("link", { name: /linguaconnect/i }).first().click();
    await expect(page).toHaveURL("/");
  });

  test("has correct page title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/lingua connect/i);
  });
});
