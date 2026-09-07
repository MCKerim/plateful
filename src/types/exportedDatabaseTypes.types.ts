import { Database } from "@/types/database.types";

export type Recipes = Database["public"]["Tables"]["recipes"]["Row"];
export type RecipeRatings = Database["public"]["Tables"]["recipe_ratings"]["Row"];
export type RecipeCollection = Database["public"]["Tables"]["collections"]["Row"];
export type RecipeCollectionMembership = Database["public"]["Tables"]["recipe_collections"]["Row"];
export type Household = Database["public"]["Tables"]["household"]["Row"];
// `timezone` is a write-only mirror the native app reports for the server's
// plan reminders (like `language`); nothing here reads it, so the client's
// User never carries it.
export type User = Omit<Database["public"]["Tables"]["users"]["Row"], "timezone">;
export type MealPlanning = Database["public"]["Tables"]["meal_planning"]["Row"];
// Premium is no longer a per-household row: entitlements live on the user and
// the household's state is derived by the `household_entitlements` view. See
// `subscriptionApi` for the shape the app actually uses.
export type HouseholdEntitlement = Database["public"]["Views"]["household_entitlements"]["Row"];
