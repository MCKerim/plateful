import { useSupabase } from "@/utils/supabase";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import { shoppingListApi } from "@/api/shopping-list.api";
import { markBought, putBack } from "@/lib/shopping-list/list";
import { useShoppingMutation } from "@/hooks/shopping-list/useShoppingMutation";

type Variables = { householdId: string; id: string; onList: boolean };

/** Ticks an item off (`onList: false`) or puts it back with its last amount. */
export function useSetOnList() {
  const { supabase } = useSupabase();
  const userId = useAppSelector(selectUser)?.id ?? null;

  return useShoppingMutation({
    mutationFn: ({ id, onList }: Variables) => shoppingListApi.setOnList(supabase, id, onList),
    optimistic: (items, { id, onList }) =>
      onList ? putBack(items, id, Date.now(), userId) : markBought(items, id, Date.now()),
  });
}
