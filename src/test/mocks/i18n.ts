import { vi } from "vitest";

// Simple translation mock that returns the key or interpolates values
export const mockT = vi.fn((key: string, options?: Record<string, unknown>): string => {
  if (options?.count !== undefined) {
    return `${key}_${options.count}`;
  }
  return key;
});

// Reset mock between tests
export const resetMockT = () => {
  mockT.mockClear();
};

// Create a mock i18n object
export const mockI18n = {
  language: "en",
  t: mockT,
  changeLanguage: vi.fn(),
};
