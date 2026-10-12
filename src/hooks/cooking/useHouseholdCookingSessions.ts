import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { selectUser } from "@/redux/slices/userSlice";
import { queryKeys } from "@/lib/query-keys";
import { cookingApi } from "@/api/cooking.api";
import { recipeImageUrl } from "@/api/recipe.api";
import { parseSessionRow, splitSessions, STALE_AFTER_MS, type CookingSession } from "@/lib/cooking/session";
import { parseTimerRow, type CookingTimer } from "@/lib/cooking/timer";

export type CookingRecipeSummary = {
  id: string;
  name: string;
  imageUrl: string | null;
  baseServings: number | null;
  servingsUnit: string | null;
};

export type ActiveCookingSession = {
  session: CookingSession;
  recipe: CookingRecipeSummary;
  /** Every cook currently in the session. */
  cookIds: string[];
};

export type HouseholdCooking = {
  /** Sessions I am in: the pill and "Continue cooking". */
  mine: ActiveCookingSession[];
  /** A member's sessions I have not joined: the Home invite card and "Join". */
  joinable: ActiveCookingSession[];
  /** The timers of my sessions, for the pill's countdown. */
  timers: CookingTimer[];
};

/** The household's cooking right now, kept live by the realtime handler in App. */
export function useHouseholdCookingSessions() {
  const { supabase } = useSupabase();
  const householdId = useAppSelector(selectHouseholdId);
  const userId = useAppSelector(selectUser)?.id ?? null;

  return useQuery({
    queryKey: queryKeys.cooking.household(householdId ?? ""),
    queryFn: async (): Promise<HouseholdCooking> => {
      const since = new Date(Date.now() - STALE_AFTER_MS).toISOString();
      const rows = await cookingApi.getHouseholdSessions(supabase, householdId ?? "", since);
      const sessions: ActiveCookingSession[] = [];
      for (const row of rows) {
        if (!row.recipes) continue;
        sessions.push({
          session: parseSessionRow(row),
          recipe: {
            id: row.recipes.id,
            name: row.recipes.name,
            imageUrl: recipeImageUrl(supabase, row.recipes.image_path),
            baseServings: row.recipes.base_servings,
            servingsUnit: row.recipes.servings_unit,
          },
          cookIds: row.cooking_session_participants.map((participant) => participant.user_id),
        });
      }
      const { mine, joinable } = splitSessions(sessions, userId ?? "");
      const timerRows = await cookingApi.getTimersForSessions(
        supabase,
        mine.map((item) => item.session.id)
      );
      return { mine, joinable, timers: timerRows.map(parseTimerRow) };
    },
    enabled: !!householdId && !!userId,
  });
}
