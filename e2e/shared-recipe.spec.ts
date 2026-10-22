import { test, expect } from "./fixtures";

const steps = Array.from({ length: 12 }, (_, i) => `Step ${i + 1}: stir the pot for a while.`);

const snapshot = {
  name: "Pesto Pasta",
  description: "Quick and creamy.",
  instructions: null,
  instruction_steps: steps.map((step_text, sort_order) => ({
    step_text,
    group_name: null,
    sort_order,
  })),
  base_servings: 2,
  servings_unit: null,
  link: null,
  image_urls: [],
  image_folder: "e2e",
  ingredients: ["150 g Fusilli", "30 g Pesto"].map((raw_text, sort_order) => ({
    raw_text,
    quantity_value: null,
    quantity_display: null,
    unit: null,
    ingredient_name: null,
    group_name: null,
    sort_order,
    is_scalable: true,
    is_optional: false,
    preparation_note: null,
  })),
};

test.describe("Shared recipe", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/rest/v1/rpc/resolve_recipe_share", (route) =>
      route.fulfill({ json: [{ snapshot }] })
    );
    await page.goto("/share/e2e-token");
    await expect(page.getByRole("heading", { name: "Pesto Pasta" })).toBeVisible();
  });

  test("shows the servings in words, not a translation key", async ({ page }) => {
    await expect(page.getByText("2 servings", { exact: true })).toBeVisible();
  });

  test("the footer never covers the last step", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

    const lastStep = await page.getByText(steps[steps.length - 1]).boundingBox();
    const footer = await page
      .getByText("Save this recipe", { exact: true })
      .locator("..")
      .boundingBox();

    expect(lastStep!.y + lastStep!.height).toBeLessThanOrEqual(footer!.y);
  });
});

test("an old share with markdown instructions still shows its steps", async ({ page }) => {
  const legacy = {
    ...snapshot,
    instruction_steps: null,
    instructions: "### Sauce\n1. Blend the basil.\n2. Stir in the oil.",
  };
  await page.route("**/rest/v1/rpc/resolve_recipe_share", (route) =>
    route.fulfill({ json: [{ snapshot: legacy }] })
  );
  await page.goto("/share/e2e-token");

  await expect(page.getByText("Sauce", { exact: true })).toBeVisible();
  await expect(page.getByText("Blend the basil.", { exact: true })).toBeVisible();
  await expect(page.getByText("Stir in the oil.", { exact: true })).toBeVisible();
});

const IOS_LINK = "https://plateful.cloud/share/e2e-token";
const ANDROID_LINK =
  "intent://app.plateful.cloud/share/e2e-token#Intent;scheme=https;package=com.kblanks.plateful;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.kblanks.plateful;end";

const devices = [
  {
    device: "iPhone",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    maxTouchPoints: 5,
    store: IOS_LINK,
  },
  {
    device: "Android phone",
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
    maxTouchPoints: 5,
    store: ANDROID_LINK,
  },
  {
    device: "Mac",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    maxTouchPoints: 0,
    store: null,
  },
];

for (const { device, userAgent, maxTouchPoints, store } of devices) {
  test.describe(`Shared recipe on ${device}, signed out`, () => {
    test.use({ userAgent });

    test("offers one button to save the recipe", async ({ page }) => {
      // The mobile projects emulate touch, so pin the count each device really reports.
      await page.addInitScript((points) => {
        Object.defineProperty(Navigator.prototype, "maxTouchPoints", { get: () => points });
      }, maxTouchPoints);
      await page.route("**/rest/v1/rpc/resolve_recipe_share", (route) =>
        route.fulfill({ json: [{ snapshot }] })
      );
      await page.goto("/share/e2e-token");
      await expect(page.getByRole("heading", { name: "Pesto Pasta" })).toBeVisible();

      const save = page.getByText("Save this recipe", { exact: true });
      await expect(save).toHaveCount(1);
      await expect(page.getByText(/Log in|Get the Plateful app/)).toHaveCount(0);

      if (store) {
        await expect(page.getByRole("link", { name: "Save this recipe" })).toHaveAttribute(
          "href",
          store
        );
      } else {
        await page.getByRole("button", { name: "Save this recipe" }).click();
        await expect(page).toHaveURL(/\/signup$/);
      }
    });
  });
}
