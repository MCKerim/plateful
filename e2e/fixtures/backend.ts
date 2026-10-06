import { Page } from "@playwright/test";

/**
 * Where the app under test believes its backend lives. The host cannot
 * resolve: every backend request is answered by a mock in this folder, and one
 * that no mock catches fails instead of reaching the production project.
 */
export const E2E_SUPABASE_URL = "https://e2e.supabase.invalid";
export const E2E_SUPABASE_ANON_KEY = "mock-anon-key-for-e2e-tests";

// Supabase's HTTP APIs, whatever the host, plus the recipe-extractor.
const BACKEND_PATH = /^\/(rest|auth|functions|storage)\/v1\//;
const EXTRACTOR_HOST = "extractor.plateful.cloud";

function isBackend(url: URL): boolean {
  if (url.hostname === "localhost") return false;
  return BACKEND_PATH.test(url.pathname) || url.hostname === EXTRACTOR_HOST;
}

/**
 * Answers every backend request that no mock claims with a 501 and records it
 * in `unmocked`; the `backendGuard` fixture fails the test when that list is
 * not empty. Install it before the mocks: Playwright asks the most recently
 * registered route first, so the mocks win and only the rest lands here.
 */
export async function guardBackend(page: Page, unmocked: string[]): Promise<void> {
  await page.route(isBackend, async (route) => {
    const request = route.request();
    const call = `${request.method()} ${new URL(request.url()).pathname}`;
    unmocked.push(call);
    await route.fulfill({
      status: 501,
      contentType: "application/json",
      body: JSON.stringify({ code: "E2E_UNMOCKED", message: `No E2E mock answers ${call}` }),
    });
  });

  // Realtime is a WebSocket, which `page.route` never sees. The socket opens
  // and stays silent; nothing connects to a server.
  await page.routeWebSocket(/\/realtime\/v1\/websocket/, () => {});
}
