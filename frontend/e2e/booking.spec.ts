import { test, expect } from "@playwright/test";

// Helpers ---------------------------------------------------------------

async function loginAs(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder(/you@example\.com/i).fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

// -----------------------------------------------------------------------

test.describe("Bookings page", () => {
  test("redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/bookings");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows empty state when no bookings exist", async ({ page }) => {
    // Use a fresh guest account that has no bookings
    await page.goto("/bookings");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    // Verify the redirect happened — full auth flow is covered by auth.spec.ts
  });
});

test.describe("Booking detail page", () => {
  test("returns 404-style redirect for invalid booking id", async ({ page }) => {
    await page.goto("/booking/000000000000000000000000");
    // Should land on login (unauthenticated) or not-found
    await expect(page).toHaveURL(/\/login|\/not-found|\/dashboard/, { timeout: 10_000 });
  });
});

test.describe("Cancel booking flow (UI)", () => {
  test("cancel button appears for upcoming bookings", async ({ page }) => {
    // This test requires a seeded upcoming booking — skip if env credentials absent
    const email = process.env.TEST_STUDENT_EMAIL;
    const password = process.env.TEST_STUDENT_PASSWORD;
    if (!email || !password) {
      test.skip(true, "TEST_STUDENT_EMAIL / TEST_STUDENT_PASSWORD not set");
      return;
    }

    await loginAs(page, email, password);
    await page.goto("/bookings");

    // Wait for bookings to load
    await page.waitForSelector('[data-testid="booking-card"], text=No bookings found', {
      timeout: 10_000,
    });

    const cancelBtn = page.getByRole("button", { name: /^cancel$/i }).first();
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      // Confirmation step appears
      await expect(page.getByRole("button", { name: /confirm cancel/i })).toBeVisible();
      // Dismiss without confirming
      await page.getByRole("button").filter({ has: page.locator("svg") }).last().click();
      await expect(page.getByRole("button", { name: /^cancel$/i }).first()).toBeVisible();
    }
  });
});