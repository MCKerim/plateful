import { test, expect } from "./fixtures";

test.describe("Shopping List", () => {
  test("recently bought folds away and stays folded after a reload", async ({
    page,
    setupAuth,
  }) => {
    await setupAuth({ recipes: [], mealPlans: [] });
    // Registered after setupAuth, so it wins over the fixture's empty list.
    await page.route("**/rest/v1/shopping_list_items?*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "bought-1",
            name: "Milk",
            quantity_value: null,
            quantity_display: null,
            unit: null,
            ingredient_slug: null,
            category: null,
            on_list: false,
            added_at: "2026-10-01T10:00:00Z",
            bought_at: "2026-10-02T10:00:00Z",
            bought_count: 1,
            sources: [],
            created_at: "2026-10-01T10:00:00Z",
          },
        ]),
      })
    );

    await page.goto("/shopping");
    const header = page.getByRole("button", { name: "Recently bought" });
    await expect(header).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("Milk")).toBeVisible();

    await header.click();
    await expect(header).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByText("Milk")).toBeHidden();

    await page.reload();
    await expect(page.getByRole("button", { name: "Recently bought" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    await expect(page.getByText("Milk")).toBeHidden();
  });
});
