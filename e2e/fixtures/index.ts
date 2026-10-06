import { test as base, expect, Page, BrowserContext } from "@playwright/test";
import { CustomFixtures, TestScenario, AuthenticatedFixtureOptions } from "./types";
import { createMockSession, setupAuthRoutes, getSupabaseStorageKey } from "./auth.fixture";
import { setupApiMocks } from "./api-mocks.fixture";
import { guardBackend } from "./backend";
import { createUser, createHousehold, createCollection } from "../factories";

// Extend Playwright's test with custom fixtures
export const test = base.extend<CustomFixtures>({
  // Every test, signed in or not: a backend request that no mock answers gets
  // a 501 instead of leaving the machine, and fails the test afterwards. The
  // two fixtures below name it (`void backendGuard`) so that it is set up
  // first: their mocks are then registered later and therefore asked first.
  backendGuard: [
    async ({ page }, use) => {
      const unmocked: string[] = [];
      await guardBackend(page, unmocked);
      await use(unmocked);
      expect(unmocked, "backend requests without an E2E mock").toEqual([]);
    },
    { auto: true },
  ],

  // Pre-configured authenticated page with default user
  authenticatedPage: async ({ page, context, backendGuard }, use) => {
    void backendGuard;
    const defaultScenario = createDefaultScenario();
    await setupAuthentication(page, context, defaultScenario);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },

  // Manual auth setup for custom scenarios
  setupAuth: async ({ page, context, backendGuard }, use) => {
    void backendGuard;
    const setup = async (options?: AuthenticatedFixtureOptions) => {
      const scenario = createScenarioFromOptions(options);
      await setupAuthentication(page, context, scenario);
    };
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(setup);
  },
});

// Helper functions
function createDefaultScenario(): TestScenario {
  const household = createHousehold();
  const user = createUser({ household_id: household.id });
  const collections = [
    createCollection({ household_id: household.id, name: "Favorites", color_key: "orange" }),
  ];

  return {
    user,
    household,
    recipes: [],
    collections,
    mealPlans: [],
  };
}

function createScenarioFromOptions(options?: AuthenticatedFixtureOptions): TestScenario {
  const household = options?.household === null ? null : createHousehold(options?.household);

  const user = createUser({
    household_id: household?.id ?? null,
    ...options?.user,
  });
  const collections =
    options?.collections ??
    (household
      ? [createCollection({ household_id: household.id, name: "Favorites", color_key: "orange" })]
      : []);

  return {
    user,
    household,
    recipes: options?.recipes ?? [],
    collections,
    mealPlans: options?.mealPlans ?? [],
  };
}

async function setupAuthentication(
  page: Page,
  context: BrowserContext,
  scenario: TestScenario
): Promise<void> {
  const session = createMockSession(scenario.user);
  const storageKey = getSupabaseStorageKey();

  // Inject session into localStorage before page loads
  // Also pre-dismiss onboarding sheets (Capacitor Preferences uses _cap_ prefix in web)
  await context.addInitScript(
    ({ storageKey, session }) => {
      localStorage.setItem(storageKey, JSON.stringify(session));
      localStorage.setItem("CapacitorStorage.onboarding_recipes_seen", "true");
      localStorage.setItem("CapacitorStorage.onboarding_mealplanner_seen", "true");
      localStorage.setItem("CapacitorStorage.onboarding_chatbot_seen", "true");
    },
    { storageKey, session }
  );

  // Setup all route handlers
  await setupAuthRoutes(page, session);
  await setupApiMocks(page, scenario);
}

export { expect };
