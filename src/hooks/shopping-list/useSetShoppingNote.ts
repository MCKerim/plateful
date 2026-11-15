import { useSupabase } from "@/utils/supabase";
import { shoppingListApi } from "@/api/shopping-list.api";
import { setNote } from "@/lib/shopping-list/list";
import { useShoppingMutation } from "@/hooks/shopping-list/useShoppingMutation";

/** The shopper's own words on a row ("Bio", "die große Packung"); a blank note clears it. */
export function useSetShoppingNote() {
  const { supabase } = useSupabase();

  return useShoppingMutation({
    mutationFn: ({ id, text }: { householdId: string; id: string; text: string }) =>
      shoppingListApi.setNote(supabase, id, text.trim() || null),
    optimistic: (items, { id, text }) => setNote(items, id, text),
  });
}
