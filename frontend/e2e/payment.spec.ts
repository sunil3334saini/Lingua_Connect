import { test, expect } from "@playwright/test";

test.describe("Payment flow", () => {
  test("booking detail page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/booking/some-id");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("booking detail page renders payment section for unpaid booking", async ({ page }) => {
    const email = process.env.TEST_STUDENT_EMAIL;
    const password = process.env.TEST_STUDENT_PASSWORD;
    const bookingId = process.env.TEST_UNPAID_BOOKING_ID;
    if (!email || !password || !bookingId) {
      test.skip(true, "TEST_STUDENT_EMAIL / TEST_STUDENT_PASSWORD / TEST_UNPAID_BOOKING_ID not set");
      return;
    }

    await page.goto("/login");
    await page.getByPlaceholder(/you@example\.com/i).fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    await page.goto(`/booking/${bookingId}`);
    // Pay Now button should be present for an unpaid booking
    await expect(page.getByRole("button", { name: /pay now/i })).toBeVisible({ timeout: 10_000 });
  });

  test("paid booking shows Join Call button", async ({ page }) => {
    const email = process.env.TEST_STUDENT_EMAIL;
    const password = process.env.TEST_STUDENT_PASSWORD;
    const bookingId = process.env.TEST_PAID_BOOKING_ID;
    if (!email || !password || !bookingId) {
      test.skip(true, "TEST_STUDENT_EMAIL / TEST_STUDENT_PASSWORD / TEST_PAID_BOOKING_ID not set");
      return;
    }

    await page.goto("/login");
    await page.getByPlaceholder(/you@example\.com/i).fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    await page.goto(`/booking/${bookingId}`);
    await expect(page.getByRole("link", { name: /join call/i })).toBeVisible({ timeout: 10_000 });
  });
});
