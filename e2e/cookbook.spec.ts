import { test, expect } from "./fixtures";
import { createRecipe } from "./factories";

test.describe("Cookbook Page", () => {
  test("should display recipes when clicking on a category", async ({
    page,
    setupAuth,
  }) => {
    // Create recipes for different categories
    const recipes = [
      createRecipe({ id: 1, name: "Pancakes", category: 1 }), // Breakfast
      createRecipe({ id: 2, name: "Omelette", category: 1 }), // Breakfast
      createRecipe({ id: 3, name: "Spaghetti", category: 2 }), // Main
      createRecipe({ id: 4, name: "Chicken Curry", category: 2 }), // Main
      createRecipe({ id: 5, name: "Chocolate Cake", category: 3 }), // Dessert
    ];

    await setupAuth({ recipes });

    await page.goto("/cookbook");
    await page.waitForLoadState("networkidle");

    // Should see category buttons
    const breakfastButton = page.getByRole("button", { name: /breakfast/i });
    await expect(breakfastButton).toBeVisible({ timeout: 10000 });

    // Click on Breakfast category
    await breakfastButton.click();
    await page.waitForLoadState("networkidle");

    // Should see breakfast recipes
    await expect(page.getByText("Pancakes")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Omelette")).toBeVisible();

    // Should NOT see recipes from other categories
    await expect(page.getByText("Spaghetti")).not.toBeVisible();
    await expect(page.getByText("Chocolate Cake")).not.toBeVisible();
  });

  test("should display all recipes when clicking All Recipes", async ({
    page,
    setupAuth,
  }) => {
    const recipes = [
      createRecipe({ id: 1, name: "Morning Smoothie", category: 1 }),
      createRecipe({ id: 2, name: "Pasta Carbonara", category: 2 }),
      createRecipe({ id: 3, name: "Apple Pie", category: 3 }),
    ];

    await setupAuth({ recipes });

    await page.goto("/cookbook");
    await page.waitForLoadState("networkidle");

    // Click on "All Recipes" category
    const allRecipesButton = page.getByRole("button", { name: /all/i });
    await expect(allRecipesButton).toBeVisible({ timeout: 10000 });
    await allRecipesButton.click();
    await page.waitForLoadState("networkidle");

    // Should see all recipes regardless of category
    await expect(page.getByText("Morning Smoothie")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Pasta Carbonara")).toBeVisible();
    await expect(page.getByText("Apple Pie")).toBeVisible();
  });

  test("should navigate to recipe detail when clicking a recipe", async ({
    page,
    setupAuth,
  }) => {
    const recipes = [
      createRecipe({ id: 42, name: "Special Recipe", category: 2 }),
    ];

    await setupAuth({ recipes });

    await page.goto("/cookbook");
    await page.waitForLoadState("networkidle");

    // Click on Main category to see the recipe
    const mainButton = page.getByRole("button", { name: /main/i });
    await expect(mainButton).toBeVisible({ timeout: 10000 });
    await mainButton.click();
    await page.waitForLoadState("networkidle");

    // Click on the recipe
    const recipeCard = page.getByText("Special Recipe");
    await expect(recipeCard).toBeVisible({ timeout: 10000 });
    await recipeCard.click();

    // Should navigate to recipe detail page
    await page.waitForURL(/\/recipe\/42/);
    expect(page.url()).toContain("/recipe/42");
  });

  test("should search for recipes", async ({ page, setupAuth }) => {
    const recipes = [
      createRecipe({ id: 1, name: "Banana Bread", category: 1 }),
      createRecipe({ id: 2, name: "Banana Smoothie", category: 4 }),
      createRecipe({ id: 3, name: "Chocolate Mousse", category: 3 }),
    ];

    await setupAuth({ recipes });

    await page.goto("/cookbook");
    await page.waitForLoadState("networkidle");

    // Find and use the search input
    const searchInput = page.getByPlaceholder(/recipe/i);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Search for "banana"
    await searchInput.fill("banana");
    await page.waitForLoadState("networkidle");

    // Should see banana recipes
    await expect(page.getByText("Banana Bread")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Banana Smoothie")).toBeVisible();

    // Should NOT see non-matching recipes
    await expect(page.getByText("Chocolate Mousse")).not.toBeVisible();
  });
});
