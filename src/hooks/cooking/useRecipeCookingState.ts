import { useMemo } from "react";
import { cookingState, type RecipeCookingState } from "@/lib/cooking/session";
import { useHouseholdCookingSessions } from "@/hooks/cooking/useHouseholdCookingSessions";

/** What the recipe's cook button reads, live: a partner starting or stopping flips it while the detail is open. */
export function useRecipeCookingState(recipeId: string | null): RecipeCookingState {
  const { data } = useHouseholdCookingSessions();
  return useMemo(() => {
    if (!recipeId || !data) return { kind: "none" };
    return cookingState(
      recipeId,
      data.mine.map((item) => ({ id: item.session.id, recipeId: item.session.recipeId })),
      data.joinable.map((item) => ({
        id: item.session.id,
        recipeId: item.session.recipeId,
        cookIds: item.cookIds,
      }))
    );
  }, [data, recipeId]);
}
