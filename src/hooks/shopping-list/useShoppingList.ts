import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { queryKeys } from "@/lib/query-keys";
import { shoppingListApi } from "@/api/shopping-list.api";
import { parseShoppingListItem } from "@/lib/shopping-list/item";

/** The household's catalogue, on the list and off; kept live by the realtime handler in App. */
export function useShoppingList() {
  const { supabase } = useSupabase();
  const householdId = useAppSelector(selectHouseholdId);

  return useQuery({
    queryKey: queryKeys.shoppingList.items(householdId ?? ""),
    queryFn: async () =>
      (await shoppingListApi.getItems(supabase, householdId ?? "")).map(parseShoppingListItem),
    enabled: !!householdId,
  });
}
