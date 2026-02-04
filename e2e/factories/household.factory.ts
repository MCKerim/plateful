import { MockHousehold } from "../fixtures/types";

export function createHousehold(overrides?: Partial<MockHousehold>): MockHousehold {
  const id = overrides?.id ?? crypto.randomUUID();

  return {
    id,
    name: overrides?.name ?? "Test Household",
    created_at: overrides?.created_at ?? new Date().toISOString(),
  };
}
