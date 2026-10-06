import { Page } from "@playwright/test";
import { MockSession, MockUser } from "./types";
import { E2E_SUPABASE_URL } from "./backend";

export function createMockSession(user: MockUser): MockSession {
  return {
    access_token: "mock-access-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "mock-refresh-token",
    user: {
      id: user.id,
      aud: "authenticated",
      role: "authenticated",
      email: user.email,
      email_confirmed_at: new Date().toISOString(),
      created_at: user.created_at,
      updated_at: new Date().toISOString(),
      user_metadata: {
        full_name: user.username,
      },
    },
  };
}

export async function setupAuthRoutes(page: Page, session: MockSession): Promise<void> {
  await page.route("**/auth/v1/**", async (route) => {
    const url = route.request().url();

    if (url.includes("/user")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(session.user),
      });
      return;
    }

    if (url.includes("/token")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(session),
      });
      return;
    }

    if (url.includes("/logout")) {
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    // Anything else is not mocked: hand it to the backend guard.
    await route.fallback();
  });
}

export function getSupabaseStorageKey(): string {
  // supabase-js names its storage entry after the first label of the host.
  return `sb-${new URL(E2E_SUPABASE_URL).hostname.split(".")[0]}-auth-token`;
}
