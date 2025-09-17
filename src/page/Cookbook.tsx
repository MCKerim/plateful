import RecipeCard from "@/components/atoms/RecipeCard";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { useSupabase } from "@/utils/supabase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Fuse from "fuse.js";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import Rive from "@rive-app/react-canvas";
import SortingModal from "@/components/atoms/SortingModal";
import FilterModal from "@/components/atoms/FilterModal";
import { useAppSelector } from "@/redux/hooks";
import {
  selectCategoryId,
  selectSorting,
} from "@/redux/slices/filterAndSortingSlice";

export type Recipe = {
  id: number;
  recipeName: string;
  description: string;
  category?: number | null;
};

export default function Cookbook() {
  const { supabase } = useSupabase();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryId = useAppSelector(selectCategoryId);
  const sorting = useAppSelector(selectSorting);

  useEffect(() => {
    getRecipes();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchTerm, sorting, categoryId, recipes]);

  async function getRecipes() {
    const { data } = await supabase
      .from("recipes")
      .select(
        `
      id,
      name,
      description,
      category
    `
      )
      .order("created_at", { ascending: true });

    const newRecipes: Recipe[] = [];

    if (!data) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    data.forEach((recipe) => {
      const newRecipe: Recipe = {
        id: recipe.id,
        recipeName: recipe.name,
        description: recipe.description ?? "",
        category: recipe.category,
      };
      newRecipes.push(newRecipe);
    });

    setRecipes(newRecipes);
    setLoading(false);
  }

  const fuse = new Fuse(recipes, {
    keys: ["recipeName"],
    includeScore: true, // Provides a score for how good the match is
    threshold: 0.4, // Lower threshold = more strict matching
    distance: 100, // Maximum distance for a match
  });

  const handleSearch = async () => {
    let searchedRecipes = [...recipes];

    if (searchTerm.trim() !== "") {
      const results = fuse.search(searchTerm);
      searchedRecipes = results.map((result) => result.item);
    }

    if (categoryId !== 0) {
      searchedRecipes = searchedRecipes.filter(
        (recipe) => recipe.category === categoryId
      );
    }

    setSearchResults(searchedRecipes);
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
      <div className="sticky z-10 flex items-center w-full gap-2 my-1 top-14">
        <SortingModal />

        <Input
          className="rounded-full"
          type="text"
          placeholder={t("cookbook.enterRecipeName")}
          value={searchTerm}
          showDeleteButton={searchTerm.length > 0}
          onChange={(e) => setSearchTerm(e.target.value)}
          onDelete={() => setSearchTerm("")}
        />

        <FilterModal />
      </div>

      <button
        className="p-2.5 fixed bottom-[5rem] right-[1rem] z-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:bg-plateful/90 active:scale-95"
        onClick={handleAddRecipe}
      >
        <Plus size={34} />
      </button>

      <div className="grid grid-cols-2 gap-2">
        {searchResults.map((recipe) => (
          <RecipeCard key={recipe.id} id={recipe.id} name={recipe.recipeName} />
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center flex-1 w-full space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce-high [animation-delay:-0.4s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce-high [animation-delay:-0.2s]"></div>
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce-high"></div>
        </div>
      )}

      {!loading && searchResults.length === 0 && (
        <div className="flex flex-col items-center justify-center w-full gap-2 mt-10">
          <div className="w-full h-[80px] mx-auto">
            <Rive src="/plateful-character.riv" artboard="Sad" />
          </div>

          <p className="flex justify-center italic font-bold">
            {t("cookbook.nothingFound")}
          </p>
        </div>
      )}
    </Layout>
  );
}
