import { useSupabase } from "@/utils/supabase";
import { shoppingListApi } from "@/api/shopping-list.api";
import { useShoppingMutation } from "@/hooks/shopping-list/useShoppingMutation";

/** Deletes an item for good, memory included: for typos, not for things bought. */
export function useDeleteShoppingItem() {
  const { supabase } = useSupabase();

  return useShoppingMutation({
    mutationFn: ({ id }: { householdId: string; id: string }) =>
      shoppingListApi.deleteItem(supabase, id),
    optimistic: (items, { id }) => items.filter((item) => item.id !== id),
  });
}
