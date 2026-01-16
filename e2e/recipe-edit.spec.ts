import { test, expect } from "./fixtures";
import { createRecipe } from "./factories";

test.describe("Recipe Edit Page", () => {
  test("should load recipe data into edit form", async ({ page, setupAuth }) => {
    const recipe = createRecipe({
      id: 1,
      name: "Original Recipe Name",
      description: "Original description text",
      category: 2, // Main
      link: "https://example.com/original",
    });

    await setupAuth({ recipes: [recipe] });

    await page.goto("/recipe/edit/1");
    await page.waitForLoadState("networkidle");

    // Verify form is populated with recipe data
    const nameInput = page.locator("#title");
    await expect(nameInput).toHaveValue("Original Recipe Name", { timeout: 10000 });

    const descriptionInput = page.locator("#message");
    await expect(descriptionInput).toHaveValue("Original description text");

    const linkInput = page.locator("#link");
    await expect(linkInput).toHaveValue("https://example.com/original");
  });

  test("should have cancel button that navigates back", async ({
    page,
    setupAuth,
  }) => {
    const recipe = createRecipe({
      id: 2,
      name: "Test Recipe",
    });

    await setupAuth({ recipes: [recipe] });

    // Navigate from recipe detail to edit
    await page.goto("/recipe/2");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Test Recipe" })).toBeVisible({
      timeout: 10000,
    });

    // Click edit button
    await page.getByRole("link", { name: /edit/i }).click();
    await page.waitForURL(/\/recipe\/edit\/2/);

    // Click cancel button
    const cancelButton = page.getByRole("button", { name: /cancel/i });
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();

    // Should navigate back to recipe detail
    await page.waitForURL(/\/recipe\/2$/);
    expect(page.url()).toMatch(/\/recipe\/2$/);
  });

  test("should have delete button in edit mode", async ({ page, setupAuth }) => {
    const recipe = createRecipe({
      id: 3,
      name: "Deletable Recipe",
    });

    await setupAuth({ recipes: [recipe] });

    await page.goto("/recipe/edit/3");
    await page.waitForLoadState("networkidle");

    // Verify we're on the edit page with form loaded
    const nameInput = page.locator("#title");
    await expect(nameInput).toHaveValue("Deletable Recipe", { timeout: 10000 });

    // Should have delete button (trash icon button in header)
    // The delete button is a ghost button with a Trash2 icon
    const deleteButton = page.locator("button").filter({ has: page.locator("svg") }).first();
    await expect(deleteButton).toBeVisible();

    // Click it to open delete confirmation dialog
    await deleteButton.click();

    // Dialog should appear with delete confirmation
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/delete/i)).toBeVisible();
  });

  test("should have save button", async ({ page, setupAuth }) => {
    const recipe = createRecipe({
      id: 4,
      name: "Saveable Recipe",
    });

    await setupAuth({ recipes: [recipe] });

    await page.goto("/recipe/edit/4");
    await page.waitForLoadState("networkidle");

    // Verify we're on the edit page
    const nameInput = page.locator("#title");
    await expect(nameInput).toHaveValue("Saveable Recipe", { timeout: 10000 });

    // Should have save button
    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeVisible();
  });

  test("should be able to edit recipe name", async ({ page, setupAuth }) => {
    const recipe = createRecipe({
      id: 5,
      name: "Old Name",
    });

    await setupAuth({ recipes: [recipe] });

    await page.goto("/recipe/edit/5");
    await page.waitForLoadState("networkidle");

    // Verify original name is loaded
    const nameInput = page.locator("#title");
    await expect(nameInput).toHaveValue("Old Name", { timeout: 10000 });

    // Clear and type new name
    await nameInput.clear();
    await nameInput.fill("New Updated Name");

    // Verify the new value
    await expect(nameInput).toHaveValue("New Updated Name");
  });

  test("should navigate to add recipe page", async ({ page, setupAuth }) => {
    await setupAuth({ recipes: [] });

    await page.goto("/recipe/add");
    await page.waitForLoadState("networkidle");

    // Should see empty form fields
    const nameInput = page.locator("#title");
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await expect(nameInput).toHaveValue("");

    // Should have save button
    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeVisible();

    // Should NOT have delete button (only in edit mode)
    const deleteButton = page.getByRole("button", { name: /delete/i });
    await expect(deleteButton).not.toBeVisible();
  });
});
