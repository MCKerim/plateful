import { test, expect } from "./fixtures";
import { createRecipe } from "./factories";
import type { Request } from "@playwright/test";

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

  test("should preserve recipe link when saving chatbot-edited recipe", async ({
    page,
    setupAuth,
  }) => {
    const recipeLink = "https://example.com/original-recipe-link";
    const recipe = createRecipe({
      id: 4,
      name: "Recipe With Link",
      description: "Original description",
      category: 2,
      link: recipeLink,
    });

    await setupAuth({ recipes: [recipe] });

    // Track PATCH request to verify link is preserved
    let capturedUpdateRequest: Request | null = null;

    // Mock the recipe update PATCH request
    await page.route("**/rest/v1/recipes?id=eq.4", async (route) => {
      const request = route.request();
      if (request.method() === "PATCH") {
        capturedUpdateRequest = request;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 4,
            name: "Updated Recipe Name",
            description: "Updated description",
            category: 2,
            link: recipeLink,
            household_id: 1,
            created_at: new Date().toISOString(),
          }),
        });
      } else {
        // For GET requests, return the recipe
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
          }),
        });
      }
    });

    // Mock the Supabase edge function for chatbot to return a propose_recipe_edit tool output
    await page.route("**/functions/v1/chatbot", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "response-123",
          output_text: "I've updated the recipe for you!",
          tool_outputs_for_ui: JSON.stringify([
            {
              toolName: "propose_recipe_edit",
              args: {
                recipeId: 4,
                title: "Updated Recipe Name",
                description: "Updated description by AI",
                category: "Main",
              },
            },
          ]),
        }),
      });
    });

    // Navigate to chatbot with recipe context
    await page.goto("/chatbot?recipeId=4");
    await page.waitForLoadState("networkidle");

    // Verify recipe context chip is visible
    await expect(page.getByText("Recipe With Link")).toBeVisible({ timeout: 10000 });

    // Type and send a message to trigger the chatbot response
    const inputField = page.getByPlaceholder(/ask about recipes or tips/i);
    await expect(inputField).toBeVisible();
    await inputField.fill("Please update this recipe");
    await page.getByRole("button", { name: /send/i }).click();

    // Wait for the assistant response with the recipe proposal
    await expect(page.getByText("Updated Recipe Name")).toBeVisible({ timeout: 10000 });

    // Click the preview button to open the dialog
    const previewButton = page.getByRole("button", { name: /preview edited recipe/i });
    await expect(previewButton).toBeVisible({ timeout: 5000 });
    await previewButton.click();

    // Click the update/save button in the dialog
    const updateButton = page.getByRole("button", { name: /update/i });
    await expect(updateButton).toBeVisible({ timeout: 5000 });
    await updateButton.click();

    // Wait for the PATCH request to be made
    await page.waitForURL(/\/recipe\/4/, { timeout: 10000 });

    // Verify the link was preserved in the update request
    expect(capturedUpdateRequest).not.toBeNull();
    const requestBody = capturedUpdateRequest!.postDataJSON();
    expect(requestBody.link).toBe(recipeLink);
  });
});
