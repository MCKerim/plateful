import { test, expect } from "./fixtures";
import { createRecipe } from "./factories";
import { createMealPlan } from "./factories/meal-plan.factory";

// Helper to get date string in YYYY-MM-DD format
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

test.describe("Meal Planner Page", () => {
  test("should display week navigation", async ({ page, setupAuth }) => {
    await setupAuth({ recipes: [], mealPlans: [] });

    await page.goto("/planner");
    await page.waitForLoadState("networkidle");

    // Should see "This Week" heading
    const weekHeading = page.getByRole("heading", { name: /this week/i });
    await expect(weekHeading).toBeVisible({ timeout: 10000 });

    // Should have day labels
    await expect(page.getByText(/mon -/i)).toBeVisible();
  });

  test("should display planned meals for current week", async ({ page, setupAuth }) => {
    const recipe = createRecipe({
      id: 1,
      name: "Planned Dinner",
      category: 2,
    });

    const today = new Date();
    const mealPlan = createMealPlan({
      id: 1,
      recipe_id: recipe.id,
      planned_date: formatDate(today),
      days: 1,
      daysEaten: 0,
      recipes: { id: recipe.id, name: recipe.name },
    });

    await setupAuth({ recipes: [recipe], mealPlans: [mealPlan] });

    await page.goto("/planner");
    await page.waitForLoadState("networkidle");

    // Should see the planned recipe name
    await expect(page.getByText("Planned Dinner")).toBeVisible({ timeout: 10000 });
  });

  test("should display unplanned items section", async ({ page, setupAuth }) => {
    const recipe = createRecipe({
      id: 2,
      name: "Unplanned Meal",
      category: 2,
    });

    const mealPlan = createMealPlan({
      id: 2,
      recipe_id: recipe.id,
      planned_date: null, // No date = unplanned
      days: 2,
      daysEaten: 0,
      recipes: { id: recipe.id, name: recipe.name },
    });

    await setupAuth({ recipes: [recipe], mealPlans: [mealPlan] });

    await page.goto("/planner");
    await page.waitForLoadState("networkidle");

    // Should see unplanned section with count > 0
    const unplannedButton = page.getByRole("button", { name: /no date - 1/i });
    await expect(unplannedButton).toBeVisible({ timeout: 10000 });

    // Click to expand
    await unplannedButton.click();

    // Should see the unplanned recipe (use first() to avoid strict mode)
    await expect(page.getByText("Unplanned Meal").first()).toBeVisible({ timeout: 5000 });
  });

  test("should show empty state when no meals planned", async ({ page, setupAuth }) => {
    await setupAuth({ recipes: [], mealPlans: [] });

    await page.goto("/planner");
    await page.waitForLoadState("networkidle");

    // Wait for page to load - should see This Week heading
    const weekHeading = page.getByRole("heading", { name: /this week/i });
    await expect(weekHeading).toBeVisible({ timeout: 10000 });

    // Should show "No Date - 0" for unplanned section
    await expect(page.getByText(/no date - 0/i)).toBeVisible();
  });

  test("should click on planned item to view recipe", async ({ page, setupAuth }) => {
    const recipe = createRecipe({
      id: 10,
      name: "Clickable Recipe",
      category: 2,
    });

    const today = new Date();
    const mealPlan = createMealPlan({
      id: 1,
      recipe_id: recipe.id,
      planned_date: formatDate(today),
      days: 1,
      recipes: { id: recipe.id, name: recipe.name },
    });

    await setupAuth({ recipes: [recipe], mealPlans: [mealPlan] });

    await page.goto("/planner");
    await page.waitForLoadState("networkidle");

    // Click on the recipe name
    const recipeLink = page.getByText("Clickable Recipe");
    await expect(recipeLink).toBeVisible({ timeout: 10000 });
    await recipeLink.click();

    // Should navigate to recipe detail page
    await page.waitForURL(/\/recipe\/10/);
    expect(page.url()).toContain("/recipe/10");
  });

  test("should display days of the week", async ({ page, setupAuth }) => {
    await setupAuth({ recipes: [], mealPlans: [] });

    await page.goto("/planner");
    await page.waitForLoadState("networkidle");

    // Should see day labels for all 7 days
    await expect(page.getByText(/mon -/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/tue -/i)).toBeVisible();
    await expect(page.getByText(/wed -/i)).toBeVisible();
    await expect(page.getByText(/thu -/i)).toBeVisible();
    await expect(page.getByText(/fri -/i)).toBeVisible();
    await expect(page.getByText(/sat -/i)).toBeVisible();
    await expect(page.getByText(/sun -/i)).toBeVisible();
  });
});
