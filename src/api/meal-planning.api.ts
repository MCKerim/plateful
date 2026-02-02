import { SupabaseClient } from "@supabase/supabase-js";
import {
  MealPlannerItemRaw,
  PlannedItemSummary,
  PlannedItemSummaryRaw,
  RecipePlanEntryRaw,
  RecipeMealPlanInfo,
} from "@/types/meal-planning.types";

export const mealPlanningApi = {
  async getItemsForWeek(
    supabase: SupabaseClient,
    weekStart: Date,
    weekEnd: Date
  ): Promise<MealPlannerItemRaw[]> {
    const { data, error } = await supabase
      .from("meal_planning")
      .select(
        `
        id,
        planned_date,
        daysEaten,
        recipes (id, name)
      `
      )
      .or(
        `planned_date.is.null,and(planned_date.gte.${weekStart.toISOString()},planned_date.lte.${weekEnd.toISOString()})`
      )
      .order("created_at", { ascending: true })
      .returns<MealPlannerItemRaw[]>();

    if (error) throw error;
    return data ?? [];
  },

  async getSummaryForWeek(
    supabase: SupabaseClient,
    weekStart: Date,
    weekEnd: Date
  ): Promise<PlannedItemSummary[]> {
    const { data, error } = await supabase
      .from("meal_planning")
      .select(`planned_date, recipes (name)`)
      .gte("planned_date", weekStart.toISOString())
      .lte("planned_date", weekEnd.toISOString())
      .order("planned_date", { ascending: true })
      .returns<PlannedItemSummaryRaw[]>();

    if (error) throw error;

    return (data ?? [])
      .filter(
        (item): item is PlannedItemSummaryRaw & { planned_date: string } =>
          item.planned_date !== null
      )
      .map((item) => ({
        planned_date: item.planned_date,
        recipe_name: item.recipes?.name ?? "-",
      }));
  },

  async updateDate(
    supabase: SupabaseClient,
    id: number,
    plannedDate: string | null
  ): Promise<void> {
    const { error } = await supabase
      .from("meal_planning")
      .update({ planned_date: plannedDate })
      .eq("id", id);

    if (error) throw error;
  },

  async setEaten(supabase: SupabaseClient, id: number, eaten: boolean): Promise<void> {
    const { error } = await supabase
      .from("meal_planning")
      .update({ daysEaten: eaten ? 1 : 0 })
      .eq("id", id);

    if (error) throw error;
  },

  async delete(supabase: SupabaseClient, id: number): Promise<void> {
    const { error } = await supabase.from("meal_planning").delete().eq("id", id);

    if (error) throw error;
  },

  async create(
    supabase: SupabaseClient,
    recipeId: number,
    householdId: number,
    plannedDate: string | null
  ): Promise<void> {
    const { error } = await supabase.from("meal_planning").insert({
      recipe_id: recipeId,
      household_id: householdId,
      planned_date: plannedDate,
      days: 1,
      daysEaten: 0,
    });

    if (error) throw error;
  },

  async getInfoByRecipe(supabase: SupabaseClient, recipeId: number): Promise<RecipeMealPlanInfo> {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("meal_planning")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("planned_date", { ascending: true, nullsFirst: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return { activePlan: null, lastPlannedDate: null };
    }

    const plansWithoutDate = data.filter((p) => p.planned_date === null);
    const futurePlans = data.filter((p) => p.planned_date !== null && p.planned_date >= todayStr);

    let activePlan = futurePlans.length > 0 ? futurePlans[0] : null;

    if (!activePlan) {
      activePlan = plansWithoutDate.find((plan) => plan.daysEaten < 1) ?? null;
    }

    const pastPlansWithDates = data.filter(
      (p) => p.planned_date !== null && p.planned_date < todayStr
    );
    const lastPlannedDate =
      pastPlansWithDates.length > 0
        ? pastPlansWithDates[pastPlansWithDates.length - 1].planned_date
        : null;

    return {
      activePlan: activePlan
        ? {
            id: activePlan.id,
            planned_date: activePlan.planned_date,
            eaten: activePlan.daysEaten >= 1,
          }
        : null,
      lastPlannedDate,
    };
  },

  async getPlansForRecipeInWeek(
    supabase: SupabaseClient,
    recipeId: number,
    weekStart: Date,
    weekEnd: Date
  ): Promise<RecipePlanEntryRaw[]> {
    const { data, error } = await supabase
      .from("meal_planning")
      .select("id, planned_date")
      .eq("recipe_id", recipeId)
      .gte("planned_date", weekStart.toISOString())
      .lte("planned_date", weekEnd.toISOString())
      .order("planned_date", { ascending: true })
      .returns<RecipePlanEntryRaw[]>();

    if (error) throw error;
    return data ?? [];
  },
};
