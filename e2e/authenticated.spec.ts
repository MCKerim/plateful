import { test, expect } from "./fixtures";

test.describe("Authenticated User Flows", () => {
  test("should access cookbook page when authenticated", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/cookbook");
    await authenticatedPage.waitForLoadState("networkidle");

    // Should see cookbook content, not signup
    const searchInput = authenticatedPage.getByPlaceholder(/recipe/i);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Should see category buttons
    const categoryButtons = authenticatedPage.locator("button").filter({
      hasText: /breakfast|main|dessert|drinks|other/i,
    });
    const count = await categoryButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should access meal planner page when authenticated", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/planner");
    await authenticatedPage.waitForLoadState("networkidle");

    // Should see week navigation (left/right arrows or week display)
    const weekNavigation = authenticatedPage
      .locator("button")
      .filter({ has: authenticatedPage.locator("svg") });
    await expect(weekNavigation.first()).toBeVisible({ timeout: 10000 });

    // Should see day labels or the planner layout
    const body = authenticatedPage.locator("body");
    await expect(body).not.toBeEmpty();
  });

  test("should navigate between cookbook and planner", async ({
    authenticatedPage,
  }) => {
    // Start at cookbook
    await authenticatedPage.goto("/cookbook");
    await authenticatedPage.waitForLoadState("networkidle");

    // Wait for cookbook to load
    await expect(authenticatedPage.getByPlaceholder(/recipe/i)).toBeVisible({
      timeout: 10000,
    });

    // Find and click navigation to planner
    const plannerNav = authenticatedPage
      .locator('a[href="/planner"], button')
      .filter({ hasText: /plan/i })
      .first();

    if (await plannerNav.isVisible()) {
      await plannerNav.click();
      await authenticatedPage.waitForLoadState("networkidle");

      // Verify we're on planner
      expect(authenticatedPage.url()).toContain("/planner");
    }
  });

  test("should show empty state in cookbook for new user", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/cookbook");
    await authenticatedPage.waitForLoadState("networkidle");

    // Wait for cookbook to load
    await expect(authenticatedPage.getByPlaceholder(/recipe/i)).toBeVisible({
      timeout: 10000,
    });

    // Click on "All Recipes" category to see recipes list
    const allRecipesButton = authenticatedPage.getByRole("button", {
      name: /all/i,
    });

    if (await allRecipesButton.isVisible()) {
      await allRecipesButton.click();
      await authenticatedPage.waitForLoadState("networkidle");

      // Should show empty state or "nothing found" message
      const emptyState = authenticatedPage.locator(
        "text=/nothing|no recipes|empty/i"
      );
      await expect(emptyState).toBeVisible({ timeout: 10000 });
    }
  });
});
