import type { MockCollection } from "../fixtures/types";

export function createCollection(overrides?: Partial<MockCollection>): MockCollection {
  const now = new Date().toISOString();

  return {
    id: overrides?.id ?? crypto.randomUUID(),
    household_id: overrides?.household_id ?? crypto.randomUUID(),
    name: overrides?.name ?? "Favorites",
    color_key: overrides?.color_key ?? "orange",
    color_hex: overrides?.color_hex ?? "#E88300",
    created_by: overrides?.created_by ?? "test-user-id",
    created_at: overrides?.created_at ?? now,
    updated_at: overrides?.updated_at ?? now,
    sticker_key: overrides?.sticker_key ?? null,
    sticker_x: overrides?.sticker_x ?? 0.72,
    sticker_y: overrides?.sticker_y ?? 0.22,
  };
}
