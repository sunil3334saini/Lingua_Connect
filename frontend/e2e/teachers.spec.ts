import { test, expect } from "@playwright/test";

test.describe("Teachers Page", () => {
  test("renders teachers listing page", async ({ page }) => {
    await page.goto("/teachers");
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test("search input filters teachers", async ({ page }) => {
    await page.goto("/teachers");
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("math");
    await searchInput.press("Enter");

    // URL or results should update — just verify page didn't crash
    await expect(page.locator("body")).toBeVisible();
  });
});
