import RecipeCard from "@/components/general/RecipeCard";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import Fuse from "fuse.js";
import { useTranslation } from "react-i18next";
import Rive from "@rive-app/react-canvas";
import SortingModal from "@/components/general/SortingModal";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  resetFilter,
  selectCollectionSelection,
  selectSearchTerm,
  selectSorting,
  setCollectionSelection,
  setSearchTerm,
} from "@/redux/slices/filterAndSortingSlice";
import CollectionTile from "@/components/general/CollectionTile";
import { useScrollRestoration } from "@/hooks/general/useScrollRestoration";
import AddNewRecipeDrawer from "@/components/general/AddRecipeDrawer";
import OnboardingSheet from "@/components/onboarding/OnboardingSheet";
import CookbookIllustration from "@/components/onboarding/illustrations/CookbookIllustration";
import { useRecipes } from "@/hooks/cookbook/useRecipes";
import { useRecipeImports } from "@/hooks/cookbook/useRecipeImports";
import ImportCard from "@/components/general/ImportCard";
import { useCollections, useDeleteCollection } from "@/hooks/collections/useCollections";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import CollectionFormDialog from "@/components/collections/CollectionFormDialog";
import CollectionDeleteDialog from "@/components/collections/CollectionDeleteDialog";
import type { RecipeCollection } from "@/types/exportedDatabaseTypes.types";
import { toast } from "sonner";
import { filterRecipesByCollection } from "@/lib/collectionFiltering";

export default function Cookbook() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useScrollRestoration("cookbook-scroll");

  const { data: recipes = [], isLoading } = useRecipes();
  const { data: imports = [] } = useRecipeImports();
  const householdId = useAppSelector(selectHouseholdId);
  const { data: collections = [] } = useCollections(householdId);
  const deleteCollectionMutation = useDeleteCollection();

  const collectionSelection = useAppSelector(selectCollectionSelection);
  const sorting = useAppSelector(selectSorting);
  const searchTerm = useAppSelector(selectSearchTerm);

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
      .slice(0, 6);
    return [...importing, ...ready];
  }, [recipes]);

  const searchResults = useMemo(() => {
    let searchedRecipes = [...recipes];

    if (searchTerm.trim() !== "") {
      const results = fuse.search(searchTerm);
      searchedRecipes = results.map((result) => result.item);
    }

    searchedRecipes = filterRecipesByCollection(searchedRecipes, collectionSelection);

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

    return searchedRecipes;
  }, [searchTerm, sorting, collectionSelection, recipes, fuse]);

  const selectedCollection = collections.find(
    (collection) => collection.id === collectionSelection
  );
  const [collectionFormOpen, setCollectionFormOpen] = useState(false);
  const [collectionToEdit, setCollectionToEdit] = useState<RecipeCollection | null>(null);
  const [collectionToDelete, setCollectionToDelete] = useState<RecipeCollection | null>(null);

  useEffect(() => {
    if (
      collectionSelection &&
      collectionSelection !== "all" &&
      !collections.some((collection) => collection.id === collectionSelection)
    ) {
      dispatch(setCollectionSelection(null));
    }
  }, [collectionSelection, collections, dispatch]);

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

  function handleCreateCollection() {
    setCollectionToEdit(null);
    setCollectionFormOpen(true);
  }

  function handleEditCollection(collection: RecipeCollection) {
    setCollectionToEdit(collection);
    setCollectionFormOpen(true);
  }

  async function handleDeleteCollection() {
    if (!collectionToDelete) return;

    try {
      await deleteCollectionMutation.mutateAsync(collectionToDelete.id);
      if (collectionSelection === collectionToDelete.id) {
        dispatch(setCollectionSelection(null));
      }
      toast.success(t("collections.deleted", { name: collectionToDelete.name }));
      setCollectionToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error(t("collections.errors.deleteFailed"));
    }
  }

  return (
    <Layout showHeader={false}>
      <div className="sticky z-40 flex items-center w-full gap-1 my-1 top-safe-5">
        <Input
          className="rounded-full"
          type="text"
          placeholder={t("cookbook.enterRecipeName")}
          enterKeyHint="search"
          value={searchTerm}
          showDeleteButton={searchTerm.length > 0}
          onChange={(e) => dispatch(setSearchTerm(e.target.value))}
          onDelete={() => dispatch(setSearchTerm(""))}
        />

        <SortingModal />
      </div>

      {(collectionSelection !== null || searchTerm.trim() !== "") && (
        <div className="flex items-center gap-2">
          {collectionSelection !== null && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("collections.back")}
              onClick={() => dispatch(setCollectionSelection(null))}
            >
              <ChevronLeft />
            </Button>
          )}
          <h1 className="second-font text-lg font-bold">
            {selectedCollection?.name ?? t("collections.allRecipes")}
          </h1>
        </div>
      )}

      {collectionSelection === null && searchTerm.trim() === "" && (
        <>
          <div className="grid items-center justify-center grid-cols-2 gap-6">
            {collections.map((collection) => (
              <CollectionTile
                key={collection.id}
                id={collection.id}
                name={collection.name}
                colorKey={collection.color_key}
                onEdit={() => handleEditCollection(collection)}
                onDelete={() => setCollectionToDelete(collection)}
              />
            ))}

            <CollectionTile id="all" name={t("collections.allRecipes")} />
          </div>

          {(recentlyAddedRecipes.length > 0 || imports.length > 0) && (
            <div className="mt-6">
              <h2 className="second-font text-lg font-bold">{t("cookbook.recentlyAdded")}</h2>

              <div className="grid grid-cols-2 gap-2">
                {imports.map((recipeImport) => (
                  <ImportCard key={recipeImport.id} recipeImport={recipeImport} />
                ))}
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
        newCollectionClicked={handleCreateCollection}
      />

      <OnboardingSheet
        storageKey="onboarding_recipes_seen"
        titleKey="onboarding.recipes.title"
        bulletKeys={[
          "onboarding.recipes.bullet1",
          "onboarding.recipes.bullet2",
          "onboarding.recipes.bullet3",
        ]}
        illustration={<CookbookIllustration />}
      />

      {(collectionSelection !== null || searchTerm.trim() !== "") && (
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

      {isLoading && collectionSelection !== null && (
        <div className="flex items-center justify-center flex-1 w-full space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce-high [animation-delay:-0.4s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce-high [animation-delay:-0.2s]"></div>
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce-high"></div>
        </div>
      )}

      {(collectionSelection !== null || searchTerm.trim() !== "") &&
        !isLoading &&
        searchResults.length === 0 && (
          <div className="flex flex-col items-center justify-center w-full gap-2 mt-10">
            <div className="w-full h-[80px] mx-auto">
              <Rive src="/plateful-character.riv" artboard="Sad" />
            </div>

            <p className="flex justify-center italic font-bold">{t("cookbook.nothingFound")}</p>
          </div>
        )}

      {householdId && (
        <CollectionFormDialog
          key={`${collectionToEdit?.id ?? "new"}-${collectionFormOpen}`}
          open={collectionFormOpen}
          onOpenChange={setCollectionFormOpen}
          householdId={householdId}
          collection={collectionToEdit}
        />
      )}
      <CollectionDeleteDialog
        collection={collectionToDelete}
        loading={deleteCollectionMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setCollectionToDelete(null);
        }}
        onDelete={handleDeleteCollection}
      />
    </Layout>
  );
}
