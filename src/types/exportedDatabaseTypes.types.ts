import { Database } from "@/types/database.types";

export type Recipes = Database["public"]["Tables"]["recipes"]["Row"];
export type RecipeRatings = Database["public"]["Tables"]["recipe_ratings"]["Row"];
export type RecipeCollection = Database["public"]["Tables"]["collections"]["Row"];
export type RecipeCollectionMembership =
  Database["public"]["Tables"]["recipe_collections"]["Row"];
export type Household = Database["public"]["Tables"]["household"]["Row"];
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Invite = Database["public"]["Tables"]["invites"]["Row"];
export type MealPlanning = Database["public"]["Tables"]["meal_planning"]["Row"];
export type HouseholdSubscription = Database["public"]["Tables"]["household_subscriptions"]["Row"];
