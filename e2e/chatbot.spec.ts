import { test, expect } from "./fixtures";
import { createRecipe } from "./factories";

test.describe("Chatbot - Ask AI-Chef Feature", () => {
  test("should load recipe context when navigating from recipe page", async ({
    page,
    setupAuth,
  }) => {
    const recipe = createRecipe({
      id: 1,
      name: "Spaghetti Carbonara",
      description: "A classic Italian pasta dish with eggs, cheese, and pancetta.",
      category: 2,
    });

    await setupAuth({ recipes: [recipe] });

    // Navigate to recipe detail page
    await page.goto("/recipe/1");
    await page.waitForLoadState("networkidle");

    // Verify recipe is loaded
    await expect(page.getByRole("heading", { name: "Spaghetti Carbonara" })).toBeVisible({
      timeout: 10000,
    });

    // Click the Ask AI-Chef button
    const askButton = page.getByRole("button", { name: /ask ai-chef/i });
    await expect(askButton).toBeVisible();
    await askButton.click();

    // Verify navigation to chatbot with recipeId param
    await page.waitForURL(/\/chatbot\?recipeId=1/);
    expect(page.url()).toContain("/chatbot?recipeId=1");

    // Verify recipe context chip is visible in the chat input area
    await expect(page.getByText("Spaghetti Carbonara")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show recipe context chip in first user message", async ({ page, setupAuth }) => {
    const recipe = createRecipe({
      id: 2,
      name: "Chicken Stir Fry",
      description: "A quick and easy weeknight dinner.",
      category: 2,
    });

    await setupAuth({ recipes: [recipe] });

    // Navigate directly to chatbot with recipe context
    await page.goto("/chatbot?recipeId=2");
    await page.waitForLoadState("networkidle");

    // Verify recipe context chip is visible before sending message
    await expect(page.getByText("Chicken Stir Fry")).toBeVisible({
      timeout: 10000,
    });

    // Mock the chat API response to prevent actual API calls
    await page.route("**/chat/completions**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: 'data: {"choices":[{"delta":{"content":"I can help with that recipe!"}}]}\n\ndata: [DONE]\n',
      });
    });

    // Type a message in the chat input
    const inputField = page.getByPlaceholder(/ask about recipes or tips/i);
    await expect(inputField).toBeVisible();
    await inputField.fill("What can I substitute for pancetta?");

    // Click the send button
    await page.getByRole("button", { name: /send/i }).click();

    // Verify the user message appears with recipe context chip
    const userMessage = page.locator('[class*="bg-primary"]').first();
    await expect(userMessage).toBeVisible({ timeout: 10000 });
    await expect(userMessage).toContainText("Chicken Stir Fry");
    await expect(userMessage).toContainText("What can I substitute for pancetta?");
  });

  test("should have Ask AI-Chef button visible on recipe page", async ({ page, setupAuth }) => {
    const recipe = createRecipe({
      id: 3,
      name: "Test Recipe",
      category: 2,
    });

    await setupAuth({ recipes: [recipe] });

    await page.goto("/recipe/3");
    await page.waitForLoadState("networkidle");

    // Verify the Ask AI-Chef button is present and visible
    const askButton = page.getByRole("button", { name: /ask ai-chef/i });
    await expect(askButton).toBeVisible({ timeout: 10000 });
  });
});
