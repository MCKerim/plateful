import { test, expect } from "@playwright/test";

test.describe("Sign Up Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should display the signup page with title and buttons", async ({
    page,
  }) => {
    // Click on Get Started button to go to signup page
    const getStartedButton = page.getByRole("button", {
      name: /get started/i,
    });
    await getStartedButton.click();

    const title = page.locator("h1");
    await expect(title).toBeVisible();
    await expect(title).toContainText("Congratulations");

    // Check for the two signup buttons
    const googleButton = page.getByRole("button", { name: /google/i });
    const emailButton = page.getByRole("button", { name: /e-?mail/i });

    await expect(googleButton).toBeVisible();
    await expect(emailButton).toBeVisible();
  });

  test("should navigate to email signup when clicking email button", async ({
    page,
  }) => {
    // Click on Get Started button to go to signup page
    const getStartedButton = page.getByRole("button", {
      name: /get started/i,
    });
    await getStartedButton.click();

    // Click the email signup button
    const emailButton = page.getByRole("button", { name: /e-?mail/i });
    await emailButton.click();

    // Should navigate to email signup page
    await expect(page).toHaveURL(/\/signup\/email/);
  });

  test("should display terms and conditions text", async ({ page }) => {
    // Click on Get Started button to go to signup page
    const getStartedButton = page.getByRole("button", {
      name: /get started/i,
    });
    await getStartedButton.click();
    
    // Check for terms and conditions text
    const termsText = page.locator("text=/terms|conditions|privacy/i");
    await expect(termsText).toBeVisible();
  });
});
