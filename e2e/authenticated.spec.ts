import { test, expect } from "@playwright/test";

// These tests mock Supabase auth to simulate a logged-in user
test.describe("Authenticated User Flows", () => {
  test.beforeEach(async ({ page, context }) => {
    // Get the Supabase URL from environment or use a pattern
    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://upupcsgufoejppoietiu.supabase.co";
    const storageKey = `sb-${supabaseUrl.split("//")[1].split(".")[0]}-auth-token`;

    // Create a mock session that Supabase client will read from localStorage
    const mockSession = {
      access_token: "mock-access-token",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: "mock-refresh-token",
      user: {
        id: "test-user-id",
        aud: "authenticated",
        role: "authenticated",
        email: "test@example.com",
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_metadata: {
          full_name: "Test User",
        },
      },
    };

    // Inject the session into localStorage before page loads
    await context.addInitScript(
      ({ storageKey, session }) => {
        localStorage.setItem(storageKey, JSON.stringify(session));
      },
      { storageKey, session: mockSession }
    );

    // Mock Supabase auth API endpoints
    await page.route("**/auth/v1/**", async (route) => {
      const url = route.request().url();

      if (url.includes("/user")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockSession.user),
        });
        return;
      }

      if (url.includes("/token")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockSession),
        });
        return;
      }

      await route.continue();
    });

    // Mock user data endpoint - return the authenticated user with nested household
    // The app uses: .select("*, household:household_id(*)") which joins household
    await page.route("**/rest/v1/users?*", async (route) => {
      const url = route.request().url();

      // Check if this is a single user fetch (with .single() - returns object not array)
      // or household members fetch (returns array)
      const isSingleUserFetch = url.includes("select=*") || url.includes("select=%2A");

      if (isSingleUserFetch) {
        // Single user fetch with household join
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "test-user-id",
            email: "test@example.com",
            username: "TestUser",
            has_seen_value_screens: true,
            has_completed_survey: true,
            household_id: 1,
            language: "en",
            created_at: new Date().toISOString(),
            // Nested household object from the join
            household: {
              id: 1,
              name: "Test Household",
              created_at: new Date().toISOString(),
            },
          }),
        });
      } else {
        // Household members fetch - returns array
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "test-user-id",
              email: "test@example.com",
              username: "TestUser",
            },
          ]),
        });
      }
    });

    // Mock household data (for direct household queries if any)
    await page.route("**/rest/v1/households?*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: 1,
            name: "Test Household",
            created_at: new Date().toISOString(),
          },
        ]),
      });
    });

    // Mock recipes endpoint (empty array for new user)
    await page.route("**/rest/v1/recipes?*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    // Mock meal plans endpoint
    await page.route("**/rest/v1/meal_plans?*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    // Mock realtime/websocket connections
    await page.route("**/realtime/**", async (route) => {
      await route.abort();
    });
  });

  test("should access cookbook page when authenticated", async ({ page }) => {
    await page.goto("/cookbook");
    await page.waitForLoadState("networkidle");

    // Should see cookbook content, not signup
    // Check for search input (cookbook feature)
    const searchInput = page.getByPlaceholder(/recipe/i);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Should see category buttons
    const categoryButtons = page.locator("button").filter({
      hasText: /breakfast|main|dessert|drinks|other/i,
    });
    const count = await categoryButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should access meal planner page when authenticated", async ({
    page,
  }) => {
    await page.goto("/planner");
    await page.waitForLoadState("networkidle");

    // Should see week navigation (left/right arrows or week display)
    const weekNavigation = page
      .locator("button")
      .filter({ has: page.locator("svg") });
    await expect(weekNavigation.first()).toBeVisible({ timeout: 10000 });

    // Should see day labels or the planner layout
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });

  test("should navigate between cookbook and planner", async ({ page }) => {
    // Start at cookbook
    await page.goto("/cookbook");
    await page.waitForLoadState("networkidle");

    // Wait for cookbook to load
    await expect(page.getByPlaceholder(/recipe/i)).toBeVisible({
      timeout: 10000,
    });

    // Find and click navigation to planner (usually bottom nav)
    const plannerNav = page
      .locator('a[href="/planner"], button')
      .filter({ hasText: /plan/i })
      .first();

    if (await plannerNav.isVisible()) {
      await plannerNav.click();
      await page.waitForLoadState("networkidle");

      // Verify we're on planner
      expect(page.url()).toContain("/planner");
    }
  });

  test("should show empty state in cookbook for new user", async ({ page }) => {
    await page.goto("/cookbook");
    await page.waitForLoadState("networkidle");

    // Wait for cookbook to load
    await expect(page.getByPlaceholder(/recipe/i)).toBeVisible({
      timeout: 10000,
    });

    // Click on "All Recipes" category to see recipes list
    const allRecipesButton = page.getByRole("button", { name: /all/i });

    if (await allRecipesButton.isVisible()) {
      await allRecipesButton.click();
      await page.waitForLoadState("networkidle");

      // Should show empty state or "nothing found" message
      const emptyState = page.locator("text=/nothing|no recipes|empty/i");
      await expect(emptyState).toBeVisible({ timeout: 10000 });
    }
  });
});
