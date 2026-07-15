import { Page } from "@playwright/test";
import { TestScenario } from "./types";

export async function setupApiMocks(page: Page, scenario: TestScenario): Promise<void> {
  const collections = [...scenario.collections];
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
    const method = route.request().method();

    // Check if this is a single recipe fetch (contains id=eq.UUID or id=eq.number)
    const singleRecipeMatch = url.match(/id=eq\.([a-f0-9-]+)/i);

    if (singleRecipeMatch) {
      // Single recipe fetch - return single object
      const recipeId = singleRecipeMatch[1];
      const recipe = scenario.recipes.find((r) => r.id === recipeId);

      if (recipe) {
        if (method === "PATCH") {
          Object.assign(recipe, route.request().postDataJSON());
        }
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
            base_servings: null,
            instructions: null,
            calories_kcal: null,
            carbs_g: null,
            protein_g: null,
            fat_g: null,
            sugar_g: null,
            fiber_g: null,
            sodium_mg: null,
            image_path: null,
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
        status: "ready",
        recipe_ratings: recipe.avg_rating ? [{ stars: recipe.avg_rating }] : [],
        recipe_collections: recipe.collectionIds.map((collectionId) => ({
          collection_id: collectionId,
        })),
      }));

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(recipesWithRatings),
      });
    }
  });

  await page.route("**/rest/v1/collections?*", async (route) => {
    const method = route.request().method();
    const url = route.request().url();

    if (method === "POST") {
      const body = route.request().postDataJSON();
      const now = new Date().toISOString();
      const created = {
        id: crypto.randomUUID(),
        household_id: body.household_id,
        name: body.name,
        color_key: body.color_key,
        color_hex: "#E88300",
        created_by: scenario.user.id,
        created_at: now,
        updated_at: now,
        sticker_key: null,
        sticker_x: 0.72,
        sticker_y: 0.22,
      };
      collections.push(created);
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(created) });
      return;
    }

    const collectionId = url.match(/id=eq\.([a-f0-9-]+)/i)?.[1];
    if (method === "PATCH" && collectionId) {
      const collection = collections.find((item) => item.id === collectionId)!;
      Object.assign(collection, route.request().postDataJSON(), { updated_at: new Date().toISOString() });
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(collection) });
      return;
    }

    if (method === "DELETE" && collectionId) {
      const index = collections.findIndex((item) => item.id === collectionId);
      if (index >= 0) collections.splice(index, 1);
      scenario.recipes.forEach((recipe) => {
        recipe.collectionIds = recipe.collectionIds.filter((id) => id !== collectionId);
      });
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(collections),
    });
  });

  await page.route("**/rest/v1/recipe_collections?*", async (route) => {
    const recipeId = route.request().url().match(/recipe_id=eq\.([a-f0-9-]+)/i)?.[1];
    const recipe = scenario.recipes.find((item) => item.id === recipeId);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        recipe?.collectionIds.map((collectionId) => ({ collection_id: collectionId })) ?? []
      ),
    });
  });

  await page.route("**/rest/v1/rpc/replace_recipe_collections", async (route) => {
    const body = route.request().postDataJSON();
    const recipe = scenario.recipes.find((item) => item.id === body.p_recipe_id);
    if (recipe) recipe.collectionIds = body.p_collection_ids ?? [];
    await route.fulfill({ status: 204, body: "" });
  });

  for (const table of ["recipe_ingredients", "recipe_instructions"]) {
    await page.route(`**/rest/v1/${table}?*`, async (route) => {
      await route.fulfill({
        status: route.request().method() === "DELETE" ? 204 : 200,
        contentType: "application/json",
        body: route.request().method() === "DELETE" ? "" : JSON.stringify([]),
      });
    });
  }

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
