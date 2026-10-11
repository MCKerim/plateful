import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { ShoppingListItem } from "@/lib/shopping-list/item";

type Variables = { householdId: string };

/**
 * A list write shown at once: `optimistic` rewrites the cached list before the
 * request, a failure restores it and refetches. Shares one mutation key, which
 * the realtime handler in App waits on, so a refetch never lands older than
 * the screen while a write is in flight.
 */
export function useShoppingMutation<TVariables extends Variables, TResult>(options: {
  mutationFn: (variables: TVariables) => Promise<TResult>;
  optimistic: (items: ShoppingListItem[], variables: TVariables) => ShoppingListItem[];
  onSuccess?: (result: TResult, variables: TVariables) => void;
  /** After the rollback, for a screen that tells the user. */
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.shoppingList.all,
    mutationFn: options.mutationFn,
    onMutate: async (variables: TVariables) => {
      const queryKey = queryKeys.shoppingList.items(variables.householdId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ShoppingListItem[]>(queryKey);
      queryClient.setQueryData<ShoppingListItem[]>(queryKey, (items) =>
        options.optimistic(items ?? [], variables)
      );
      return { previous };
    },
    onSuccess: options.onSuccess,
    onError: (error, variables, context) => {
      const queryKey = queryKeys.shoppingList.items(variables.householdId);
      // Another write's optimistic rows live in the cache; restoring this
      // snapshot would drop them. The refetch below shows the server's truth.
      const alone = queryClient.isMutating({ mutationKey: queryKeys.shoppingList.all }) === 1;
      if (alone && context?.previous) queryClient.setQueryData(queryKey, context.previous);
      void queryClient.invalidateQueries({ queryKey });
      options.onError?.(error);
    },
  });
}
