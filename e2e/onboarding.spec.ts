import { test, expect } from "./fixtures";

test.describe("Onboarding Flow", () => {
  test("should load the application", async ({ page }) => {
    await page.goto("/");

    // Wait for the app to load
    await page.waitForLoadState("networkidle");

    // The app should render something
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("should show signup/login for unauthenticated users", async ({ page }) => {
    await page.goto("/");

    // Wait for the app to load
    await page.waitForLoadState("networkidle");

    // Look for common auth-related elements
    // Adjust these selectors based on your actual SignUp component
    const hasAuthContent = await page
      .locator("text=/sign up|sign in|log in|register|welcome|get started/i")
      .count();

    expect(hasAuthContent).toBeGreaterThan(0);
  });

  test("should redirect to signup when accessing protected route", async ({ page }) => {
    // Try to access a protected route
    await page.goto("/planner");

    // Wait for redirect/render
    await page.waitForLoadState("networkidle");

    // Should show signup content (not the planner)
    // The SignUp component is rendered inline (URL stays /planner)
    // Check that the planner content is NOT shown (user is blocked from accessing it)
    const hasPlannerContent = await page.locator('[data-testid="planner"]').count();
    const hasMealPlanContent = await page.locator("text=/meal plan|weekly plan/i").count();

    // If no planner content is visible, the route is protected
    const isProtected = hasPlannerContent === 0 && hasMealPlanContent === 0;

    expect(isProtected).toBeTruthy();
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

// A phone browser with its bars showing leaves about 640 px. Nothing may need a
// scroll there (toBeInViewport doesn't scroll): the phone shrinks instead, and
// its screen keeps the recordings' ratio so none of a recording is cut off.
test.describe("Value screens on a short screen", () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test.beforeEach(async ({ setupAuth }) => {
    await setupAuth({ user: { has_completed_survey: false }, household: null });
  });

  for (const path of ["/values/1", "/values/2", "/values/3", "/values/4"]) {
    test(`${path} shows title, text and button without scrolling`, async ({ page }) => {
      await page.goto(path);

      const button = page.getByRole("button", { name: /^(Next|Let's go)$/ });
      await expect(button).toBeInViewport({ ratio: 1 });
      for (const text of await page.locator("h1, p").all()) {
        await expect(text).toBeInViewport({ ratio: 1 });
      }
    });
  }

  for (const path of ["/values/2", "/values/3", "/values/4"]) {
    test(`${path} shows the whole recording`, async ({ page }) => {
      await page.goto(path);

      const video = page.locator("video");
      await expect(video).toBeInViewport({ ratio: 1 });
      const box = await video.boundingBox();
      // The recordings are 1080x2424; a box of any other ratio crops them.
      expect(box!.width / box!.height).toBeCloseTo(1080 / 2424, 2);
    });
  }
});
