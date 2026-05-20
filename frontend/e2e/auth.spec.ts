import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder(/you@example\.com/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
  });

  test("login page has forgot password link", async ({ page }) => {
    await page.goto("/login");
    const forgotLink = page.getByRole("link", { name: /forgot password/i });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await expect(page).toHaveURL("/forgot-password");
  });

  test("register page renders correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create.*account/i })).toBeVisible();
  });

  test("login shows error with invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/you@example\.com/i).fill("bad@example.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.getByRole("button", { name: /login/i }).click();

    // Should show a toast error (react-hot-toast)
    await expect(page.locator('[role="status"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test("forgot password page renders and submits", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /forgot password/i })).toBeVisible();
    await page.getByPlaceholder(/you@example\.com/i).fill("test@example.com");
    await page.getByRole("button", { name: /send reset link/i }).click();

    // Should transition to success state
    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 10_000 });
  });

  test("unauthenticated user is redirected from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
