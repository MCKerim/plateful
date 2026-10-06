import { defineConfig, devices } from "@playwright/test";
import { E2E_SUPABASE_ANON_KEY, E2E_SUPABASE_URL } from "./e2e/fixtures/backend";

// The tests run against their own dev server on their own port, so a server
// someone has open on 5173 with the real backend configured is never reused.
const E2E_ORIGIN = "http://localhost:5174";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: E2E_ORIGIN,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    // Mobile viewports
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  // Start a dev server that knows no real backend: the env below wins over
  // `.env`, and every request is answered by the mocks in e2e/fixtures.
  webServer: {
    command: "npm run dev -- --port 5174 --strictPort",
    url: E2E_ORIGIN,
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: {
      VITE_SUPABASE_URL: E2E_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: E2E_SUPABASE_ANON_KEY,
      // Public Services ID; only decides whether the web renders the Apple button.
      VITE_APPLE_SERVICES_ID: "com.kblanks.plateful.web",
    },
  },
});
