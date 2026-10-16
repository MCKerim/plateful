import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useImportRecipeShare } from "./useImportRecipeShare";

const mocks = vi.hoisted(() => ({ insert: vi.fn(), capture: vi.fn() }));

vi.mock("@/utils/supabase", () => ({
  useSupabase: () => ({ supabase: { from: () => ({ insert: mocks.insert }) } }),
}));
vi.mock("posthog-js/react", () => ({ usePostHog: () => ({ capture: mocks.capture }) }));
vi.mock("@/lib/contentLanguage", () => ({ contentLanguage: () => "de" }));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  mocks.insert.mockReset();
  mocks.capture.mockReset();
});

describe("useImportRecipeShare", () => {
  it("saves a share by importing its link, the same import a pasted link starts", async () => {
    mocks.insert.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useImportRecipeShare(), { wrapper });

    await act(() => result.current.mutateAsync({ token: "abc123", householdId: "household-1" }));

    expect(mocks.insert).toHaveBeenCalledWith({
      household_id: "household-1",
      source_type: "url",
      source_url: "https://app.plateful.cloud/share/abc123",
      language: "de",
    });
    expect(mocks.capture).toHaveBeenCalledWith("shared_recipe_imported");
  });

  it("counts the same share saved moments ago as saved", async () => {
    mocks.insert.mockResolvedValue({ error: { code: "23505", message: "duplicate" } });
    const { result } = renderHook(() => useImportRecipeShare(), { wrapper });

    await expect(
      act(() => result.current.mutateAsync({ token: "abc123", householdId: "household-1" })),
    ).resolves.toBeUndefined();
  });

  it("reports any other failure", async () => {
    mocks.insert.mockResolvedValue({ error: { code: "42501", message: "denied" } });
    const { result } = renderHook(() => useImportRecipeShare(), { wrapper });

    await expect(
      act(() => result.current.mutateAsync({ token: "abc123", householdId: "household-1" })),
    ).rejects.toMatchObject({ code: "42501" });
  });
});
