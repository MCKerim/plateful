import { MockUser } from "../fixtures/types";

export function createUser(overrides?: Partial<MockUser>): MockUser {
  const id = overrides?.id ?? crypto.randomUUID();

  return {
    id,
    email: overrides?.email ?? `testuser-${id.slice(0, 8)}@example.com`,
    username: overrides?.username ?? "TestUser",
    has_seen_value_screens: overrides?.has_seen_value_screens ?? true,
    has_completed_survey: overrides?.has_completed_survey ?? true,
    household_id: overrides?.household_id ?? null,
    language: overrides?.language ?? "en",
    created_at: overrides?.created_at ?? new Date().toISOString(),
  };
}

export function createNewUser(): MockUser {
  return createUser({
    has_seen_value_screens: false,
    has_completed_survey: false,
    household_id: null,
  });
}

export function createOnboardedUser(householdId: string): MockUser {
  return createUser({
    has_seen_value_screens: true,
    has_completed_survey: true,
    household_id: householdId,
  });
}
