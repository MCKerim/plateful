import { useQueryClient } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { AnalyticsEvent } from "@/lib/analyticsEvents";
import { shoppingListApi } from "@/api/shopping-list.api";
import { parseShoppingListItem, type ShoppingListItem } from "@/lib/shopping-list/item";
import { mergeRows, removeRecipe } from "@/lib/shopping-list/list";
import { useShoppingMutation } from "@/hooks/shopping-list/useShoppingMutation";

type Variables = { householdId: string; recipeId: string; keptIds: string[] };

/**
 * Takes a recipe back off the list: its amounts come off every item, and an
 * item nothing else needs leaves the list. Shows at once; the server's answer
 * replaces the touched rows.
 */
export function useRemoveRecipeFromShoppingList(onError?: (error: Error) => void) {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();
  const posthog = usePostHog();

  const mutation = useShoppingMutation({
    mutationFn: ({ householdId, recipeId }: Variables) =>
      shoppingListApi.removeRecipe(supabase, householdId, recipeId),
    optimistic: (items, { recipeId }) => removeRecipe(items, recipeId).items,
    onError,
    onSuccess: (rows, { householdId, keptIds }) => {
      const queryKey = queryKeys.shoppingList.items(householdId);
      const savedIds = new Set(rows.map((row) => row.id));
      // The server touched other rows than this device did (a partner bought
      // one meanwhile): its list wins whole rather than a guess at deletes.
      if (savedIds.size !== keptIds.length || keptIds.some((id) => !savedIds.has(id))) {
        void queryClient.invalidateQueries({ queryKey });
        return;
      }
      queryClient.setQueryData<ShoppingListItem[]>(queryKey, (items = []) =>
        mergeRows(items, rows.map(parseShoppingListItem))
      );
    },
  });

  return (householdId: string, recipeId: string, items: ShoppingListItem[]) => {
    const removal = removeRecipe(items, recipeId);
    if (removal.touchedCount === 0) return;
    mutation.mutate({ householdId, recipeId, keptIds: removal.keptIds });
    posthog?.capture(AnalyticsEvent.shoppingListRecipeRemoved, { count: removal.touchedCount });
  };
}
