import { useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { contentLanguage } from "@/lib/contentLanguage";
import { shoppingListApi } from "@/api/shopping-list.api";
import type { ShoppingAisle } from "@/lib/shopping-list/aisle";
import { parseShoppingListItem, type ShoppingListItem } from "@/lib/shopping-list/item";
import { editItem, mergeRows } from "@/lib/shopping-list/list";
import { useShoppingDictionary } from "@/hooks/shopping-list/useShoppingDictionary";
import { useShoppingMutation } from "@/hooks/shopping-list/useShoppingMutation";

export type EditShoppingItemVariables = {
  householdId: string;
  item: ShoppingListItem;
  name: string;
  /** Null when the amount field still holds its prefill: the stored amount goes as it is. */
  amountText: string | null;
  aisle: ShoppingAisle;
};

/** The edit sheet's save: name, amount set outright, and aisle in one RPC. */
export function useEditShoppingItem() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();
  const { data: dictionary = [] } = useShoppingDictionary();

  return useShoppingMutation({
    mutationFn: ({ item, name, amountText, aisle }: EditShoppingItemVariables) => {
      // Unchanged, the prefill is rounded text ("2.67 EL"); re-parsing it would
      // read as a change on the server and record a `set` entry.
      const edited = editItem(item, { name, amountText, aisle }, dictionary, contentLanguage());
      return shoppingListApi.updateItem(supabase, {
        id: item.id,
        name: edited.name,
        aisle,
        amount: edited,
        language: contentLanguage(),
      });
    },
    optimistic: (items, { item, name, amountText, aisle }) =>
      items.map((current) =>
        current.id === item.id
          ? editItem(current, { name, amountText, aisle }, dictionary, contentLanguage())
          : current
      ),
    onSuccess: (rows, { householdId }) => {
      queryClient.setQueryData<ShoppingListItem[]>(
        queryKeys.shoppingList.items(householdId),
        (items = []) => mergeRows(items, rows.map(parseShoppingListItem))
      );
    },
  });
}

/** Postgres' unique violation: another item already has this name. */
export function isDuplicateNameError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
