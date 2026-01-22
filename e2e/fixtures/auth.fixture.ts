import { Page } from "@playwright/test";
import { MockSession, MockUser } from "./types";

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

    await route.continue();
  });

  // Abort realtime connections to prevent hanging
  await page.route("**/realtime/**", async (route) => {
    await route.abort();
  });
}

export function getSupabaseStorageKey(): string {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || "https://upupcsgufoejppoietiu.supabase.co";
  return `sb-${supabaseUrl.split("//")[1].split(".")[0]}-auth-token`;
}
