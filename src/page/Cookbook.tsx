import RecipeCard from "@/components/general/RecipeCard";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import Fuse from "fuse.js";
import { useTranslation } from "react-i18next";
import Rive from "@rive-app/react-canvas";
import SortingModal from "@/components/general/SortingModal";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  resetFilter,
  selectCategoryId,
  selectSearchTerm,
  selectSorting,
  setSearchTerm,
} from "@/redux/slices/filterAndSortingSlice";
import { categories, getTranslatedCategory } from "@/lib/recipeCategoryHelper/recipeCategoryHelper";
import CategoryButton from "@/components/general/CategoryButton";
import { useScrollRestoration } from "@/hooks/general/useScrollRestoration";
import AddNewRecipeDrawer from "@/components/general/AddRecipeDrawer";
import { useRecipes } from "@/hooks/cookbook/useRecipes";
import { CookbookRecipe } from "@/types/cookbook.types";

export default function Cookbook() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useScrollRestoration("cookbook-scroll");

  const { data: recipes = [], isLoading } = useRecipes();

  const categoryId = useAppSelector(selectCategoryId);
  const sorting = useAppSelector(selectSorting);
  const searchTerm = useAppSelector(selectSearchTerm);

  const [searchResults, setSearchResults] = useState<CookbookRecipe[]>([]);

  const fuse = useMemo(
    () =>
      new Fuse(recipes, {
        keys: ["recipeName"],
        includeScore: true,
        threshold: 0.4,
        distance: 100,
      }),
    [recipes]
  );

  // Get importing recipes and recently added recipes for the main page
  const recentlyAddedRecipes = useMemo(() => {
    const importing = recipes.filter((r) => r.status === "importing");
    const ready = recipes
      .filter((r) => r.status === "ready")
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 4);
    return [...importing, ...ready];
  }, [recipes]);

  useEffect(() => {
    let searchedRecipes = [...recipes];

    if (searchTerm.trim() !== "") {
      const results = fuse.search(searchTerm);
      searchedRecipes = results.map((result) => result.item);
    }

    if (categoryId !== null && categoryId !== 0) {
      searchedRecipes = searchedRecipes.filter((recipe) => recipe.category === categoryId);
    }

    searchedRecipes.sort((a, b) => {
      if (sorting === "newest") return b.created_at.localeCompare(a.created_at);
      if (sorting === "oldest") return a.created_at.localeCompare(b.created_at);
      if (sorting === "aToZ") return a.recipeName.localeCompare(b.recipeName);
      if (sorting === "rating") {
        if (a.avg_rating === null && b.avg_rating === null) {
          return 0;
        } else if (a.avg_rating === null) {
          return 1;
        } else if (b.avg_rating === null) {
          return -1;
        } else {
          return b.avg_rating - a.avg_rating;
        }
      }
      return 0;
    });

    setSearchResults(searchedRecipes);
  }, [searchTerm, sorting, categoryId, recipes, fuse]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      dispatch(resetFilter());
      navigate("/cookbook");
    };

    globalThis.addEventListener("popstate", handlePopState);

    return () => {
      globalThis.removeEventListener("popstate", handlePopState);
    };
  }, [dispatch, navigate]);

  function handleURLImportClicked() {
    navigate(`/urlImport`);
  }

  function handleImageImportClicked() {
    navigate("/imageImport");
  }

  function handleAddRecipe() {
    const params = searchTerm.trim()
      ? `?recipeNameFromSearch=${encodeURIComponent(searchTerm.trim())}`
      : "";

    navigate(`/recipe/add${params}`);
  }

  return (
    <Layout>
      <div className="sticky z-20 flex items-center w-full gap-1 my-1 top-14">
        <Input
          className="rounded-full"
          type="text"
          placeholder={t("cookbook.enterRecipeName")}
          value={searchTerm}
          showDeleteButton={searchTerm.length > 0}
          onChange={(e) => dispatch(setSearchTerm(e.target.value))}
          onDelete={() => dispatch(setSearchTerm(""))}
        />

        <SortingModal />
      </div>

      {(categoryId !== null || searchTerm.trim() !== "") && (
        <h1 className="second-font text-lg font-bold">
          {categoryId === 0 || categoryId === null
            ? t("categorys.allRecipes")
            : getTranslatedCategory(t, categoryId)}
        </h1>
      )}

      {categoryId === null && searchTerm.trim() === "" && (
        <>
          <div className="grid items-center justify-center grid-cols-2 gap-6">
            {categories.map((cat) => {
              return (
                <CategoryButton
                  key={cat.id}
                  id={cat.id}
                  name={getTranslatedCategory(t, cat.id)}
                  color={cat.color}
                />
              );
            })}

            <CategoryButton key={0} id={0} name={t("categorys.allRecipes")} />
          </div>

          {recentlyAddedRecipes.length > 0 && (
            <div className="mt-6">
              <h2 className="second-font text-lg font-bold mb-2">{t("cookbook.recentlyAdded")}</h2>
              <div className="grid grid-cols-2 gap-2">
                {recentlyAddedRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    id={recipe.id}
                    name={recipe.recipeName}
                    averageRating={recipe.avg_rating}
                    status={recipe.status}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <AddNewRecipeDrawer
        urlImportClicked={handleURLImportClicked}
        imageImportClicked={handleImageImportClicked}
        newRecipeClicked={handleAddRecipe}
      />

      {(categoryId !== null || searchTerm.trim() !== "") && (
        <div className="grid grid-cols-2 gap-2">
          {searchResults.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              id={recipe.id}
              name={recipe.recipeName}
              averageRating={recipe.avg_rating}
              status={recipe.status}
            />
          ))}
        </div>
      )}

      {isLoading && categoryId !== null && (
        <div className="flex items-center justify-center flex-1 w-full space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce-high [animation-delay:-0.4s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce-high [animation-delay:-0.2s]"></div>
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce-high"></div>
        </div>
      )}

      {(categoryId !== null || searchTerm.trim() !== "") &&
        !isLoading &&
        searchResults.length === 0 && (
          <div className="flex flex-col items-center justify-center w-full gap-2 mt-10">
            <div className="w-full h-[80px] mx-auto">
              <Rive src="/plateful-character.riv" artboard="Sad" />
            </div>

            <p className="flex justify-center italic font-bold">{t("cookbook.nothingFound")}</p>
          </div>
        )}
    </Layout>
  );
}
