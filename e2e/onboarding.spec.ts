import { test, expect } from "@playwright/test";

test.describe("Onboarding Flow", () => {
  test("should load the application", async ({ page }) => {
    await page.goto("/");

    // Wait for the app to load
    await page.waitForLoadState("networkidle");

    // The app should render something
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("should show signup/login for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for the app to load
    await page.waitForLoadState("networkidle");

    // Look for common auth-related elements
    // Adjust these selectors based on your actual SignUp component
    const hasAuthContent = await page
      .locator(
        'text=/sign up|sign in|log in|register|welcome|get started/i'
      )
      .count();

    expect(hasAuthContent).toBeGreaterThan(0);
  });

  test("should redirect to signup when accessing protected route", async ({
    page,
  }) => {
    // Try to access a protected route
    await page.goto("/planner");

    // Wait for redirect/render
    await page.waitForLoadState("networkidle");

    // Should show signup content (not the planner)
    // The exact behavior depends on your routing implementation
    const url = page.url();

    // Either we're redirected to root/signup, or signup is shown inline
    const isOnPublicPage =
      url.endsWith("/") || url.includes("signup") || url.includes("login");
    const hasAuthContent =
      (await page
        .locator(
          'text=/sign up|sign in|log in|register|welcome|get started/i'
        )
        .count()) > 0;

    expect(isOnPublicPage || hasAuthContent).toBeTruthy();
  });

  test("should have working navigation elements", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check that the page has interactive elements
    const buttons = await page.locator("button").count();
    const links = await page.locator("a").count();

    // There should be at least some interactive elements
    expect(buttons + links).toBeGreaterThan(0);
  });
});
