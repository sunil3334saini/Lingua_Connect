import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password) {
    test.skip(true, "TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set");
    return false;
  }
  await page.goto("/login");
  await page.getByPlaceholder(/you@example\.com/i).fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
  return true;
}

test.describe("Admin panel access control", () => {
  test("unauthenticated user cannot reach /admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login|\/dashboard/, { timeout: 10_000 });
  });

  test("non-admin user is blocked from /admin", async ({ page }) => {
    const email = process.env.TEST_STUDENT_EMAIL;
    const password = process.env.TEST_STUDENT_PASSWORD;
    if (!email || !password) {
      test.skip(true, "TEST_STUDENT_EMAIL / TEST_STUDENT_PASSWORD not set");
      return;
    }
    await page.goto("/login");
    await page.getByPlaceholder(/you@example\.com/i).fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    await page.goto("/admin");
    // Should be redirected away — not stay on /admin
    await expect(page).not.toHaveURL(/\/admin$/, { timeout: 10_000 });
  });
});

test.describe("Admin dashboard", () => {
  test("stats page renders for admin", async ({ page }) => {
    const ok = await loginAsAdmin(page);
    if (!ok) return;

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /admin/i })).toBeVisible({ timeout: 10_000 });
  });

  test("users list renders for admin", async ({ page }) => {
    const ok = await loginAsAdmin(page);
    if (!ok) return;

    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: /users/i })).toBeVisible({ timeout: 10_000 });
  });

  test("bookings list renders for admin", async ({ page }) => {
    const ok = await loginAsAdmin(page);
    if (!ok) return;

    await page.goto("/admin/bookings");
    await expect(page.getByRole("heading", { name: /bookings/i })).toBeVisible({ timeout: 10_000 });
  });

  test("payments list renders for admin", async ({ page }) => {
    const ok = await loginAsAdmin(page);
    if (!ok) return;

    await page.goto("/admin/payments");
    await expect(page.getByRole("heading", { name: /payments/i })).toBeVisible({ timeout: 10_000 });
  });
});
