import { Database } from "@/types/database.types";

export type Recipes = Database["public"]["Tables"]["recipes"]["Row"];
export type RecipeRatings = Database["public"]["Tables"]["recipe_ratings"]["Row"];
export type Household = Database["public"]["Tables"]["household"]["Row"];
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Invite = Database["public"]["Tables"]["invites"]["Row"];
export type MealPlanning = Database["public"]["Tables"]["meal_planning"]["Row"];