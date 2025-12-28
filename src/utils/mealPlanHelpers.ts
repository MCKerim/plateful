import supabase from "./supabase";
import { MealPlanning } from "@/types/exportedDatabaseTypes.types";

export async function planRecipe(
  recipeId: number,
  householdId: number,
  plannedDate: Date | null,
  days: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("meal_planning").insert({
      recipe_id: recipeId,
      planned_date: plannedDate?.toDateString(),
      days: days,
      household_id: householdId,
    });

    if (error) {
      console.error("Error while planning recipe: ", error);
      return { success: false, error: "Error while planning recipe" };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error while planning recipe: ", error);
    return { success: false, error: "Unexpected error while planning recipe" };
  }
}

export async function getMealPlanningInfo(
  recipeId: number
): Promise<{ data: MealPlanning | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("meal_planning")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error while fetching meal planning info: ", error);
      return { data: null, error: "Error while fetching meal planning info" };
    }

    return { data: data && data.length > 0 ? data[0] : null };
  } catch (error) {
    console.error("Unexpected error while fetching meal planning info: ", error);
    return { data: null, error: "Unexpected error while fetching meal planning info" };
  }
}
