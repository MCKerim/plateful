import { test, expect } from "./fixtures";

test.describe("Settings Page", () => {
  test("should display settings page with all sections", async ({ page, setupAuth }) => {
    await setupAuth({ recipes: [], mealPlans: [] });

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Should see Settings heading
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({
      timeout: 10000,
    });

    // Should see Language section
    await expect(page.getByText("Language")).toBeVisible();
    await expect(page.getByRole("button", { name: "English" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Deutsch" })).toBeVisible();

    // Should see Appearance section
    await expect(page.getByText("Appearance")).toBeVisible();

    // Should see Household section
    await expect(page.getByRole("heading", { name: "Household" })).toBeVisible();
    await expect(page.getByRole("button", { name: /manage your household/i })).toBeVisible();

    // Should see Support & Feedback section
    await expect(page.getByText("Support & Feedback")).toBeVisible();

    // Should see Account section
    await expect(page.getByText("Account")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /delete account/i })).toBeVisible();
  });

  test("should display user information in account section", async ({ page, setupAuth }) => {
    await setupAuth({
      user: { username: "TestUser", email: "test@example.com" },
      recipes: [],
      mealPlans: [],
    });

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Should see username and email
    await expect(page.getByText(/TestUser/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/test@example.com/)).toBeVisible();
  });

  test("should open username edit dialog", async ({ page, setupAuth }) => {
    await setupAuth({
      user: { username: "OriginalName" },
      recipes: [],
      mealPlans: [],
    });

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Find and click the edit button (pencil icon) next to Account
    const accountSection = page.locator("text=Account").locator("..");
    const editButton = accountSection.getByRole("button").first();
    await editButton.click();

    // Should see edit username dialog
    await expect(page.getByRole("heading", { name: /edit username/i })).toBeVisible({
      timeout: 5000,
    });

    // Should see input field
    await expect(page.getByPlaceholder(/enter new username/i)).toBeVisible();

    // Should see cancel and save buttons
    await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /save/i })).toBeVisible();
  });

  test("should show sign out confirmation dialog", async ({ page, setupAuth }) => {
    await setupAuth({ recipes: [], mealPlans: [] });

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Click sign out button
    await page.getByRole("button", { name: /sign out/i }).click();

    // Should see confirmation dialog
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/are you sure you want to sign out/i)).toBeVisible();

    // Should have cancel and confirm buttons
    await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
    await expect(
      page.getByRole("dialog").getByRole("button", { name: /sign out/i })
    ).toBeVisible();
  });

  test("should close sign out dialog when cancel is clicked", async ({ page, setupAuth }) => {
    await setupAuth({ recipes: [], mealPlans: [] });

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Click sign out button
    await page.getByRole("button", { name: /sign out/i }).click();

    // Dialog should be visible
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

    // Click cancel
    await page.getByRole("button", { name: /cancel/i }).click();

    // Dialog should be closed
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Should still be on settings page
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  test("should show delete account confirmation dialog", async ({ page, setupAuth }) => {
    await setupAuth({ recipes: [], mealPlans: [] });

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Click delete account button
    await page.getByRole("button", { name: /delete account/i }).click();

    // Should see confirmation dialog
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("heading", { name: /delete account/i })).toBeVisible();
    await expect(
      page.getByText(/this action is permanent and cannot be undone/i)
    ).toBeVisible();

    // Should have text input for confirmation
    await expect(page.getByPlaceholder(/delete/i)).toBeVisible();

    // Should have cancel and confirm buttons
    await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
    await expect(
      page.getByRole("dialog").getByRole("button", { name: /delete account/i })
    ).toBeVisible();
  });

  test("should have delete account confirm button disabled until correct text is entered", async ({
    page,
    setupAuth,
  }) => {
    await setupAuth({ recipes: [], mealPlans: [] });

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Click delete account button
    await page.getByRole("button", { name: /delete account/i }).click();

    // Dialog should be visible
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

    // Confirm button should be disabled initially
    const confirmButton = page
      .getByRole("dialog")
      .getByRole("button", { name: /delete account/i });
    await expect(confirmButton).toBeDisabled();

    // Type wrong text
    await page.getByPlaceholder(/delete/i).fill("wrong");
    await expect(confirmButton).toBeDisabled();

    // Type correct text (lowercase)
    await page.getByPlaceholder(/delete/i).fill("delete");
    await expect(confirmButton).toBeEnabled();
  });

  test("should close delete account dialog when cancel is clicked", async ({ page, setupAuth }) => {
    await setupAuth({ recipes: [], mealPlans: [] });

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Click delete account button
    await page.getByRole("button", { name: /delete account/i }).click();

    // Dialog should be visible
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

    // Click cancel
    await page.getByRole("button", { name: /cancel/i }).click();

    // Dialog should be closed
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Should still be on settings page
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  test("should clear confirmation text when delete account dialog is reopened", async ({
    page,
    setupAuth,
  }) => {
    await setupAuth({ recipes: [], mealPlans: [] });

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Open dialog and type something
    await page.getByRole("button", { name: /delete account/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder(/delete/i).fill("delete");

    // Close dialog
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Reopen dialog
    await page.getByRole("button", { name: /delete account/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

    // Input should be empty
    await expect(page.getByPlaceholder(/delete/i)).toHaveValue("");

    // Confirm button should be disabled
    const confirmButton = page
      .getByRole("dialog")
      .getByRole("button", { name: /delete account/i });
    await expect(confirmButton).toBeDisabled();
  });

  test("should navigate to household settings", async ({ page, setupAuth }) => {
    await setupAuth({ recipes: [], mealPlans: [] });

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Click on manage household button
    const manageHouseholdButton = page.getByRole("button", {
      name: /manage your household/i,
    });
    await expect(manageHouseholdButton).toBeVisible({ timeout: 10000 });
    await manageHouseholdButton.click();

    // Should navigate to household settings
    await page.waitForURL(/\/householdSettings/);
    expect(page.url()).toContain("/householdSettings");
  });

  test("should display info section with version and legal links", async ({ page, setupAuth }) => {
    await setupAuth({ recipes: [], mealPlans: [] });

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Should see Info section
    await expect(page.getByText("Info")).toBeVisible({ timeout: 10000 });

    // Should see version number
    await expect(page.getByText(/v0\.0\.\d+/)).toBeVisible();

    // Should see Privacy Policy and Terms of Service buttons
    await expect(page.getByRole("button", { name: /privacy policy/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /terms of service/i })).toBeVisible();
  });

  test("should navigate to privacy policy page", async ({ page, setupAuth }) => {
    await setupAuth({ recipes: [], mealPlans: [] });

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Click on Privacy Policy
    await page.getByRole("button", { name: /privacy policy/i }).click();

    // Should navigate to privacy page
    await page.waitForURL(/\/privacy/);
    expect(page.url()).toContain("/privacy");
  });
});

test.describe("Household Settings Page", () => {
  test("should display household settings with household name", async ({ page, setupAuth }) => {
    await setupAuth({
      household: { name: "Test Household" },
      recipes: [],
      mealPlans: [],
    });

    await page.goto("/householdSettings");
    await page.waitForLoadState("networkidle");

    // Should see household name
    await expect(page.getByText("Test Household")).toBeVisible({
      timeout: 10000,
    });

    // Should see member count
    await expect(page.getByText(/1 Member/i)).toBeVisible();
  });

  test("should display current user in members list", async ({ page, setupAuth }) => {
    await setupAuth({
      user: { username: "HouseholdMember", email: "member@example.com" },
      household: { name: "My Household" },
      recipes: [],
      mealPlans: [],
    });

    await page.goto("/householdSettings");
    await page.waitForLoadState("networkidle");

    // Should see the user in members list with "You" indicator
    await expect(page.getByText(/HouseholdMember/)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("You")).toBeVisible();
  });

  test("should have invite member button", async ({ page, setupAuth }) => {
    await setupAuth({
      household: { name: "Inviting Household" },
      recipes: [],
      mealPlans: [],
    });

    await page.goto("/householdSettings");
    await page.waitForLoadState("networkidle");

    // Should see invite member button (use first() to avoid strict mode with dialog trigger)
    const inviteButton = page.getByText("Invite Member");
    await expect(inviteButton).toBeVisible({ timeout: 10000 });
  });

  test("should open invite member dialog", async ({ page, setupAuth }) => {
    await setupAuth({
      household: { name: "Sharing Household" },
      recipes: [],
      mealPlans: [],
    });

    await page.goto("/householdSettings");
    await page.waitForLoadState("networkidle");

    // Click invite member button (use the visible text button)
    await page.getByText("Invite Member").click();

    // Should see invite dialog
    await expect(page.getByText(/scan the qr code or share the link/i)).toBeVisible({
      timeout: 5000,
    });

    // Close the dialog to prevent Mobile Safari context cleanup issues
    await page.keyboard.press("Escape");
  });

  test("should show leave and delete household buttons", async ({ page, setupAuth }) => {
    await setupAuth({
      household: { name: "Leavable Household" },
      recipes: [],
      mealPlans: [],
    });

    await page.goto("/householdSettings");
    await page.waitForLoadState("networkidle");

    // Should see leave household button
    await expect(page.getByRole("button", { name: /leave household/i })).toBeVisible({
      timeout: 10000,
    });

    // Should see delete household button
    await expect(page.getByRole("button", { name: /delete household/i })).toBeVisible();
  });

  test("should show confirmation dialog when leaving household", async ({ page, setupAuth }) => {
    await setupAuth({
      household: { name: "Leaving Household" },
      recipes: [],
      mealPlans: [],
    });

    await page.goto("/householdSettings");
    await page.waitForLoadState("networkidle");

    // Click leave household button
    await page.getByRole("button", { name: /leave household/i }).click();

    // Should see confirmation dialog
    await expect(page.getByText(/are you sure you want to leave/i)).toBeVisible({ timeout: 5000 });

    // Should have cancel and confirm buttons
    await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /leave/i })).toBeVisible();
  });
});
