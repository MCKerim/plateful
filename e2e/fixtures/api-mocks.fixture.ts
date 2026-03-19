import { Page } from "@playwright/test";
import { TestScenario } from "./types";

export async function setupApiMocks(page: Page, scenario: TestScenario): Promise<void> {
  // Users endpoint - handles both single user fetch and household members
  await page.route("**/rest/v1/users?*", async (route) => {
    const url = route.request().url();
    const isSingleUserFetch = url.includes("select=*") || url.includes("select=%2A");

    if (isSingleUserFetch) {
      // Single user fetch with household join
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...scenario.user,
          household: scenario.household,
        }),
      });
    } else {
      // Household members fetch - returns array
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: scenario.user.id,
            email: scenario.user.email,
            username: scenario.user.username,
          },
        ]),
      });
    }
  });

  // Households endpoint
  await page.route("**/rest/v1/households?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(scenario.household ? [scenario.household] : []),
    });
  });

  // Recipes endpoint - handles both list and single recipe fetches
  await page.route("**/rest/v1/recipes?*", async (route) => {
    const url = route.request().url();

    // Check if this is a single recipe fetch (contains id=eq.UUID or id=eq.number)
    const singleRecipeMatch = url.match(/id=eq\.([a-f0-9-]+)/i);

    if (singleRecipeMatch) {
      // Single recipe fetch - return single object
      const recipeId = singleRecipeMatch[1];
      const recipe = scenario.recipes.find((r) => r.id === recipeId);

      if (recipe) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: recipe.id,
            name: recipe.name,
            description: recipe.description,
            category: recipe.category,
            link: recipe.link,
            household_id: recipe.household_id,
            created_at: recipe.created_at,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(null),
        });
      }
    } else {
      // List fetch - transform recipes to include recipe_ratings array (expected by cookbook API)
      const recipesWithRatings = scenario.recipes.map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        category: recipe.category,
        created_at: recipe.created_at,
        recipe_ratings: recipe.avg_rating ? [{ stars: recipe.avg_rating }] : [],
      }));

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(recipesWithRatings),
      });
    }
  });

  // Meal plans endpoint (meal_plans table)
  await page.route("**/rest/v1/meal_plans?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(scenario.mealPlans),
    });
  });

  // Meal planning endpoint (alternate table name)
  await page.route("**/rest/v1/meal_planning?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(scenario.mealPlans),
    });
  });

  // Recipe ratings endpoint
  await page.route("**/rest/v1/recipe_ratings?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  // Subscription endpoint - return active subscription so paywall is bypassed
  await page.route("**/rest/v1/household_subscriptions?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "test-sub-id",
        household_id: scenario.household?.id ?? "test-household-id",
        payer_user_id: scenario.user.id,
        is_active: true,
        updated_at: new Date().toISOString(),
        payer: { username: scenario.user.username },
      }),
    });
  });

  // Storage endpoint for recipe images
  await page.route("**/storage/v1/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
}
