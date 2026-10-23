import { test, expect } from "./fixtures";
import { createRecipe } from "./factories";
import { createMealPlan, createNotePlan, formatDate } from "./factories/meal-plan.factory";

/** A day's name in the Plan sheet: its section's toggle is labelled with the long date. */
function longDate(date: Date): string {
  return new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long" }).format(
    date
  );
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
      name: "Planned Dinner",
      category: 2,
    });

    const today = new Date();
    const mealPlan = createMealPlan({
      recipe_id: recipe.id,
      planned_date: formatDate(today),
      recipes: { id: recipe.id, name: recipe.name, tags: recipe.tags },
    });

    await setupAuth({ recipes: [recipe], mealPlans: [mealPlan] });

    await page.goto("/planner");
    await page.waitForLoadState("networkidle");

    // Should see the planned recipe name
    await expect(page.getByText("Planned Dinner")).toBeVisible({ timeout: 10000 });
  });

  test("should display unplanned items section", async ({ page, setupAuth }) => {
    const recipe = createRecipe({
      name: "Unplanned Meal",
      category: 2,
    });

    const mealPlan = createMealPlan({
      recipe_id: recipe.id,
      planned_date: null, // No date = unplanned
      recipes: { id: recipe.id, name: recipe.name, tags: recipe.tags },
    });

    await setupAuth({ recipes: [recipe], mealPlans: [mealPlan] });

    await page.goto("/planner");
    await page.waitForLoadState("networkidle");

    // Should see unplanned section with count > 0
    const unplannedButton = page.getByRole("button", { name: /pool - 1/i });
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

    // Should show "Pool - 0" for unplanned section
    await expect(page.getByText(/pool - 0/i)).toBeVisible();
  });

  test("should click on planned item to view recipe", async ({ page, setupAuth }) => {
    const recipeId = "00000000-0000-0000-0000-000000000010";
    const recipe = createRecipe({
      id: recipeId,
      name: "Clickable Recipe",
      category: 2,
    });

    const today = new Date();
    const mealPlan = createMealPlan({
      recipe_id: recipe.id,
      planned_date: formatDate(today),
      recipes: { id: recipe.id, name: recipe.name, tags: recipe.tags },
    });

    await setupAuth({ recipes: [recipe], mealPlans: [mealPlan] });

    await page.goto("/planner");
    await page.waitForLoadState("networkidle");

    // Click on the recipe name
    const recipeLink = page.getByText("Clickable Recipe");
    await expect(recipeLink).toBeVisible({ timeout: 10000 });
    await recipeLink.click();

    // Should navigate to recipe detail page
    await page.waitForURL(new RegExp(`/recipe/${recipeId}`));
    expect(page.url()).toContain(`/recipe/${recipeId}`);
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

  test("should show a note on its day without a cooked check", async ({ page, setupAuth }) => {
    const note = createNotePlan({ text: "Eating out", planned_date: formatDate(new Date()) });

    await setupAuth({ recipes: [], mealPlans: [note] });

    await page.goto("/planner");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Eating out")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /cooked it/i })).toHaveCount(0);
  });

  test("should list a day's notes after all its dishes, even one written before breakfast", async ({
    page,
    setupAuth,
  }) => {
    const today = formatDate(new Date());
    const at = (minute: number) => new Date(2026, 0, 1, 12, minute).toISOString();
    const [brownie, pasta, pancakes] = ["Brownie", "Pasta", "Pancakes"].map((name) =>
      createRecipe({ name })
    );
    const dish = (recipe: typeof brownie, meal_type: string | null, minute: number) =>
      createMealPlan({
        recipe_id: recipe.id,
        planned_date: today,
        meal_type,
        created_at: at(minute),
        recipes: { id: recipe.id, name: recipe.name, tags: recipe.tags },
      });
    // The note is the day's oldest row and still holds a type from an older build.
    await setupAuth({
      recipes: [brownie, pasta, pancakes],
      mealPlans: [
        createNotePlan({ text: "Eating out", meal_type: "breakfast", created_at: at(0) }),
        dish(brownie, "snack", 1),
        dish(pasta, null, 2),
        dish(pancakes, "breakfast", 3),
      ],
    });

    await page.goto("/planner");
    const entries = page.getByRole("listitem");
    await expect(entries).toHaveText([/Pancakes/, /Pasta/, /Brownie/, /Eating out/], {
      timeout: 10000,
    });
    // The dishes keep their chips; the note shows none, whatever its row holds.
    await expect(entries.nth(0)).toContainText("Breakfast");
    await expect(entries.nth(3)).toHaveText("Eating out");

    // The Plan sheet lists the day in the same order.
    await entries.nth(3).getByRole("button").last().click();
    await page.getByRole("dialog").getByRole("button", { name: "Edit Plan" }).click();
    const sheet = page.getByRole("dialog", { name: "Plan" });
    const todaySection = sheet
      .locator("section")
      .filter({ has: page.getByRole("button", { name: longDate(new Date()) }) });
    await expect(todaySection).toHaveText(/Pancakes.*Pasta.*Brownie.*Eating out/);
  });

  test("should add a note to an empty day through the chooser", async ({ page, setupAuth }) => {
    await setupAuth({ recipes: [], mealPlans: [] });

    await page.goto("/planner");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /this week/i })).toBeVisible({ timeout: 10000 });

    // The first empty day card opens the recipe-or-note chooser
    await page
      .getByRole("button")
      .filter({ has: page.locator("svg.lucide-plus") })
      .first()
      .click();
    await page.getByRole("button", { name: /^note$/i }).click();

    // The suggestion fills the field, Add creates the note
    await page.getByRole("button", { name: "Leftovers" }).click();
    await page.getByRole("button", { name: /^add$/i }).click();

    // The note lands on the day's card; the dialog still shows the same text
    // while it closes, so look inside the plan.
    await expect(page.getByRole("listitem").getByText("Leftovers")).toBeVisible({ timeout: 10000 });
  });

  test("should plan a breakfast-tagged recipe as breakfast", async ({ page, setupAuth }) => {
    const recipe = createRecipe({ name: "Pancakes", tags: ["breakfast"] });
    await setupAuth({ recipes: [recipe], mealPlans: [] });

    await page.goto(`/recipe/${recipe.id}`);
    await page.getByRole("button", { name: "Plan", exact: true }).click();

    const sheet = page.getByRole("dialog", { name: "Plan" });
    await expect(sheet.getByRole("radiogroup", { name: "Meal type" })).toBeVisible();
    await expect(sheet.getByRole("radio", { name: "Breakfast" })).toBeChecked();

    await sheet.getByRole("button", { name: longDate(new Date()) }).click();
    const save = page.waitForRequest("**/rest/v1/rpc/apply_planner_changes");
    await sheet.getByRole("button", { name: "Plan for 1 day" }).click();
    const body = (await save).postDataJSON();
    expect(body.p_insertions.map((entry: { meal_type: string }) => entry.meal_type)).toEqual([
      "breakfast",
    ]);
    await expect(sheet).toBeHidden();

    // The new entry carries the chip in the planner.
    await page.goto("/planner");
    await expect(page.getByRole("listitem").filter({ hasText: "Pancakes" })).toContainText(
      "Breakfast",
      { timeout: 10000 }
    );
  });

  test("should preselect the recipe's last meal type over its tags", async ({
    page,
    setupAuth,
  }) => {
    const recipe = createRecipe({ name: "Shakshuka", tags: ["breakfast"] });
    const placement = (meal_type: string | null, minute: number) =>
      createMealPlan({
        recipe_id: recipe.id,
        planned_date: null,
        eaten: true,
        meal_type,
        created_at: new Date(2026, 0, 1, 12, minute).toISOString(),
        recipes: { id: recipe.id, name: recipe.name, tags: recipe.tags },
      });
    // The newest placement has no type (an older client); the one before it holds the choice.
    await setupAuth({
      recipes: [recipe],
      mealPlans: [placement("lunch", 0), placement("snack", 1), placement(null, 2)],
    });

    await page.goto(`/recipe/${recipe.id}`);
    await page.getByRole("button", { name: "Plan", exact: true }).click();
    await expect(page.getByRole("dialog").getByRole("radio", { name: "Snack" })).toBeChecked();
  });

  test("should change an entry's meal type from its menu", async ({ page, setupAuth }) => {
    const omelette = createRecipe({ name: "Omelette" });
    const pasta = createRecipe({ name: "Pasta" });
    const today = formatDate(new Date());
    const plans = [omelette, pasta].map((recipe, index) =>
      createMealPlan({
        recipe_id: recipe.id,
        planned_date: today,
        created_at: new Date(2026, 0, 1, 12, index).toISOString(),
        recipes: { id: recipe.id, name: recipe.name, tags: recipe.tags },
      })
    );
    await setupAuth({ recipes: [omelette, pasta], mealPlans: plans });

    await page.goto("/planner");
    const entries = page.getByRole("listitem");
    await expect(entries).toHaveText([/Omelette/, /Pasta/], { timeout: 10000 });

    await entries.filter({ hasText: "Pasta" }).getByRole("button").last().click();
    const menu = page.getByRole("radiogroup", { name: "Meal type" });
    await expect(menu.getByRole("radio", { name: "Dinner" })).toBeChecked();

    const patch = page.waitForRequest(
      (request) => request.method() === "PATCH" && request.url().includes("meal_planning")
    );
    await menu.getByRole("radio", { name: "Breakfast" }).click();
    expect((await patch).postDataJSON()).toEqual({ meal_type: "breakfast" });
    await expect(menu.getByRole("radio", { name: "Breakfast" })).toBeChecked();

    // Breakfast leads the day, ahead of the older dinner.
    await page.keyboard.press("Escape");
    await expect(entries).toHaveText([/Pasta.*Breakfast/, /Omelette/]);
  });

  test("should plan a note again without a meal type", async ({ page, setupAuth }) => {
    const note = createNotePlan({ text: "Eating out" });
    await setupAuth({ recipes: [], mealPlans: [note] });

    await page.goto("/planner");
    await page
      .getByRole("listitem")
      .filter({ hasText: "Eating out" })
      .getByRole("button")
      .last()
      .click();
    // The note's menu offers no meal type, only its plan, text and removal.
    const menu = page.getByRole("dialog");
    await expect(menu.getByRole("button", { name: "Edit note" })).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "Meal type" })).toHaveCount(0);
    await menu.getByRole("button", { name: "Edit Plan" }).click();

    const sheet = page.getByRole("dialog", { name: "Plan" });
    await sheet.getByRole("button", { name: "Pool", exact: true }).click();
    await expect(sheet.getByRole("radiogroup", { name: "Meal type" })).toHaveCount(0);

    const save = page.waitForRequest("**/rest/v1/rpc/apply_planner_changes");
    await sheet.getByRole("button", { name: "Add to pool" }).click();
    const body = (await save).postDataJSON();
    expect(body.p_note_id).toBe(note.note_id);
    expect(body.p_insertions).toEqual([
      { id: expect.any(String), planned_date: null, meal_type: null },
    ]);
  });
});

test.describe("Plan sheet", () => {
  /** The test account's weeks start on Monday (`week_start: 1`). */
  function mondayOf(date: Date, weeks = 0): Date {
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((date.getDay() + 6) % 7) + weeks * 7);
    return monday;
  }

  test("plans two days across two weeks and stays on the recipe", async ({ page, setupAuth }) => {
    const recipe = createRecipe({ name: "Shakshuka" });
    await setupAuth({ recipes: [recipe], mealPlans: [] });
    const today = new Date();
    const nextMonday = mondayOf(today, 1);

    await page.goto(`/recipe/${recipe.id}`);
    await page.getByRole("button", { name: "Plan", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Plan" });
    await expect(sheet.getByRole("button", { name: "Update plan" })).toBeDisabled();

    await sheet.getByRole("button", { name: longDate(today) }).click();
    await expect(sheet.getByRole("button", { name: "Plan for 1 day" })).toBeEnabled();
    // The chevron; the title button reads "Next Week" once there.
    await sheet.getByRole("button", { name: "Next week", exact: true }).click();
    await expect(sheet.getByRole("button", { name: "Next Week", exact: true })).toBeVisible();
    await sheet.getByRole("button", { name: longDate(nextMonday) }).click();

    const save = page.waitForRequest("**/rest/v1/rpc/apply_planner_changes");
    await sheet.getByRole("button", { name: "Plan for 2 days" }).click();
    const body = (await save).postDataJSON();
    expect(body.p_recipe_id).toBe(recipe.id);
    expect(body.p_delete_ids).toEqual([]);
    expect(body.p_insertions).toEqual([
      { id: expect.any(String), planned_date: formatDate(today), meal_type: "dinner" },
      { id: expect.any(String), planned_date: formatDate(nextMonday), meal_type: "dinner" },
    ]);

    // As on iOS the user stays on the recipe; the toast confirms.
    await expect(sheet).toBeHidden();
    await expect(page.getByText("Recipe planned successfully!")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/recipe/${recipe.id}$`));
  });

  test("deletes the rows of planned days deselected in two weeks", async ({ page, setupAuth }) => {
    const recipe = createRecipe({ name: "Shakshuka" });
    const today = new Date();
    const nextMonday = mondayOf(today, 1);
    const [planned, plannedNextWeek] = [today, nextMonday].map((day) =>
      createMealPlan({
        recipe_id: recipe.id,
        planned_date: formatDate(day),
        recipes: { id: recipe.id, name: recipe.name, tags: recipe.tags },
      })
    );
    await setupAuth({ recipes: [recipe], mealPlans: [planned, plannedNextWeek] });

    await page.goto(`/recipe/${recipe.id}`);
    await page.getByRole("button", { name: "Plan", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Plan" });
    const todaySection = sheet.getByRole("button", { name: longDate(today) });
    await expect(todaySection).toHaveAttribute("aria-pressed", "true");
    await todaySection.click();
    await expect(todaySection).toHaveAttribute("aria-pressed", "false");

    // Next week's row comes with that week's read; it is planned there too.
    await sheet.getByRole("button", { name: "Next week", exact: true }).click();
    const mondaySection = sheet.getByRole("button", { name: longDate(nextMonday) });
    await expect(mondaySection).toHaveAttribute("aria-pressed", "true");
    await mondaySection.click();
    await sheet.getByRole("button", { name: "Previous week", exact: true }).click();

    const save = page.waitForRequest("**/rest/v1/rpc/apply_planner_changes");
    await sheet.getByRole("button", { name: "Update plan" }).click();
    const body = (await save).postDataJSON();
    expect(body.p_delete_ids).toEqual([planned.id, plannedNextWeek.id]);
    expect(body.p_insertions).toEqual([]);
  });

  test("puts two copies into the pool", async ({ page, setupAuth }) => {
    const recipe = createRecipe({ name: "Shakshuka" });
    await setupAuth({ recipes: [recipe], mealPlans: [] });

    await page.goto(`/recipe/${recipe.id}`);
    await page.getByRole("button", { name: "Plan", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Plan" });
    await sheet.getByRole("button", { name: "Pool", exact: true }).click();
    await expect(sheet.getByText("1 day", { exact: true })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Fewer days" })).toBeDisabled();
    await sheet.getByRole("button", { name: "More days" }).click();
    await expect(sheet.getByText("2 days", { exact: true })).toBeVisible();

    const save = page.waitForRequest("**/rest/v1/rpc/apply_planner_changes");
    await sheet.getByRole("button", { name: "Add to pool" }).click();
    const body = (await save).postDataJSON();
    expect(body.p_insertions).toEqual([
      { id: expect.any(String), planned_date: null, meal_type: "dinner" },
      { id: expect.any(String), planned_date: null, meal_type: "dinner" },
    ]);
    expect(body.p_insertions[0].id).not.toBe(body.p_insertions[1].id);
  });

  test("says when a week could not load and saves after a retry", async ({ page, setupAuth }) => {
    const recipe = createRecipe({ name: "Shakshuka" });
    await setupAuth({ recipes: [recipe], mealPlans: [] });
    const nextMonday = mondayOf(new Date(), 1);
    let nextWeekFails = true;
    await page.route("**/rest/v1/meal_planning?*", async (route) => {
      const week = new URL(route.request().url()).searchParams.get("or") ?? "";
      if (nextWeekFails && week.includes(`gte.${formatDate(nextMonday)}`)) {
        await route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
      } else {
        await route.fallback();
      }
    });

    await page.goto(`/recipe/${recipe.id}`);
    await page.getByRole("button", { name: "Plan", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Plan" });
    await sheet.getByRole("button", { name: longDate(new Date()) }).click();
    await sheet.getByRole("button", { name: "Next week", exact: true }).click();

    // Its days can't be chosen, and nothing saves, until the week is in.
    await expect(sheet.getByText("Couldn’t load the plan.")).toBeVisible({ timeout: 10000 });
    await expect(sheet.getByRole("button", { name: longDate(nextMonday) })).toBeDisabled();
    await expect(sheet.getByRole("button", { name: "Plan for 1 day" })).toBeDisabled();

    nextWeekFails = false;
    await sheet.getByRole("button", { name: "Try again" }).click();
    await expect(sheet.getByText("Couldn’t load the plan.")).toBeHidden();
    await expect(sheet.getByRole("button", { name: "Plan for 1 day" })).toBeEnabled();
  });

  test("goes back to this week from the planner's title", async ({ page, setupAuth }) => {
    await setupAuth({ recipes: [], mealPlans: [] });

    await page.goto("/planner");
    await expect(page.getByRole("heading", { name: "This Week" })).toBeVisible({ timeout: 10000 });
    const nextWeek = page.getByRole("button", { name: "Next week", exact: true });
    await nextWeek.click();
    await nextWeek.click();
    const title = page.getByRole("heading").getByRole("button");
    await expect(title).not.toHaveText(/week/i);

    await title.click();
    await expect(page.getByRole("heading", { name: "This Week" })).toBeVisible();
  });
});
