import { test, expect } from "./fixtures";

const steps = Array.from({ length: 12 }, (_, i) => `Step ${i + 1}: stir the pot for a while.`);

const snapshot = {
  name: "Pesto Pasta",
  description: "Quick and creamy.",
  instructions: null,
  instruction_steps: steps.map((step_text, sort_order) => ({
    step_text,
    group_name: null,
    sort_order,
  })),
  base_servings: 2,
  servings_unit: null,
  link: null,
  image_urls: [],
  image_folder: "e2e",
  ingredients: ["150 g Fusilli", "30 g Pesto"].map((raw_text, sort_order) => ({
    raw_text,
    quantity_value: null,
    quantity_display: null,
    unit: null,
    ingredient_name: null,
    group_name: null,
    sort_order,
    is_scalable: true,
    is_optional: false,
    preparation_note: null,
  })),
};

test.describe("Shared recipe", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/rest/v1/rpc/resolve_recipe_share", (route) =>
      route.fulfill({ json: [{ snapshot }] })
    );
    await page.goto("/share/e2e-token");
    await expect(page.getByRole("heading", { name: "Pesto Pasta" })).toBeVisible();
  });

  test("shows the servings in words, not a translation key", async ({ page }) => {
    await expect(page.getByText("2 servings", { exact: true })).toBeVisible();
  });

  test("the footer never covers the last step", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

    const lastStep = await page.getByText(steps[steps.length - 1]).boundingBox();
    const footer = await page
      .getByRole("button", { name: "Get the Plateful app" })
      .locator("..")
      .boundingBox();

    expect(lastStep!.y + lastStep!.height).toBeLessThanOrEqual(footer!.y);
  });
});
