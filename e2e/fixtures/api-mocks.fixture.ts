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

  // Recipes endpoint
  await page.route("**/rest/v1/recipes?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(scenario.recipes),
    });
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

  // Storage endpoint for recipe images
  await page.route("**/storage/v1/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
}
