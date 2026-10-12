import { test, expect } from "./fixtures";
import { createRecipe } from "./factories";

const recipeId = "00000000-0000-0000-0000-00000000c001";

const steps = [
  "Soak the wakame for 10 minutes.",
  "Simmer the dashi gently.",
  "Stir in the miso and serve.",
].map((stepText, index) => ({
  id: `step-${index + 1}`,
  recipe_id: recipeId,
  step_text: stepText,
  group_name: index === 0 ? "Broth" : null,
  sort_order: index,
  annotation: null,
}));

test.describe("Cooking mode", () => {
  test("cooks a recipe step by step and finishes", async ({ page, setupAuth }) => {
    await setupAuth({ recipes: [createRecipe({ id: recipeId, name: "Miso Soup" })], instructions: steps });

    await page.goto(`/recipe/${recipeId}`);
    await page.getByRole("button", { name: "Cook", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/cooking/${recipeId}`));

    const current = page.locator('[aria-current="step"]');
    await expect(current).toContainText("Soak the wakame");
    await expect(current).toContainText("Broth");
    // The duration in the plain step is a timer chip.
    await expect(page.getByRole("button", { name: "10 minutes" })).toBeVisible();
    await page.screenshot({ path: "test-results/cooking-screen.png" });

    await page.getByRole("button", { name: "Next" }).click();
    await expect(current).toContainText("Simmer the dashi");

    await page.getByRole("button", { name: "Ingredients" }).click();
    await expect(page.getByRole("dialog").getByText("1 servings")).toBeVisible();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Next" }).click();
    await expect(current).toContainText("Stir in the miso");
    await page.getByRole("button", { name: "Finish" }).click();
    await expect(page.getByText("Enjoy your meal!")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/recipe/${recipeId}`), { timeout: 10000 });
  });

  test("shows the pill on Home while cooking and reopens the session", async ({ page, setupAuth }) => {
    await setupAuth({ recipes: [createRecipe({ id: recipeId, name: "Miso Soup" })], instructions: steps });

    await page.goto(`/recipe/${recipeId}`);
    await page.getByRole("button", { name: "Cook", exact: true }).click();
    await expect(page.locator('[aria-current="step"]')).toContainText("Soak the wakame");

    await page.getByRole("button", { name: "Minimize" }).click();
    await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeVisible();

    await page.goto("/home");
    const pill = page.getByRole("button", { name: /Return to cooking/ });
    await expect(pill).toContainText("Miso Soup");
    await pill.click();
    await expect(page).toHaveURL(new RegExp(`/cooking/${recipeId}`));
  });
});
