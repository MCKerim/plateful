import RecipeCard from "@/components/atoms/RecipeCard";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import supabase from "@/utils/supabase";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import Fuse from "fuse.js";
import { useTranslation } from "react-i18next";
import { Delete, Plus } from "lucide-react";

type Recipe = {
  id: number;
  recipeName: string;
  description: string;
};

export default function Discover() {
  const { t } = useTranslation();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);

  useEffect(() => {
    getRecipes();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchTerm]);

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
      setSearchResults(newRecipes);
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
    setRecipes(newRecipes);
    setSearchResults(newRecipes);
  }

  const fuse = new Fuse(recipes, {
    keys: ["recipeName"],
    includeScore: true, // Provides a score for how good the match is
    threshold: 0.4, // Lower threshold = more strict matching
    distance: 100, // Maximum distance for a match
  });

  const handleSearch = async () => {
    if (searchTerm.trim() === "") {
      setSearchResults(recipes);
      return;
    }

    const results = fuse.search(searchTerm);
    const matchedRecipes = results.map((result) => result.item);

    setSearchResults(matchedRecipes);
  };

  return (
    <Layout>
      <h1 className="text-2xl mb-2">
        {t("discover.title")}{" "}
        {searchResults.length > 0 &&
          `• ${t("recipeWithCount", { count: searchResults.length })}`}
      </h1>

      <div className="flex flex-col gap-2 items-center">
        {searchResults.map((recipe, index) => (
          <RecipeCard
            key={index}
            id={recipe.id}
            name={recipe.recipeName}
            description={recipe.description}
          />
        ))}
      </div>

      <div className="w-full max-w-lg pr-8 fixed bottom-[4.5rem] bg-background">
        <div className="flex w-full items-center gap-2">
          <Input
            className="w-full"
            type="text"
            placeholder={t("discover.enterRecipeName")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {searchTerm && (
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              <Delete />
            </Button>
          )}

          <Button asChild>
            <Link
              to={
                "/recipe/add" +
                (searchTerm.trim() !== ""
                  ? `?recipeNameFromSearch=${searchTerm.trim()}`
                  : "")
              }
            >
              <Plus />
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
