import supabase from "./supabase";

export type Recipe = {
  id: number;
  recipeName: string;
  description: string;
};

export async function getRecipes(): Promise<Recipe[]> {
  const { data } = await supabase
    .from("recipes")
    .select(
      `
      id,
      name,
      description
    `
    )
    .order("created_at", { ascending: true });

  const newRecipes: Recipe[] = [];

  if (!data) {
    return newRecipes;
  }

  data.forEach((recipe) => {
    const newRecipe: Recipe = {
      id: recipe.id,
      recipeName: recipe.name,
      description: recipe.description ?? "",
    };
    newRecipes.push(newRecipe);
  });

  return newRecipes;
}
