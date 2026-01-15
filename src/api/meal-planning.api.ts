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
        days,
        daysEaten,
        recipes (id, name)
      `
      )
      .or(
        `planned_date.is.null,and(planned_date.gte.${weekStart.toISOString()},planned_date.lte.${weekEnd.toISOString()})`
      )
      .order("created_at", { ascending: true })
      .returns<MealPlannerItemRaw[]>(); // Use .returns<T>() for proper typing

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
      .returns<PlannedItemSummaryRaw[]>(); // Use .returns<T>() for proper typing

    if (error) throw error;

    return (data ?? [])
      .filter(
        (item): item is PlannedItemSummaryRaw & { planned_date: string } =>
          item.planned_date !== null
      )
      .map((item) => ({
        planned_date: item.planned_date,
        recipe_name: item.recipes?.name ?? "Unknown",
      }));
  },

  async updateDate(
    supabase: SupabaseClient,
    id: number,
    plannedDate: string | null,
    days: number
  ): Promise<void> {
    const { error } = await supabase
      .from("meal_planning")
      .update({ planned_date: plannedDate, days })
      .eq("id", id);

    if (error) throw error;
  },

  async updateDaysEaten(
    supabase: SupabaseClient,
    id: number,
    daysEaten: number
  ): Promise<void> {
    const { error } = await supabase
      .from("meal_planning")
      .update({ daysEaten })
      .eq("id", id);

    if (error) throw error;
  },

  async delete(supabase: SupabaseClient, id: number): Promise<void> {
    const { error } = await supabase
      .from("meal_planning")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async create(
    supabase: SupabaseClient,
    recipeId: number,
    householdId: number,
    plannedDate: string | null,
    days: number
  ): Promise<void> {
    const { error } = await supabase.from("meal_planning").insert({
      recipe_id: recipeId,
      household_id: householdId,
      planned_date: plannedDate,
      days,
      daysEaten: 0,
    });

    if (error) throw error;
  },

  async getInfoByRecipe(
    supabase: SupabaseClient,
    recipeId: number
  ): Promise<RecipeMealPlanInfo> {
    const today = new Date();
    // Use local date string to avoid timezone issues
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // Get all meal plans for this recipe, ascending so closest date comes first
    const { data, error } = await supabase
      .from("meal_planning")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("planned_date", { ascending: true, nullsFirst: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return { activePlan: null, lastPlannedDate: null };
    }

    // Separate plans into categories
    const plansWithoutDate = data.filter((p) => p.planned_date === null);
    const futurePlans = data.filter(
      (p) => p.planned_date !== null && p.planned_date >= todayStr
    );

    // Find active plan: first check for closest future/today date, then check no-date plans
    // futurePlans are already sorted ascending, so first one is closest
    let activePlan = futurePlans.length > 0 ? futurePlans[0] : null;

    // If no future plan, check for a no-date plan that's not fully eaten
    if (!activePlan) {
      activePlan =
        plansWithoutDate.find((plan) => plan.daysEaten < plan.days) ?? null;
    }

    // Find the most recent past planned_date (for "last planned" display)
    const pastPlansWithDates = data.filter(
      (p) => p.planned_date !== null && p.planned_date < todayStr
    );
    // Get the most recent past date (last item since ascending order)
    const lastPlannedDate =
      pastPlansWithDates.length > 0
        ? pastPlansWithDates[pastPlansWithDates.length - 1].planned_date
        : null;

    return {
      activePlan: activePlan ?? null,
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
      .select("id, planned_date, days")
      .eq("recipe_id", recipeId)
      .gte("planned_date", weekStart.toISOString())
      .lte("planned_date", weekEnd.toISOString())
      .order("planned_date", { ascending: true })
      .returns<RecipePlanEntryRaw[]>();

    if (error) throw error;
    return data ?? [];
  },
};
