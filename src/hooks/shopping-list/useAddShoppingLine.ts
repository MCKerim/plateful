import { useQueryClient } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { useSupabase } from "@/utils/supabase";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { selectUser } from "@/redux/slices/userSlice";
import { queryKeys } from "@/lib/query-keys";
import { AnalyticsEvent } from "@/lib/analyticsEvents";
import { shoppingListApi } from "@/api/shopping-list.api";
import {
  parseShoppingListItem,
  type ShoppingListItem,
  type TypedLine,
} from "@/lib/shopping-list/item";
import { addLine, mergeRows } from "@/lib/shopping-list/list";
import { useShoppingDictionary } from "@/hooks/shopping-list/useShoppingDictionary";
import { useShoppingMutation } from "@/hooks/shopping-list/useShoppingMutation";
import { randomId } from "@/utils/randomId";

type Variables = {
  householdId: string;
  line: TypedLine;
  rowId: string;
  isNewRow: boolean;
  items: ShoppingListItem[];
};

/**
 * Adds one typed line through `add_shopping_list_item`. Returns a function that
 * applies the add at once and reports whether it wrote anything: a bare name
 * already on the list adds nothing (the screen flashes it instead).
 */
export function useAddShoppingLine() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();
  const posthog = usePostHog();
  const householdId = useAppSelector(selectHouseholdId);
  const userId = useAppSelector(selectUser)?.id ?? null;
  const { data: dictionary = [] } = useShoppingDictionary();

  const mutation = useShoppingMutation({
    mutationFn: ({ householdId, line, rowId }: Variables) =>
      shoppingListApi.addItem(supabase, { id: rowId, householdId, line }),
    optimistic: (_items, { items }) => items,
    onSuccess: (rows, { householdId, rowId, isNewRow }) => {
      const saved = rows[0];
      if (!saved) return;
      const queryKey = queryKeys.shoppingList.items(householdId);
      // The server's dictionary knew a slug this device didn't and answered
      // with another row: a new optimistic row gives way to it, an existing
      // row this device changed is real, so the list is fetched instead.
      if (saved.id !== rowId && !isNewRow) {
        void queryClient.invalidateQueries({ queryKey });
        return;
      }
      queryClient.setQueryData<ShoppingListItem[]>(queryKey, (items = []) =>
        mergeRows(
          items.filter((item) => item.id !== rowId || saved.id === rowId),
          [parseShoppingListItem(saved)]
        )
      );
    },
  });

  return (line: TypedLine): boolean => {
    if (!householdId) return false;
    const current =
      queryClient.getQueryData<ShoppingListItem[]>(queryKeys.shoppingList.items(householdId)) ?? [];
    const addition = addLine(current, dictionary, line, {
      newId: randomId(),
      now: Date.now(),
      userId,
    });
    if (!addition) return false;
    mutation.mutate({ householdId, line, ...addition });
    if (addition.isNewRow) {
      posthog?.capture(AnalyticsEvent.shoppingListItemsAdded, { source: "manual", count: 1 });
    }
    return true;
  };
}
