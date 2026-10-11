import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { markBought } from "@/lib/shopping-list/list";
import { makeItem } from "@/lib/shopping-list/testItems";
import { useShoppingMutation } from "@/hooks/shopping-list/useShoppingMutation";

function setup(write: () => Promise<void>, onError?: (error: Error) => void) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const key = queryKeys.shoppingList.items("h1");
  queryClient.setQueryData(key, [makeItem("a", "Milch", "dairy")]);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () =>
      useShoppingMutation({
        mutationFn: write,
        optimistic: (items, { id }: { householdId: string; id: string }) =>
          markBought(items, id, 5),
        onError,
      }),
    { wrapper }
  );
  return { queryClient, key, result };
}

describe("useShoppingMutation", () => {
  it("shows the change before the write answers", async () => {
    let finish = () => {};
    const { queryClient, key, result } = setup(
      () => new Promise<void>((resolve) => (finish = resolve))
    );
    act(() => result.current.mutate({ householdId: "h1", id: "a" }));
    await waitFor(() => expect(queryClient.isMutating()).toBe(1));
    await waitFor(() =>
      expect(queryClient.getQueryData<{ onList: boolean }[]>(key)?.[0].onList).toBe(false)
    );
    act(() => finish());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
  });

  it("restores the list, refetches and tells the screen when the write fails", async () => {
    const failures: { message: string; onList: boolean | undefined }[] = [];
    const { queryClient, key, result } = setup(
      () => Promise.reject(new Error("offline")),
      (error) =>
        failures.push({
          message: error.message,
          onList: queryClient.getQueryData<{ onList: boolean }[]>(key)?.[0].onList,
        })
    );
    act(() => result.current.mutate({ householdId: "h1", id: "a" }));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData<{ onList: boolean }[]>(key)?.[0].onList).toBe(true);
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
    expect(failures).toEqual([{ message: "offline", onList: true }]);
  });
});
