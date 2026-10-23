import { test, expect } from "./fixtures";
import { createRecipe } from "./factories";

test.describe("Recipe Detail Page", () => {
  test("should display recipe details", async ({ page, setupAuth }) => {
    const recipeId = "00000000-0000-0000-0000-000000000001";
    const recipe = createRecipe({
      id: recipeId,
      name: "Spaghetti Carbonara",
      description: "A classic Italian pasta dish with eggs, cheese, and pancetta.",
      category: 2,
      link: "https://example.com/carbonara",
    });

    await setupAuth({ recipes: [recipe] });

    await page.goto(`/recipe/${recipeId}`);
    await page.waitForLoadState("networkidle");

    // Should display recipe name
    // `.first()`: the print view repeats the title in a second h1 that is
    // only hidden once the stylesheet has loaded.
    await expect(page.getByRole("heading", { name: "Spaghetti Carbonara" }).first()).toBeVisible({
      timeout: 10000,
    });

    // Should display recipe description
    await expect(page.getByText(/classic Italian pasta/i).first()).toBeVisible();

    // Should have link to original recipe
    const recipeLink = page.getByRole("link", { name: "Open original recipe" });
    await expect(recipeLink).toBeVisible();
  });

  test("should offer a rating for a new recipe", async ({ page, setupAuth }) => {
    const recipeId = "00000000-0000-0000-0000-000000000002";
    const recipe = createRecipe({
      id: recipeId,
      name: "New Recipe",
      description: "A brand new recipe",
    });

    await setupAuth({ recipes: [recipe] });

    await page.goto(`/recipe/${recipeId}`);
    await page.waitForLoadState("networkidle");

    // Should display recipe name
    await expect(page.getByRole("heading", { name: "New Recipe" }).first()).toBeVisible({
      timeout: 10000,
    });

    // No ratings yet: the button offers the first one, and no list heading shows
    await expect(page.getByRole("button", { name: "Rate This Recipe" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ratings" })).toHaveCount(0);
  });

  test("should have edit button that navigates to edit page", async ({ page, setupAuth }) => {
    const recipeId = "00000000-0000-0000-0000-000000000003";
    const recipe = createRecipe({
      id: recipeId,
      name: "Editable Recipe",
    });

    await setupAuth({ recipes: [recipe] });

    await page.goto(`/recipe/${recipeId}`);
    await page.waitForLoadState("networkidle");

    // Should display recipe name
    await expect(page.getByRole("heading", { name: "Editable Recipe" }).first()).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole("button", { name: "More actions" }).click();
    // Find and click edit button
    const editButton = page.getByRole("menuitem", { name: "Edit" });
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Should navigate to edit page
    await page.waitForURL(new RegExp(`/recipe/edit/${recipeId}`));
    expect(page.url()).toContain(`/recipe/edit/${recipeId}`);
  });

  test("should have plan meal button", async ({ page, setupAuth }) => {
    const recipeId = "00000000-0000-0000-0000-000000000004";
    const recipe = createRecipe({
      id: recipeId,
      name: "Plannable Recipe",
    });

    await setupAuth({ recipes: [recipe] });

    await page.goto(`/recipe/${recipeId}`);
    await page.waitForLoadState("networkidle");

    // Should display recipe name
    await expect(page.getByRole("heading", { name: "Plannable Recipe" }).first()).toBeVisible({
      timeout: 10000,
    });

    // Should have plan meal button
    const planButton = page.getByRole("button", { name: "Plan", exact: true });
    await expect(planButton).toBeVisible();
  });

  test("should navigate back from recipe detail to cookbook", async ({ page, setupAuth }) => {
    const recipeId = "00000000-0000-0000-0000-000000000005";
    const recipe = createRecipe({
      id: recipeId,
      name: "Navigation Test Recipe",
      category: 2,
    });

    await setupAuth({ recipes: [recipe] });

    // Start at the Collection landing page and open All Recipes
    await page.goto("/cookbook");
    await page.waitForLoadState("networkidle");

    const allRecipesButton = page.getByRole("button", { name: /all recipes/i });
    await expect(allRecipesButton).toBeVisible({ timeout: 10000 });
    await allRecipesButton.click();
    await page.waitForLoadState("networkidle");

    // Click on the recipe to go to detail page
    await page.getByText("Navigation Test Recipe").click();
    await page.waitForURL(new RegExp(`/recipe/${recipeId}`));

    // Verify we're on the recipe page
    await expect(page.getByRole("heading", { name: "Navigation Test Recipe" }).first()).toBeVisible(
      {
        timeout: 10000,
      }
    );

    // Go back using browser back
    await page.goBack();
    await page.waitForLoadState("networkidle");

    // Should be back on cookbook
    expect(page.url()).toContain("/cookbook");
  });
});

// Celine's Galaxy in German (2026-10-23): "Weiterkochen" pushed the cook
// button off a 360 px screen, and the week plan dialog was taller than the
// screen, its close button and Save out of reach. The Plan sheet replaced it.
test.describe("Recipe Detail Page on a small German phone", () => {
  test.use({ viewport: { width: 360, height: 640 } });
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("i18nextLng", "de"));
  });

  const recipeId = "00000000-0000-0000-0000-0000000000d1";
  const steps = ["Zwiebeln anbraten.", "Mit Brühe ablöschen."].map((stepText, index) => ({
    id: `step-${index + 1}`,
    recipe_id: recipeId,
    step_text: stepText,
    group_name: null,
    sort_order: index,
    annotation: null,
  }));

  test("keeps Weiterkochen on screen by dropping the words of Ask and Plan", async ({
    page,
    setupAuth,
  }) => {
    await setupAuth({
      recipes: [createRecipe({ id: recipeId, name: "Zwiebelsuppe" })],
      instructions: steps,
    });

    await page.goto(`/recipe/${recipeId}`);
    await page.getByRole("button", { name: "Kochen", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/cooking/${recipeId}`));
    // The session exists once the first step shows.
    await expect(page.locator('[aria-current="step"]')).toContainText("Zwiebeln anbraten");
    await page.goBack();

    const cook = page.getByRole("button", { name: "Weiterkochen" });
    await expect(cook).toBeVisible();
    const box = (await cook.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(360);
    // The whole word, no ellipsis.
    const text = cook.locator("span");
    expect(await text.evaluate((span) => span.scrollWidth <= span.clientWidth)).toBe(true);
    // Ask and Plan keep their names for screen readers.
    await expect(page.getByRole("button", { name: "Fragen" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Planen" })).toBeVisible();
  });

  test("fits the Plan sheet on the screen and closes it without leaving the recipe", async ({
    page,
    setupAuth,
  }) => {
    await setupAuth({
      recipes: [createRecipe({ id: recipeId, name: "Zwiebelsuppe" })],
      instructions: steps,
    });

    await page.goto(`/recipe/${recipeId}`);
    await page.getByRole("button", { name: "Planen" }).click();

    const sheet = page.getByRole("dialog", { name: "Planen" });
    const save = sheet.getByRole("button", { name: "Plan aktualisieren" });
    await expect(save).toBeDisabled();
    // Retried until the sheet has slid all the way up.
    await expect(sheet).toBeInViewport({ ratio: 1 });
    await expect(save).toBeInViewport({ ratio: 1 });

    // No close button: Escape (Android's back button sends it) closes the sheet.
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`/recipe/${recipeId}`));
  });
});
