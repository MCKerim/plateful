import { test, expect } from "./fixtures";
import { createRecipe } from "./factories";

const recipeId = "00000000-0000-0000-0000-0000000000c1";
const recipe = () =>
  createRecipe({
    id: recipeId,
    name: "Linsensuppe",
    nutrition: { calories_kcal: 500, carbs_g: 60, protein_g: 20, fat_g: 15, fiber_g: 6 },
  });

// The collapsed card reads "K 54": the letter, then the number.
const carbsTile = (page: import("@playwright/test").Page, letter: string) =>
  page
    .locator("span", { hasText: new RegExp(`^${letter}$`) })
    .locator("xpath=following-sibling::span");

test.describe("Carb counting", () => {
  test.describe("in Germany", () => {
    test.use({ locale: "de-DE", viewport: { width: 390, height: 844 } });
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem("i18nextLng", "de"));
    });

    test("shows carbs without fiber, and with fiber once chosen", async ({ page, setupAuth }) => {
      await setupAuth({ recipes: [recipe()] });

      await page.goto(`/recipe/${recipeId}`);
      await expect(carbsTile(page, "K")).toHaveText("54", { timeout: 10000 });

      await page.goto("/settings");
      await page.getByRole("button", { name: "Nährwerte" }).click();
      await expect(page.getByRole("heading", { name: "Nährwerte" })).toBeVisible();
      await expect(
        page.getByText(/Bundeslebensmittelschlüssel \(BLS\), Version 4\.0/)
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Lizenz CC BY 4.0" })).toHaveAttribute(
        "href",
        "https://creativecommons.org/licenses/by/4.0/"
      );
      await expect(page.getByRole("combobox")).toHaveText("Ohne Ballaststoffe");

      await page.getByRole("combobox").click();
      await page.getByRole("option", { name: "Mit Ballaststoffen" }).click();

      await page.goto(`/recipe/${recipeId}`);
      await expect(carbsTile(page, "K")).toHaveText("60", { timeout: 10000 });
    });
  });

  test.describe("in the editor in Germany", () => {
    test.use({ locale: "de-DE" });

    test("shows carbs without fiber and saves them with fiber", async ({ page, setupAuth }) => {
      await setupAuth({ recipes: [{ ...recipe(), nutrition_auto: false }] });

      await page.goto(`/recipe/edit/${recipeId}`);
      const carbs = page.locator("#nutrition-carbs_g");
      await expect(carbs).toHaveValue("54", { timeout: 10000 });

      await carbs.fill("50");
      const patch = page.waitForRequest(
        (request) => request.method() === "PATCH" && request.url().includes("/rest/v1/recipes?")
      );
      await page.getByRole("button", { name: /save/i }).click();

      expect((await patch).postDataJSON()).toMatchObject({ carbs_g: 56, fiber_g: 6 });
    });
  });

  test.describe("in the US", () => {
    test.use({ locale: "en-US" });

    test("shows the stored carbs, fiber included", async ({ page, setupAuth }) => {
      await setupAuth({ recipes: [recipe()] });

      await page.goto(`/recipe/${recipeId}`);
      await expect(carbsTile(page, "C")).toHaveText("60", { timeout: 10000 });
    });
  });
});
