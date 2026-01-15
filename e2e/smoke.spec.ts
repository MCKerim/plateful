import { test, expect } from "@playwright/test";

// Basic smoke tests to verify the app loads correctly
test.describe("Smoke Tests", () => {
  test("homepage loads without errors", async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Filter out known acceptable errors (e.g., Supabase connection issues in test env)
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes("supabase") &&
        !error.includes("Failed to fetch") &&
        !error.includes("NetworkError")
    );

    // No critical JavaScript errors should occur
    expect(criticalErrors).toHaveLength(0);
  });

  test("app renders React root", async ({ page }) => {
    await page.goto("/");

    // Check that the React root element exists and has content
    const root = page.locator("#root");
    await expect(root).toBeVisible();
    await expect(root).not.toBeEmpty();
  });

  test("app is responsive on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // App should still render
    const root = page.locator("#root");
    await expect(root).toBeVisible();
  });

  test("app handles 404 routes gracefully", async ({ page }) => {
    await page.goto("/nonexistent-route-12345");
    await page.waitForLoadState("networkidle");

    // App should not crash - root should still be visible
    const root = page.locator("#root");
    await expect(root).toBeVisible();
  });
});
