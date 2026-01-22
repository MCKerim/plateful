import { MockUser } from "../fixtures/types";

let userIdCounter = 1;

export function createUser(overrides?: Partial<MockUser>): MockUser {
  const id = overrides?.id ?? `test-user-${userIdCounter++}`;

  return {
    id,
    email: overrides?.email ?? `testuser${userIdCounter}@example.com`,
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

export function createOnboardedUser(householdId: number): MockUser {
  return createUser({
    has_seen_value_screens: true,
    has_completed_survey: true,
    household_id: householdId,
  });
}
