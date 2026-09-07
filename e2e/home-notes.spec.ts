import { test, expect } from "./fixtures";
import { createNotePlan } from "./factories/meal-plan.factory";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

test.describe("Home with a planned note", () => {
  test("shows today's note under the plan headline", async ({ page, setupAuth }) => {
    const note = createNotePlan({ text: "Birthday", planned_date: formatDate(new Date()) });

    await setupAuth({ recipes: [], mealPlans: [note] });

    await page.goto("/home");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /planned for today/i })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Birthday")).toBeVisible();
    await expect(page.getByRole("button", { name: /cooked it/i })).toHaveCount(0);
  });
});
