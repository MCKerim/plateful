import { useQueryClient } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { AnalyticsEvent } from "@/lib/analyticsEvents";
import { shoppingListApi } from "@/api/shopping-list.api";
import { parseShoppingListItem, type ShoppingListItem } from "@/lib/shopping-list/item";
import { mergeRows } from "@/lib/shopping-list/list";
import { useShoppingMutation } from "@/hooks/shopping-list/useShoppingMutation";

type Variables = {
  householdId: string;
  lines: { ingredientId: string; scale: number }[];
  source: "recipe" | "plan";
};

/**
 * Recipe ingredient rows onto the list through `add_ingredients_to_shopping_list`
 * (a recipe's checklist, the planner week's). Not optimistic: the merge is the
 * server's, and its answer replaces the rows it touched.
 */
export function useAddRecipeIngredients() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();
  const posthog = usePostHog();

  return useShoppingMutation({
    mutationFn: ({ householdId, lines }: Variables) =>
      shoppingListApi.addIngredients(supabase, householdId, lines),
    optimistic: (items) => items,
    onSuccess: (rows, { householdId, source }) => {
      // An unloaded list stays unloaded rather than holding only these rows.
      queryClient.setQueryData<ShoppingListItem[]>(
        queryKeys.shoppingList.items(householdId),
        (items) => items && mergeRows(items, rows.map(parseShoppingListItem))
      );
      posthog?.capture(AnalyticsEvent.shoppingListItemsAdded, { source, count: rows.length });
    },
  });
}
