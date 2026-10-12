import { queryKeys } from "@/lib/query-keys";
import type { ShoppingListItem } from "@/lib/shopping-list/item";
import { useOptimisticMutation } from "@/hooks/general/useOptimisticMutation";

type Variables = { householdId: string };

/** A list write shown at once; see `useOptimisticMutation`. */
export function useShoppingMutation<TVariables extends Variables, TResult>(options: {
  mutationFn: (variables: TVariables) => Promise<TResult>;
  optimistic: (items: ShoppingListItem[], variables: TVariables) => ShoppingListItem[];
  onSuccess?: (result: TResult, variables: TVariables) => void;
  /** After the rollback, for a screen that tells the user. */
  onError?: (error: Error) => void;
}) {
  return useOptimisticMutation<ShoppingListItem[], TVariables, TResult>({
    mutationKey: queryKeys.shoppingList.all,
    queryKey: (variables) => queryKeys.shoppingList.items(variables.householdId),
    mutationFn: options.mutationFn,
    optimistic: (items, variables) => options.optimistic(items ?? [], variables),
    onSuccess: options.onSuccess,
    onError: options.onError,
  });
}
