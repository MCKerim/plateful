import { test, expect } from "./fixtures";

const APP_STORE = "https://apps.apple.com/app/id6788850965";
const PLAY_STORE = "https://play.google.com/store/apps/details?id=com.kblanks.plateful";

const devices = [
  {
    device: "iPhone",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    maxTouchPoints: 5,
    stores: [APP_STORE],
  },
  {
    // iPadOS Safari asks for desktop sites and sends a Mac user agent.
    device: "iPad",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
    maxTouchPoints: 5,
    stores: [APP_STORE],
  },
  {
    device: "Android phone",
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
    maxTouchPoints: 5,
    stores: [PLAY_STORE],
  },
  {
    device: "Mac",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    maxTouchPoints: 0,
    stores: [APP_STORE, PLAY_STORE],
  },
];

for (const { device, userAgent, maxTouchPoints, stores } of devices) {
  test.describe(`Web subscribe page on ${device}`, () => {
    test.use({ userAgent });

    test("links to the store that sells the app there", async ({ page, setupAuth }) => {
      // The mobile projects emulate touch, so pin the count each device really reports.
      await page.addInitScript((points) => {
        Object.defineProperty(Navigator.prototype, "maxTouchPoints", { get: () => points });
      }, maxTouchPoints);
      await setupAuth();

      await page.goto("/subscribe");
      await expect(
        page.getByRole("heading", { name: "Subscribe in the Plateful App" })
      ).toBeVisible();

      const links = page.getByRole("link", { name: /App Store|Google Play/ });
      await expect(links).toHaveCount(stores.length);
      for (const [index, store] of stores.entries()) {
        await expect(links.nth(index)).toHaveAttribute("href", store);
      }
    });
  });
}
