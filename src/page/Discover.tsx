import RecipeCard from "@/components/atoms/RecipeCard";
import Layout from "@/components/layout/Layout";
import supabase from "@/utils/supabase";
import { useEffect, useState } from "react";

type Recipe = {
  id: number;
  recipeName: string;
  description: string;
};

export default function Discover() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    getRecipes();
  }, []);

  async function getRecipes() {
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
      setRecipes(newRecipes);
      return;
    }

    data.forEach((recipe) => {
      const newRecipe: Recipe = {
        id: recipe.id,
        recipeName: recipe.name,
        description: recipe.description ?? "",
      };
      newRecipes.push(newRecipe);
    });
    console.log("Items: ", newRecipes);
    setRecipes(newRecipes);
  }

  return (
    <Layout>
      <h1 className="text-2xl">Discover</h1>

      <div className="flex flex-col gap-2 items-center">
        {recipes.map((recipe, index) => (
          <RecipeCard
            key={index}
            id={recipe.id}
            name={recipe.recipeName}
            description={recipe.description}
          />
        ))}
      </div>
    </Layout>
  );
}
