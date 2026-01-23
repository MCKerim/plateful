import { MockHousehold } from "../fixtures/types";

let householdIdCounter = 1;

export function createHousehold(overrides?: Partial<MockHousehold>): MockHousehold {
  const id = overrides?.id ?? householdIdCounter++;

  return {
    id,
    name: overrides?.name ?? "Test Household",
    created_at: overrides?.created_at ?? new Date().toISOString(),
  };
}
