import RecipeCard from "@/components/atoms/RecipeCard";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import supabase from "@/utils/supabase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Fuse from "fuse.js";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Rive from "@rive-app/react-canvas";

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
      <div className="w-full my-1 sticky top-14 mb-2 z-10">
        <Input
          className="w-full rounded-full"
          type="text"
          placeholder={t("cookbook.enterRecipeName")}
          value={searchTerm}
          showDeleteButton={searchTerm.length > 0}
          onChange={(e) => setSearchTerm(e.target.value)}
          onDelete={() => setSearchTerm("")}
        />
      </div>

      <button
        className="p-2.5 fixed bottom-[5rem] right-[1rem] z-10 rounded-full bg-plateful text-background flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:bg-plateful/90 active:scale-95"
        onClick={handleAddRecipe}
      >
        <Plus size={34} />
      </button>

      <div className="grid grid-cols-2 gap-4">
        {loading && (
          <div className="flex space-x-2 justify-center items-center w-full flex-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce-high [animation-delay:-0.4s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce-high [animation-delay:-0.2s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce-high"></div>
          </div>
        )}

        {searchResults.map((recipe) => (
          <RecipeCard key={recipe.id} id={recipe.id} name={recipe.recipeName} />
        ))}
      </div>

      {!loading && searchResults.length === 0 && (
        <div className="w-full flex flex-col justify-center items-center mt-10 gap-2">
          <div className="w-full h-[80px] mx-auto">
            <Rive src="/plateful-character.riv" artboard="Sad" />
          </div>

          <p className="flex justify-center font-bold italic">
            Keine Rezepte gefunden...
          </p>
        </div>
      )}
    </Layout>
  );
}
