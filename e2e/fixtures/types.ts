import { Page } from "@playwright/test";

// Mock data types aligned with database schema
export type MockUser = {
  id: string;
  email: string;
  username: string;
  has_seen_value_screens: boolean;
  has_completed_survey: boolean;
  household_id: number | null;
  language: string;
  created_at: string;
};

export type MockHousehold = {
  id: number;
  name: string;
  created_at: string;
};

export type MockRecipe = {
  id: number;
  name: string;
  description: string | null;
  category: number | null;
  household_id: number | null;
  link: string | null;
  owner_id: string;
  created_at: string;
  avg_rating: number | null;
};

export type MockMealPlan = {
  id: number;
  recipe_id: number;
  household_id: number;
  planned_date: string | null;
  eaten: boolean;
  created_at: string;
  recipes: { id: number; name: string } | null;
};

export type MockSession = {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: {
    id: string;
    aud: string;
    role: string;
    email: string;
    email_confirmed_at: string;
    created_at: string;
    updated_at: string;
    user_metadata: {
      full_name: string;
    };
  };
};

// Test scenario configuration
export type TestScenario = {
  user: MockUser;
  household: MockHousehold | null;
  recipes: MockRecipe[];
  mealPlans: MockMealPlan[];
};

// Fixture options for setupAuth
export type AuthenticatedFixtureOptions = {
  user?: Partial<MockUser>;
  household?: Partial<MockHousehold> | null;
  recipes?: MockRecipe[];
  mealPlans?: MockMealPlan[];
};

// Custom fixtures interface
export interface CustomFixtures {
  authenticatedPage: Page;
  setupAuth: (options?: AuthenticatedFixtureOptions) => Promise<void>;
}
