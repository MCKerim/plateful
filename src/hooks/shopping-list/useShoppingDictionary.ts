import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { shoppingListApi } from "@/api/shopping-list.api";
import { parseDictionaryEntry } from "@/lib/shopping-list/item";

/** The global ingredient dictionary, for suggestions and where a typed line lands. */
export function useShoppingDictionary() {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.ingredientDictionary,
    queryFn: async () => (await shoppingListApi.getDictionary(supabase)).map(parseDictionaryEntry),
    staleTime: 1000 * 60 * 60,
  });
}
