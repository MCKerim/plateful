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
    await expect(page.getByRole("heading", { name: "Spaghetti Carbonara" })).toBeVisible({
      timeout: 10000,
    });

    // Should display recipe description
    await expect(page.getByText(/classic Italian pasta/i)).toBeVisible();

    // Should have link to original recipe
    const recipeLink = page.getByRole("link", { name: /to the recipe/i });
    await expect(recipeLink).toBeVisible();
  });

  test("should display no ratings message for new recipe", async ({ page, setupAuth }) => {
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
    await expect(page.getByRole("heading", { name: "New Recipe" })).toBeVisible({
      timeout: 10000,
    });

    // Should show no ratings message
    await expect(page.getByText(/no ratings/i)).toBeVisible();
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
    await expect(page.getByRole("heading", { name: "Editable Recipe" })).toBeVisible({
      timeout: 10000,
    });

    // Find and click edit button
    const editButton = page.getByRole("button", { name: "Edit Recipe" });
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
    await expect(page.getByRole("heading", { name: "Plannable Recipe" })).toBeVisible({
      timeout: 10000,
    });

    // Should have plan meal button
    const planButton = page.getByRole("button", { name: /plan/i });
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

    // Start at cookbook, click on a category to see the recipe
    await page.goto("/cookbook");
    await page.waitForLoadState("networkidle");

    // Click on Main category
    const mainButton = page.getByRole("button", { name: /main/i });
    await expect(mainButton).toBeVisible({ timeout: 10000 });
    await mainButton.click();
    await page.waitForLoadState("networkidle");

    // Click on the recipe to go to detail page
    await page.getByText("Navigation Test Recipe").click();
    await page.waitForURL(new RegExp(`/recipe/${recipeId}`));

    // Verify we're on the recipe page
    await expect(page.getByRole("heading", { name: "Navigation Test Recipe" })).toBeVisible({
      timeout: 10000,
    });

    // Go back using browser back
    await page.goBack();
    await page.waitForLoadState("networkidle");

    // Should be back on cookbook
    expect(page.url()).toContain("/cookbook");
  });
});
