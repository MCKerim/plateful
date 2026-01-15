import { test as setup } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, ".auth/user.json");

// This setup file handles authentication for E2E tests
// For now, it just creates an empty auth state file
// To enable authenticated tests, you can either:
// 1. Use test credentials (store in .env.test)
// 2. Mock Supabase auth at the network level using page.route()

setup("authenticate", async ({ page }) => {
  // Option 1: Real authentication (requires test credentials)
  // Uncomment and configure when you have test accounts set up:
  /*
  await page.goto("/");

  // Wait for the app to load
  await page.waitForLoadState("networkidle");

  // If there's a login form, fill it:
  // await page.getByLabel("Email").fill(process.env.TEST_USER_EMAIL ?? "");
  // await page.getByLabel("Password").fill(process.env.TEST_USER_PASSWORD ?? "");
  // await page.getByRole("button", { name: /sign in|log in/i }).click();

  // Wait for authentication to complete
  // await page.waitForURL("/planner");
  */

  // Option 2: Mock authentication by intercepting Supabase requests
  // This is useful when you don't have test accounts
  await page.route("**/auth/v1/**", async (route) => {
    const url = route.request().url();

    // Mock session endpoint
    if (url.includes("/session")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock-access-token",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "mock-refresh-token",
          user: {
            id: "test-user-id",
            email: "test@example.com",
            role: "authenticated",
          },
        }),
      });
      return;
    }

    // Let other auth requests pass through
    await route.continue();
  });

  // Save the storage state (empty for now, but structure is in place)
  await page.context().storageState({ path: authFile });
});
