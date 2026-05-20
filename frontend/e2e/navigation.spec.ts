import { test, expect } from "@playwright/test";

test.describe("Navigation & Responsive", () => {
  test("desktop nav shows links", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav");
    await expect(nav.getByRole("link", { name: /find teachers/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /login/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /register/i })).toBeVisible();
  });

  test("theme toggle is present in navbar", async ({ page }) => {
    await page.goto("/");
    // The theme toggle has sun/moon/monitor icons
    await expect(page.locator("nav button[title='Dark']")).toBeVisible();
    await expect(page.locator("nav button[title='Light']")).toBeVisible();
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    await page.goto("/this-does-not-exist-12345");
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText(/page not found/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /go home/i })).toBeVisible();
  });
});

test.describe("Mobile Navigation", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("hamburger menu opens and reveals links", async ({ page }) => {
    await page.goto("/");
    // Desktop links should be hidden
    const desktopNav = page.locator(".hidden.md\\:flex");
    await expect(desktopNav).not.toBeVisible();

    // Click hamburger
    const hamburger = page.getByLabel(/open menu/i);
    await expect(hamburger).toBeVisible();
    await hamburger.click();

    // Mobile menu should appear
    await expect(page.getByRole("link", { name: /find teachers/i }).first()).toBeVisible();
  });
});
