import RecipeCard from "@/components/atoms/RecipeCard";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import supabase from "@/utils/supabase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Fuse from "fuse.js";
import { useTranslation } from "react-i18next";
import { Delete, Plus } from "lucide-react";
import { Card, CardDescription, CardHeader } from "../components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Recipe = {
  id: number;
  recipeName: string;
  description: string;
};

export default function Cookbook() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
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
    setLoading(false);
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

  function handleAddRecipe() {
    const path =
      "/recipe/add" +
      (searchTerm.trim() !== ""
        ? `?recipeNameFromSearch=${searchTerm.trim()}`
        : "");

    navigate(path);
  }

  // searchbar: pr-8 fixed bottom-[4.5rem]
  return (
    <Layout>
      <div className="w-full max-w-lg flex my-1 items-center gap-2 sticky top-14 mb-2 z-10">
        <Input
          className="w-full rounded-full"
          type="text"
          placeholder={t("cookbook.enterRecipeName")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {searchTerm && (
          <Button variant="outline" onClick={() => setSearchTerm("")}>
            <Delete />
          </Button>
        )}
      </div>

      <button
        className="p-2.5 fixed bottom-[5rem] right-[1rem] z-10 rounded-full bg-plateful text-background flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:bg-plateful/90 active:scale-95"
        onClick={handleAddRecipe}
      >
        <Plus size={34} />
      </button>

      <div className="flex flex-col gap-4 items-center">
        {loading && (
          <>
            {[...Array(4)].map((_, i) => (
              <div className="w-full max-w-lg" key={`skeleton_${i}`}>
                <Skeleton className="h-[128px] rounded-t-lg rounded-b-none mb-1" />

                <Skeleton className="h-[66.5px] rounded-b-lg rounded-t-none" />
              </div>
            ))}
          </>
        )}

        {searchResults.map((recipe, index) => (
          <RecipeCard key={index} id={recipe.id} name={recipe.recipeName} />
        ))}

        {!loading && searchResults.length === 0 && (
          <Card className="w-full">
            <CardHeader>
              <h1 className="font-bold text-lg leading-tight">
                {t("cookbook.nothingFound")}
              </h1>

              <CardDescription>{t("cookbook.addNewViaPlus")}</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </Layout>
  );
}
