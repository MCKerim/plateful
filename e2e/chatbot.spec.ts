import { test, expect } from "./fixtures";
import { createRecipe } from "./factories";
import type { Request } from "@playwright/test";
import { ToolOutputForUI } from "@/redux/slices/chatbotSlice";

/** Helper to build an SSE response body from chatbot edge function */
function buildSSEResponse(
  text: string,
  responseId: string,
  toolOutputsForUI: ToolOutputForUI[] = []
): string {
  // Stream text in chunks
  const chunkSize = 12;
  let body = "";
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.slice(i, i + chunkSize);
    body += `data: ${JSON.stringify({ delta: chunk })}\n\n`;
  }
  body += `data: ${JSON.stringify({
    done: true,
    id: responseId,
    tool_outputs_for_ui: JSON.stringify(toolOutputsForUI),
  })}\n\n`;
  return body;
}

test.describe("Chatbot - Ask AI-Chef Feature", () => {
  test("should load recipe context when navigating from recipe page", async ({
    page,
    setupAuth,
  }) => {
    const recipeId = "00000000-0000-0000-0000-000000000001";
    const recipe = createRecipe({
      id: recipeId,
      name: "Spaghetti Carbonara",
      description: "A classic Italian pasta dish with eggs, cheese, and pancetta.",
      category: 2,
    });

    await setupAuth({ recipes: [recipe] });

    // Navigate to recipe detail page
    await page.goto(`/recipe/${recipeId}`);
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
    await page.waitForURL(new RegExp(`/chatbot\\?recipeId=${recipeId}`));
    expect(page.url()).toContain(`/chatbot?recipeId=${recipeId}`);

    // Verify recipe context chip is visible in the chat input area
    await expect(page.getByText("Spaghetti Carbonara")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show recipe context chip in first user message", async ({ page, setupAuth }) => {
    const recipeId = "00000000-0000-0000-0000-000000000002";
    const recipe = createRecipe({
      id: recipeId,
      name: "Chicken Stir Fry",
      description: "A quick and easy weeknight dinner.",
      category: 2,
    });

    await setupAuth({ recipes: [recipe] });

    // Navigate directly to chatbot with recipe context
    await page.goto(`/chatbot?recipeId=${recipeId}`);
    await page.waitForLoadState("networkidle");

    // Verify recipe context chip is visible before sending message
    await expect(page.getByText("Chicken Stir Fry")).toBeVisible({
      timeout: 10000,
    });

    // Mock the chatbot edge function with SSE streaming
    await page.route("**/functions/v1/chatbot", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: buildSSEResponse("I can help with that recipe!", "resp-1"),
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
    const recipeId = "00000000-0000-0000-0000-000000000003";
    const recipe = createRecipe({
      id: recipeId,
      name: "Test Recipe",
      category: 2,
    });

    await setupAuth({ recipes: [recipe] });

    await page.goto(`/recipe/${recipeId}`);
    await page.waitForLoadState("networkidle");

    // Verify the Ask AI-Chef button is present and visible
    const askButton = page.getByRole("button", { name: /ask ai-chef/i });
    await expect(askButton).toBeVisible({ timeout: 10000 });
  });

  test("should preserve recipe link when saving chatbot-edited recipe", async ({
    page,
    setupAuth,
  }) => {
    const recipeId = "00000000-0000-0000-0000-000000000004";
    const householdId = "00000000-0000-0000-0000-000000000100";
    const recipeLink = "https://example.com/original-recipe-link";
    const recipe = createRecipe({
      id: recipeId,
      name: "Recipe With Link",
      description: "Original description",
      category: 2,
      link: recipeLink,
      household_id: householdId,
    });

    await setupAuth({ recipes: [recipe] });

    // Track PATCH request to verify link is preserved
    let capturedUpdateRequest: Request | null = null;

    // Register route AFTER setupAuth so it takes precedence (later routes win in Playwright)
    await page.route("**/rest/v1/recipes**", async (route) => {
      const request = route.request();
      const url = request.url();

      if (request.method() === "PATCH" && url.includes(`id=eq.${recipeId}`)) {
        capturedUpdateRequest = request;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: recipeId,
            name: "Updated Recipe Name",
            description: "Updated description",
            category: 2,
            link: recipeLink,
            household_id: householdId,
            created_at: new Date().toISOString(),
          }),
        });
      } else {
        await route.fallback();
      }
    });

    // Mock the chatbot edge function with SSE streaming + tool output
    await page.route("**/functions/v1/chatbot", async (route) => {
      const toolOutputs = [
        {
          proposalId: "p_1",
          toolName: "propose_recipe_edit",
          args: {
            recipeId: recipeId,
            title: "Updated Recipe Name",
            description: "Updated description by AI",
            category: "Main Course",
          },
        },
      ];
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: buildSSEResponse("I've updated the recipe for you!", "response-123", toolOutputs),
      });
    });

    // Navigate to chatbot with recipe context
    await page.goto(`/chatbot?recipeId=${recipeId}`);
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
    const previewButton = page.getByRole("button", { name: /preview changes/i });
    await expect(previewButton).toBeVisible({ timeout: 5000 });
    await previewButton.click();

    // Click the update/save button in the dialog
    const updateButton = page.getByRole("button", { name: /update/i });
    await expect(updateButton).toBeVisible({ timeout: 5000 });
    await updateButton.click();

    // User stays on chatbot page (no navigation)
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/chatbot");

    // Verify the link was preserved in the update request
    expect(capturedUpdateRequest).not.toBeNull();
    const requestBody = capturedUpdateRequest!.postDataJSON();
    expect(requestBody.link).toBe(recipeLink);
  });

  test("should show toast and stay in chat when saving a proposed recipe", async ({
    page,
    setupAuth,
  }) => {
    const householdId = "00000000-0000-0000-0000-000000000100";
    await setupAuth({});

    // Mock POST for creating recipe
    await page.route("**/rest/v1/recipes**", async (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "00000000-0000-0000-0000-000000000099",
              name: "Banana Pancakes",
              description: "Fluffy pancakes",
              category: 1,
              link: "",
              household_id: householdId,
              created_at: new Date().toISOString(),
            },
          ]),
        });
      } else {
        await route.fallback();
      }
    });

    // Mock chatbot with a propose_recipe tool output
    await page.route("**/functions/v1/chatbot", async (route) => {
      const toolOutputs = [
        {
          proposalId: "p_1",
          toolName: "propose_recipe",
          args: {
            title: "Banana Pancakes",
            description: "## Ingredients\n- 2 bananas\n- 2 eggs",
            category: "Breakfast",
          },
        },
      ];
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: buildSSEResponse("Here's a recipe for you!", "resp-1", toolOutputs),
      });
    });

    await page.goto("/chatbot");
    await page.waitForLoadState("networkidle");

    // Send a message
    const inputField = page.getByPlaceholder(/ask about recipes or tips/i);
    await inputField.fill("Make me pancakes");
    await page.getByRole("button", { name: /send/i }).click();

    // Wait for proposal button
    await expect(page.getByText("Banana Pancakes")).toBeVisible({ timeout: 10000 });

    // Open preview dialog
    const previewButton = page.getByRole("button", { name: /preview recipe/i });
    await expect(previewButton).toBeVisible({ timeout: 5000 });
    await previewButton.click();

    // Save the recipe
    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeVisible({ timeout: 5000 });
    await saveButton.click();

    // Verify user stays on chatbot (no navigation)
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/chatbot");

    // Verify toast appears
    await expect(page.getByText(/added to plateful/i)).toBeVisible({ timeout: 5000 });
  });

  test("should include proposal feedback in next message", async ({ page, setupAuth }) => {
    const householdId = "00000000-0000-0000-0000-000000000100";
    const createdRecipeId = "00000000-0000-0000-0000-000000000042";
    await setupAuth({});

    // Mock POST for creating recipe
    await page.route("**/rest/v1/recipes**", async (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: createdRecipeId,
            name: "Test Recipe",
            description: "Test",
            category: 1,
            link: "",
            household_id: householdId,
            created_at: new Date().toISOString(),
          }),
        });
      } else {
        await route.fallback();
      }
    });

    // Track chatbot requests
    let chatbotRequestCount = 0;
    let secondRequestBody: { messages: Array<{ content: Array<{ type: string; text?: string }> }> } | null = null;

    await page.route("**/functions/v1/chatbot", async (route) => {
      chatbotRequestCount++;

      if (chatbotRequestCount === 2) {
        secondRequestBody = JSON.parse(route.request().postData() ?? "{}");
      }

      const toolOutputs =
        chatbotRequestCount === 1
          ? [
              {
                proposalId: "p_1",
                toolName: "propose_recipe",
                args: {
                  title: "Test Recipe",
                  description: "Test description",
                  category: "Other",
                },
              },
            ]
          : [];

      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: buildSSEResponse(
          chatbotRequestCount === 1 ? "Here you go!" : "Sure thing!",
          `resp-${chatbotRequestCount}`,
          toolOutputs
        ),
      });
    });

    await page.goto("/chatbot");
    await page.waitForLoadState("networkidle");

    // Send first message
    const inputField = page.getByPlaceholder(/ask about recipes or tips/i);
    await inputField.fill("Give me a recipe");
    await page.getByRole("button", { name: /send/i }).click();

    // Wait for proposal
    await expect(page.getByText("Test Recipe")).toBeVisible({ timeout: 10000 });

    // Save the proposed recipe
    const previewButton = page.getByRole("button", { name: /preview recipe/i });
    await previewButton.click();
    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeVisible({ timeout: 5000 });
    await saveButton.click();

    // Wait for toast
    await expect(page.getByText(/added to plateful/i)).toBeVisible({ timeout: 5000 });

    // Send follow-up message
    await inputField.fill("Can you edit that?");
    await page.getByRole("button", { name: /send/i }).click();

    // Wait for second response
    await expect(page.getByText("Sure thing!")).toBeVisible({ timeout: 10000 });

    // Verify the second request included proposal feedback
    expect(secondRequestBody).not.toBeNull();
    const messageContent = secondRequestBody!.messages[0].content;
    const textPart = messageContent.find((p: { type: string; text?: string }) => p.type === "input_text");
    expect(textPart?.text).toContain("[Proposal Outcomes]");
    expect(textPart?.text).toContain("p_1");
    expect(textPart?.text).toContain(createdRecipeId);
  });

  test("should stream response text incrementally", async ({ page, setupAuth }) => {
    await setupAuth({});

    // Mock chatbot with delayed SSE chunks
    await page.route("**/functions/v1/chatbot", async (route) => {
      const text = "This is a streamed response from the AI chef.";
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: buildSSEResponse(text, "resp-stream"),
      });
    });

    await page.goto("/chatbot");
    await page.waitForLoadState("networkidle");

    const inputField = page.getByPlaceholder(/ask about recipes or tips/i);
    await inputField.fill("Hello");
    await page.getByRole("button", { name: /send/i }).click();

    // Verify the full streamed text appears
    await expect(page.getByText("This is a streamed response from the AI chef.")).toBeVisible({
      timeout: 10000,
    });
  });
});
