import { test, expect } from "./fixtures";
import { createCollection, createRecipe } from "./factories";

const breakfastId = "10000000-0000-0000-0000-000000000001";
const dinnerId = "10000000-0000-0000-0000-000000000002";

async function longPressCollection(page: import("@playwright/test").Page, name: string) {
  const collection = page.getByRole("button", { name, exact: true });
  await collection.dispatchEvent("pointerdown", {
    pointerType: "touch",
    button: 0,
    clientX: 100,
    clientY: 100,
  });
  await page.waitForTimeout(550);
  await collection.dispatchEvent("pointerup", { pointerType: "touch" });
}

test.describe("Cookbook Collections", () => {
  test("filters by membership while All Recipes includes unassigned recipes", async ({
    page,
    setupAuth,
  }) => {
    const collections = [
      createCollection({ id: breakfastId, name: "Weekend Breakfast", color_key: "gold" }),
      createCollection({ id: dinnerId, name: "Quick Dinners", color_key: "teal" }),
    ];
    const recipes = [
      createRecipe({ name: "Pancakes", category: 5, collectionIds: [breakfastId, dinnerId] }),
      createRecipe({ name: "Legacy Breakfast", category: 1, collectionIds: [] }),
      createRecipe({ name: "Soup", category: null, collectionIds: [dinnerId] }),
    ];

    await setupAuth({ recipes, collections });
    await page.goto("/cookbook");

    await page.getByRole("button", { name: "Weekend Breakfast", exact: true }).click();
    await expect(page.getByText("Pancakes")).toBeVisible();
    await expect(page.getByText("Legacy Breakfast")).not.toBeVisible();
    await expect(page.getByText("Soup")).not.toBeVisible();

    await page.getByRole("button", { name: /back to collections/i }).click();
    await page.getByRole("button", { name: /all recipes/i }).click();
    await expect(page.getByText("Pancakes")).toBeVisible();
    await expect(page.getByText("Legacy Breakfast")).toBeVisible();
    await expect(page.getByText("Soup")).toBeVisible();
  });

  test("creates, renames, recolors, and deletes a Collection without deleting recipes", async ({
    page,
    setupAuth,
  }) => {
    const unassignedRecipe = createRecipe({ name: "Always Available", collectionIds: [] });
    await setupAuth({ recipes: [unassignedRecipe], collections: [] });
    await page.goto("/cookbook");

    await page.getByRole("button", { name: /add recipe or collection/i }).click();
    await page.getByRole("button", { name: /new collection/i }).click();
    await page.locator("#collection-name").fill("Favorites");
    await page.getByRole("button", { name: "Teal" }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("button", { name: "Favorites", exact: true })).toBeVisible();

    await longPressCollection(page, "Favorites");
    await page.getByRole("menuitem", { name: /edit/i }).click();
    await page.locator("#collection-name").fill("Dinners");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("button", { name: "Dinners", exact: true })).toBeVisible();

    await longPressCollection(page, "Dinners");
    await page.getByRole("menuitem", { name: /delete/i }).click();
    await expect(page.getByText(/recipes will stay in all recipes/i)).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByRole("button", { name: "Dinners", exact: true })).not.toBeVisible();

    await page.getByRole("button", { name: /all recipes/i }).click();
    await expect(page.getByText("Always Available")).toBeVisible();
  });

  test("searches across All Recipes from the landing page", async ({ page, setupAuth }) => {
    await setupAuth({
      recipes: [
        createRecipe({ name: "Banana Bread", collectionIds: [breakfastId] }),
        createRecipe({ name: "Chocolate Mousse", collectionIds: [] }),
      ],
      collections: [createCollection({ id: breakfastId, name: "Breakfast" })],
    });
    await page.goto("/cookbook");

    await page.getByPlaceholder(/recipe/i).fill("banana");
    await expect(page.getByText("Banana Bread")).toBeVisible();
    await expect(page.getByText("Chocolate Mousse")).not.toBeVisible();
  });
});
