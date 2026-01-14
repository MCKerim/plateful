// src/api/meal-planning.api.ts

import { SupabaseClient } from "@supabase/supabase-js";
import {
  MealPlannerItemRaw,
  PlannedItemSummary,
  PlannedItemSummaryRaw,
} from "@/types/meal-planning.types";
import { MealPlanning } from "@/types/exportedDatabaseTypes.types";

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
  ): Promise<MealPlanning | null> {
    const { data, error } = await supabase
      .from("meal_planning")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },
};
